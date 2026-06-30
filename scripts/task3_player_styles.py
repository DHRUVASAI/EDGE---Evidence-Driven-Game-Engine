"""
Task 3: Improve batter_type / bowler_type coverage via normalized + fuzzy name matching.
Builds player_style_lookup and reports before/after coverage on Delivery rows.
"""
from __future__ import annotations

import os
import re
import unicodedata

import psycopg2
from dotenv import load_dotenv
from psycopg2.extras import execute_values
from rapidfuzz import fuzz, process
from tqdm import tqdm

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
load_dotenv(os.path.join(PROJECT_DIR, ".env"))

FUZZY_THRESHOLD = 85
SPORTMONKS_CSV = os.environ.get(
    "SPORTMONKS_CSV",
    r"C:\Users\dhruv\Downloads\sport\players_data_with_all_info.csv",
)
BALL_BY_BALL_CSV = os.environ.get(
    "BALL_BY_BALL_CSV",
    r"C:\Users\dhruv\Downloads\sport\ball_by_ball_data.csv",
)
IPL_PLAYERS_CSV = os.environ.get(
    "IPL_PLAYERS_CSV",
    r"C:\Users\dhruv\Downloads\sport\players-data-updated.csv",
)


def get_connection():
    url = os.environ.get("DIRECT_URL") or os.environ.get("DATABASE_URL")
    return psycopg2.connect(url)


def normalize_name(name: str) -> str:
    if not name:
        return ""
    text = unicodedata.normalize("NFKD", name)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def last_name_initial(name: str) -> str:
    """e.g. 'V Kohli' -> 'kohli v', 'David Andrew Warner' -> 'warner d'"""
    norm = normalize_name(name)
    if not norm:
        return ""
    parts = norm.split()
    if len(parts) == 1:
        return parts[0]
    if len(parts[0]) <= 2 and len(parts) >= 2:
        # initials-first cricsheet style: V Kohli
        return f"{parts[-1]} {parts[0][0]}"
    return f"{parts[-1]} {parts[0][0]}"


def style_score(player: dict) -> int:
    score = 0
    if player.get("batting_style"):
        score += 2
    if player.get("bowling_style"):
        score += 2
    if player.get("source") == "ball_by_ball":
        score += 3
    if player.get("source") == "ipl_csv":
        score += 2
    if player.get("source") == "db":
        score += 1
    return score


def setup_schema(cur) -> None:
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS player_style_lookup (
            raw_name          TEXT PRIMARY KEY,
            player_id         TEXT,
            batting_style     TEXT,
            bowling_style     TEXT,
            match_confidence  TEXT NOT NULL,
            fuzzy_score       DOUBLE PRECISION
        )
        """
    )


def load_players(cur) -> list[dict]:
    cur.execute(
        """
        SELECT id, name, "fullName", "battingStyle", "bowlingStyle"
        FROM "Player"
        """
    )
    players: list[dict] = []
    index_by_norm: dict[str, int] = {}

    def add_player(pid, name, full_name, bat, bowl, source: str) -> None:
        display = full_name or name or ""
        if not display:
            return
        key = normalize_name(display)
        candidate = {
            "id": pid,
            "name": name or display,
            "full_name": display,
            "batting_style": bat,
            "bowling_style": bowl,
            "source": source,
            "norm_exact": normalize_name(display),
            "norm_initial": last_name_initial(name or display),
        }
        if key in index_by_norm:
            existing = players[index_by_norm[key]]
            if style_score(candidate) > style_score(existing):
                players[index_by_norm[key]] = candidate
            else:
                # merge missing styles from weaker record
                if not existing["batting_style"] and candidate["batting_style"]:
                    existing["batting_style"] = candidate["batting_style"]
                if not existing["bowling_style"] and candidate["bowling_style"]:
                    existing["bowling_style"] = candidate["bowling_style"]
            return
        index_by_norm[key] = len(players)
        players.append(candidate)

    for pid, name, full_name, bat, bowl in cur.fetchall():
        add_player(pid, name, full_name, bat, bowl, "db")

    # Enrich from IPL roster CSV (structured styles)
    if os.path.exists(IPL_PLAYERS_CSV):
        import csv

        with open(IPL_PLAYERS_CSV, encoding="utf-8") as f:
            for row in csv.DictReader(f):
                add_player(
                    row.get("player_id"),
                    row.get("player_name"),
                    row.get("player_full_name"),
                    row.get("bat_style"),
                    row.get("bowl_style"),
                    "ipl_csv",
                )

    # Enrich from SportMonks export (17k players)
    if os.path.exists(SPORTMONKS_CSV):
        import csv

        with open(SPORTMONKS_CSV, encoding="utf-8") as f:
            for row in csv.DictReader(f):
                bat = (row.get("battingstyle") or "").replace("-", " ").title()
                bowl = (row.get("bowlingstyle") or "").replace("-", " ").title()
                if bat:
                    bat = bat.replace("Right Hand", "Right hand").replace("Left Hand", "Left hand")
                add_player(
                    row.get("id"),
                    row.get("fullname"),
                    row.get("fullname"),
                    bat or None,
                    bowl or None,
                    "sportmonks",
                )

    # Per-delivery style observations from IPL ball-by-ball export
    if os.path.exists(BALL_BY_BALL_CSV):
        import csv
        from collections import Counter

        bat_obs: dict[str, Counter] = {}
        bowl_obs: dict[str, Counter] = {}
        with open(BALL_BY_BALL_CSV, encoding="utf-8", errors="replace") as f:
            for row in csv.DictReader(f):
                batter = (row.get("batter") or "").strip()
                bowler = (row.get("bowler") or "").strip()
                bat_type = (row.get("batsman_type") or "").strip()
                bowl_type = (row.get("bowler_type") or "").strip()
                if batter and bat_type:
                    bat_obs.setdefault(batter, Counter())[bat_type] += 1
                if bowler and bowl_type:
                    bowl_obs.setdefault(bowler, Counter())[bowl_type] += 1

        all_names = set(bat_obs) | set(bowl_obs)
        for name in all_names:
            bat = bat_obs.get(name, Counter()).most_common(1)
            bowl = bowl_obs.get(name, Counter()).most_common(1)
            add_player(
                f"bball-{normalize_name(name)}",
                name,
                name,
                bat[0][0] if bat else None,
                bowl[0][0] if bowl else None,
                "ball_by_ball",
            )

    return players


def coverage_before(cur) -> tuple[float, float]:
    cur.execute(
        """
        SELECT
          COUNT(DISTINCT d.id) AS total,
          COUNT(DISTINCT d.id) FILTER (WHERE pb."battingStyle" IS NOT NULL) AS bat,
          COUNT(DISTINCT d.id) FILTER (WHERE pw."bowlingStyle" IS NOT NULL) AS bowl
        FROM "Delivery" d
        LEFT JOIN "Player" pb ON pb.name = d.batter
        LEFT JOIN "Player" pw ON pw.name = d.bowler
        """
    )
    total, bat, bowl = cur.fetchone()
    return 100.0 * bat / total, 100.0 * bowl / total


def coverage_after(cur) -> tuple[float, float]:
    cur.execute(
        """
        SELECT
          COUNT(DISTINCT d.id) AS total,
          COUNT(DISTINCT d.id) FILTER (WHERE bl_bat.batting_style IS NOT NULL) AS bat,
          COUNT(DISTINCT d.id) FILTER (WHERE bl_bowl.bowling_style IS NOT NULL) AS bowl
        FROM "Delivery" d
        LEFT JOIN player_style_lookup bl_bat ON bl_bat.raw_name = d.batter
        LEFT JOIN player_style_lookup bl_bowl ON bl_bowl.raw_name = d.bowler
        """
    )
    total, bat, bowl = cur.fetchone()
    return 100.0 * bat / total, 100.0 * bowl / total


def collect_delivery_names(cur) -> set[str]:
    cur.execute(
        """
        SELECT DISTINCT name FROM (
            SELECT batter AS name FROM "Delivery"
            UNION
            SELECT bowler AS name FROM "Delivery"
        ) u
        WHERE name IS NOT NULL AND name <> ''
        """
    )
    return {row[0] for row in cur.fetchall()}


def pick_best(candidates: list[dict]) -> dict | None:
    if not candidates:
        return None
    return max(candidates, key=style_score)


def build_exact_map(players: list[dict]) -> dict[str, list[dict]]:
    exact_map: dict[str, list[dict]] = {}
    for p in players:
        keys = {p["norm_exact"], normalize_name(p.get("name", ""))}
        for key in keys:
            if key:
                exact_map.setdefault(key, []).append(p)
    return exact_map


def build_initial_map(players: list[dict]) -> dict[str, list[dict]]:
    initial_map: dict[str, list[dict]] = {}
    for p in players:
        if p["norm_initial"]:
            initial_map.setdefault(p["norm_initial"], []).append(p)
    return initial_map


def build_lookup(raw_names: set[str], players: list[dict]) -> tuple[list[tuple], list[str]]:
    exact_map = build_exact_map(players)
    initial_map = build_initial_map(players)
    fuzzy_choices = {p["full_name"]: p for p in players if p["full_name"]}
    choice_names = list(fuzzy_choices.keys())

    results = []
    unmatched = []

    for raw in tqdm(sorted(raw_names), desc="Matching player names"):
        norm = normalize_name(raw)
        init = last_name_initial(raw)

        matched = None
        confidence = None
        score = None

        exact_candidates = exact_map.get(norm, [])
        if exact_candidates:
            matched = pick_best(exact_candidates)
            confidence = "exact"
            score = 100.0
        else:
            init_candidates = initial_map.get(init, [])
            if init_candidates:
                matched = pick_best(init_candidates)
                confidence = "normalized"
                score = 95.0
            else:
                hit = process.extractOne(
                    raw,
                    choice_names,
                    scorer=fuzz.token_sort_ratio,
                    score_cutoff=FUZZY_THRESHOLD,
                )
                if hit:
                    # Consider near-ties and prefer style-rich candidate
                    near = process.extract(
                        raw,
                        choice_names,
                        scorer=fuzz.token_sort_ratio,
                        limit=5,
                    )
                    fuzzy_candidates = [
                        fuzzy_choices[name]
                        for name, sc, _ in near
                        if sc >= FUZZY_THRESHOLD
                    ]
                    matched = pick_best(fuzzy_candidates)
                    confidence = "fuzzy"
                    score = float(hit[1])

        if matched:
            results.append(
                (
                    raw,
                    matched["id"],
                    matched["batting_style"],
                    matched["bowling_style"],
                    confidence,
                    score,
                )
            )
        else:
            unmatched.append(raw)

    return results, unmatched


def main() -> None:
    conn = get_connection()
    conn.autocommit = False
    cur = conn.cursor()

    try:
        setup_schema(cur)
        conn.commit()

        print("=== Task 3: Player style matching ===")
        bat_before, bowl_before = coverage_before(cur)
        print(f"BEFORE (exact Player.name join):")
        print(f"  batter_type coverage: {bat_before:.2f}%")
        print(f"  bowler_type coverage: {bowl_before:.2f}%")

        players = load_players(cur)
        print(f"\nPlayer table rows: {len(players):,}")

        raw_names = collect_delivery_names(cur)
        print(f"Unique batter/bowler names in Delivery: {len(raw_names):,}")

        rows, unmatched = build_lookup(raw_names, players)

        cur.execute("TRUNCATE player_style_lookup")
        execute_values(
            cur,
            """
            INSERT INTO player_style_lookup
                (raw_name, player_id, batting_style, bowling_style,
                 match_confidence, fuzzy_score)
            VALUES %s
            """,
            rows,
            page_size=1000,
        )
        conn.commit()

        print(f"\nplayer_style_lookup rows: {len(rows):,}")
        print("Match confidence breakdown:")
        cur.execute(
            """
            SELECT match_confidence, COUNT(*)
            FROM player_style_lookup
            GROUP BY match_confidence
            ORDER BY COUNT(*) DESC
            """
        )
        for conf, c in cur.fetchall():
            print(f"  {conf:12s} {c:>6,}")

        print("\nAFTER (via player_style_lookup):")
        bat_after, bowl_after = coverage_after(cur)
        print(f"  batter_type coverage: {bat_before:.2f}% -> {bat_after:.2f}%")
        print(f"  bowler_type coverage: {bowl_before:.2f}% -> {bowl_after:.2f}%")

        print(f"\nUnmatched names after both passes: {len(unmatched):,}")
        print("Sample unmatched (up to 30):")
        for name in unmatched[:30]:
            print(f"  {name}")

        cur.execute(
            """
            SELECT raw_name, batting_style, bowling_style,
                   match_confidence, fuzzy_score
            FROM player_style_lookup
            WHERE match_confidence = 'fuzzy'
            ORDER BY fuzzy_score ASC
            LIMIT 5
            """
        )
        print("\nLowest-score fuzzy matches (review candidates):")
        for row in cur.fetchall():
            print(" ", row)

    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
