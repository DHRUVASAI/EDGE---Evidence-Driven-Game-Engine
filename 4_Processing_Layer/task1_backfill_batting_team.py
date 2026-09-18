"""
Task 1: Extract innings batting teams from Cricsheet JSON and backfill Delivery.battingTeam.

Convention:
  - Match.matchId  = JSON filename stem (e.g. "335982", "wi_212064")
  - Delivery.matchId = Match.id (internal PK) — join via Match for backfill
  - innings_team.matchId stores the Cricsheet id (same as Match.matchId)
  - Delivery.inning = 1-based index matching enumerate(innings) in ingest_jsons.py
"""
from __future__ import annotations

import json
import os
import sys
from glob import glob

import psycopg2
from dotenv import load_dotenv
from psycopg2.extras import execute_values
from tqdm import tqdm

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
load_dotenv(os.path.join(PROJECT_DIR, ".env"))

BASE_DIR = os.environ.get("CRICSHEET_DIR", r"C:\Users\dhruv\Downloads\sport")
FOLDERS = ["ipl", "odis", "t20", "tests", "odms", "mdms"]
BATCH_SIZE = 2000


def get_connection():
    url = os.environ.get("DIRECT_URL") or os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL / DIRECT_URL not set in .env")
    return psycopg2.connect(url)


def collect_json_files() -> list[str]:
    files: list[str] = []
    for folder in FOLDERS:
        folder_path = os.path.join(BASE_DIR, folder)
        files.extend(glob(os.path.join(folder_path, "*.json")))
    return sorted(set(files))


def extract_innings_rows(filepath: str) -> list[tuple[str, int, str]]:
    match_id = os.path.basename(filepath).replace(".json", "")
    with open(filepath, encoding="utf-8") as f:
        data = json.load(f)

    rows: list[tuple[str, int, str]] = []
    for inning_idx, inning in enumerate(data.get("innings", [])):
        team = inning.get("team")
        if team:
            rows.append((match_id, inning_idx + 1, team))
    return rows


def setup_schema(cur) -> None:
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS innings_team (
            "matchId" TEXT NOT NULL,
            inning INT NOT NULL,
            "battingTeam" TEXT NOT NULL,
            PRIMARY KEY ("matchId", inning)
        )
        """
    )
    cur.execute(
        """
        ALTER TABLE "Delivery"
        ADD COLUMN IF NOT EXISTS "battingTeam" TEXT
        """
    )


def load_innings_team(cur, rows: list[tuple[str, int, str]]) -> int:
    if not rows:
        return 0
    execute_values(
        cur,
        """
        INSERT INTO innings_team ("matchId", inning, "battingTeam")
        VALUES %s
        ON CONFLICT ("matchId", inning) DO UPDATE
        SET "battingTeam" = EXCLUDED."battingTeam"
        """,
        rows,
        page_size=BATCH_SIZE,
    )
    return len(rows)


def backfill_delivery(cur) -> None:
    cur.execute(
        """
        UPDATE "Delivery" d
        SET "battingTeam" = it."battingTeam"
        FROM innings_team it
        JOIN "Match" m ON m."matchId" = it."matchId"
        WHERE d."matchId" = m.id
          AND d.inning = it.inning
        """
    )


def print_verification(cur) -> None:
    cur.execute("SELECT COUNT(*) FROM innings_team")
    innings_rows = cur.fetchone()[0]

    cur.execute('SELECT COUNT(*) FROM "Delivery"')
    total_deliveries = cur.fetchone()[0]

    cur.execute('SELECT COUNT(*) FROM "Delivery" WHERE "battingTeam" IS NULL')
    null_batting = cur.fetchone()[0]

    cur.execute('SELECT COUNT(*) FROM "Delivery" WHERE "battingTeam" IS NOT NULL')
    filled_batting = cur.fetchone()[0]

    pct_null = 100.0 * null_batting / total_deliveries if total_deliveries else 0.0
    pct_filled = 100.0 * filled_batting / total_deliveries if total_deliveries else 0.0

    print("\n=== Task 1 Verification ===")
    print(f"innings_team rows:              {innings_rows:,}")
    print(f"Delivery total:                 {total_deliveries:,}")
    print(f"Delivery battingTeam NOT NULL:  {filled_batting:,} ({pct_filled:.4f}%)")
    print(f"Delivery battingTeam NULL:      {null_batting:,} ({pct_null:.4f}%)")

    cur.execute(
        """
        SELECT m."matchId", d.inning, d."battingTeam", d.over, d.ball,
               d.batter, d.bowler, d."runsTotal"
        FROM "Delivery" d
        JOIN "Match" m ON m.id = d."matchId"
        WHERE d."battingTeam" IS NOT NULL
        ORDER BY m.date DESC NULLS LAST, d.inning, d.over, d.ball
        LIMIT 5
        """
    )
    print("\nSample backfilled rows:")
    for row in cur.fetchall():
        print(" ", row)

    if null_batting > 0:
        cur.execute(
            """
            SELECT m."matchId", d.inning, COUNT(*) AS c
            FROM "Delivery" d
            JOIN "Match" m ON m.id = d."matchId"
            WHERE d."battingTeam" IS NULL
            GROUP BY m."matchId", d.inning
            ORDER BY c DESC
            LIMIT 10
            """
        )
        print("\nTop NULL battingTeam groups (matchId, inning, count):")
        for row in cur.fetchall():
            print(" ", row)


def main() -> None:
    files = collect_json_files()
    if not files:
        print(f"No JSON files found under {BASE_DIR}/{{{','.join(FOLDERS)}}}")
        sys.exit(1)

    print(f"Found {len(files):,} Cricsheet JSON files")
    print("Match.matchId convention: filename stem without .json")
    print("Delivery.matchId convention: internal Match.id (joined via Match for backfill)")

    conn = get_connection()
    conn.autocommit = False
    cur = conn.cursor()

    try:
        setup_schema(cur)
        conn.commit()

        all_rows: list[tuple[str, int, str]] = []
        for filepath in tqdm(files, desc="Extracting innings teams"):
            try:
                all_rows.extend(extract_innings_rows(filepath))
            except Exception as exc:
                print(f"\nWarning: failed to parse {filepath}: {exc}")

        print(f"Extracted {len(all_rows):,} (matchId, inning, team) rows from JSON")

        cur.execute("TRUNCATE innings_team")
        inserted = load_innings_team(cur, all_rows)
        conn.commit()
        print(f"Loaded {inserted:,} rows into innings_team")

        print("Backfilling Delivery.battingTeam ...")
        backfill_delivery(cur)
        updated = cur.rowcount
        conn.commit()
        print(f"UPDATE touched {updated:,} delivery rows")

        print_verification(cur)
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
