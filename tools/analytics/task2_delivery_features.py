"""
Task 2: Materialize delivery_features for T20 innings 1-2 with situational context.
Phase rules are parameterized via PHASE_RULES (easy to extend for ODI later).
"""
from __future__ import annotations

import os

import psycopg2
from dotenv import load_dotenv

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
load_dotenv(os.path.join(PROJECT_DIR, ".env"))

# T20 phase boundaries (over is 0-indexed in Cricsheet / this DB)
PHASE_RULES = {
    "T20": [
        ("powerplay", 0, 6),   # over < 6
        ("middle", 6, 16),     # over < 16
        ("death", 16, 999),    # else
    ],
    # Future ODI example:
    # "ODI": [("powerplay", 0, 10), ("middle", 10, 40), ("death", 40, 999)],
}

T20_OVERS = 20
T20_BALLS = T20_OVERS * 6


def phase_case_sql(format_key: str = "T20") -> str:
    rules = PHASE_RULES[format_key]
    parts = []
    for name, lo, hi in rules:
        if hi >= 999:
            parts.append(f"ELSE '{name}'")
        else:
            parts.append(f"WHEN d.over < {hi} THEN '{name}'")
    return "CASE " + " ".join(parts) + " END"


def get_connection():
    url = os.environ.get("DIRECT_URL") or os.environ.get("DATABASE_URL")
    return psycopg2.connect(url)


CREATE_SQL = """
DROP TABLE IF EXISTS delivery_features;

CREATE TABLE delivery_features (
    delivery_id       TEXT PRIMARY KEY,
    match_pk          TEXT NOT NULL,
    match_cricsheet_id TEXT NOT NULL,
    format            TEXT NOT NULL,
    inning            INT NOT NULL,
    over              INT NOT NULL,
    ball              INT NOT NULL,
    batter            TEXT NOT NULL,
    bowler            TEXT NOT NULL,
    batting_team      TEXT,
    venue             TEXT,
    runs_on_ball      INT NOT NULL,
    runs_at_ball      INT NOT NULL,
    wickets_at_ball   INT NOT NULL,
    balls_remaining   INT NOT NULL,
    current_rr        DOUBLE PRECISION,
    target_score      INT,
    required_rr       DOUBLE PRECISION,
    match_phase       TEXT NOT NULL
);

CREATE INDEX idx_df_match_inning ON delivery_features (match_pk, inning);
CREATE INDEX idx_df_phase ON delivery_features (match_phase);
CREATE INDEX idx_df_bowler ON delivery_features (bowler);
"""


def build_insert_sql() -> str:
    phase_expr = phase_case_sql("T20")
    return f"""
INSERT INTO delivery_features (
    delivery_id, match_pk, match_cricsheet_id, format, inning, over, ball,
    batter, bowler, batting_team, venue, runs_on_ball,
    runs_at_ball, wickets_at_ball, balls_remaining, current_rr,
    target_score, required_rr, match_phase
)
WITH base AS (
    SELECT
        d.id AS delivery_id,
        d."matchId" AS match_pk,
        m."matchId" AS match_cricsheet_id,
        m.format,
        d.inning,
        d.over,
        d.ball,
        d.batter,
        d.bowler,
        d."battingTeam" AS batting_team,
        m.venue,
        d."runsTotal" AS runs_on_ball,
        CASE WHEN d.wicket IS NOT NULL THEN 1 ELSE 0 END AS is_wicket
    FROM "Delivery" d
    JOIN "Match" m ON m.id = d."matchId"
    WHERE m.format = 'T20'
      AND d.inning IN (1, 2)
),
windowed AS (
    SELECT
        b.*,
        SUM(runs_on_ball) OVER w AS runs_at_ball,
        SUM(is_wicket) OVER w AS wickets_at_ball,
        ({T20_BALLS} - (b.over * 6 + b.ball)) AS balls_remaining
    FROM base b
    WINDOW w AS (
        PARTITION BY b.match_pk, b.inning
        ORDER BY b.over, b.ball
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    )
),
with_rr AS (
    SELECT
        w.*,
        CASE
            WHEN (w.over * 6 + w.ball) > 0
            THEN w.runs_at_ball::double precision
                 / ((w.over * 6 + w.ball)::double precision / 6.0)
            ELSE 0.0
        END AS current_rr
    FROM windowed w
),
first_innings AS (
    SELECT match_pk, MAX(runs_at_ball) AS innings1_runs
    FROM with_rr
    WHERE inning = 1
    GROUP BY match_pk
),
enriched AS (
    SELECT
        w.*,
        CASE
            WHEN w.inning = 2 THEN fi.innings1_runs + 1
            ELSE NULL
        END AS target_score,
        {phase_expr.replace('d.', 'w.')} AS match_phase
    FROM with_rr w
    LEFT JOIN first_innings fi ON fi.match_pk = w.match_pk
)
SELECT
    delivery_id, match_pk, match_cricsheet_id, format, inning, over, ball,
    batter, bowler, batting_team, venue, runs_on_ball,
    runs_at_ball, wickets_at_ball, balls_remaining, current_rr,
    target_score,
    CASE
        WHEN inning = 2
         AND balls_remaining > 0
         AND target_score IS NOT NULL
        THEN (target_score - runs_at_ball)::double precision
             / (balls_remaining::double precision / 6.0)
        ELSE NULL
    END AS required_rr,
    match_phase
FROM enriched;
"""


def verify(cur) -> None:
    cur.execute("SELECT COUNT(*) FROM delivery_features")
    total = cur.fetchone()[0]

    cur.execute(
        """
        SELECT match_phase, COUNT(*) AS c
        FROM delivery_features
        GROUP BY match_phase
        ORDER BY c DESC
        """
    )
    phases = cur.fetchall()

    cur.execute(
        """
        SELECT delivery_id, match_cricsheet_id, inning, over, ball,
               batter, bowler, batting_team, runs_at_ball, wickets_at_ball,
               balls_remaining, ROUND(current_rr::numeric, 2) AS current_rr,
               target_score, ROUND(required_rr::numeric, 2) AS required_rr,
               match_phase
        FROM delivery_features
        ORDER BY match_cricsheet_id, inning, over, ball
        LIMIT 5
        """
    )
    samples = cur.fetchall()

    print("\n=== Task 2 Verification ===")
    print(f"delivery_features rows: {total:,}")
    print("Rows by match_phase:")
    for phase, count in phases:
        print(f"  {phase:12s} {count:>10,}")

    print("\nSample rows:")
    for row in samples:
        print(" ", row)


def main() -> None:
    conn = get_connection()
    conn.autocommit = False
    cur = conn.cursor()
    try:
        print("Creating delivery_features table ...")
        cur.execute(CREATE_SQL)
        conn.commit()

        print("Populating delivery_features (T20, innings 1-2) ...")
        cur.execute(build_insert_sql())
        inserted = cur.rowcount
        conn.commit()
        print(f"Inserted {inserted:,} rows")

        verify(cur)
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
