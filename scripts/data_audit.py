"""PostgreSQL data quality audit for CricMetrics Delivery grain."""
import json
import time
from datetime import datetime

import psycopg2
import psycopg2.extras

DB_URL = "postgresql://postgres:Laasya%40123@localhost:5432/cricmetrics"


def q(cur, sql, params=None):
    cur.execute(sql, params)
    return cur.fetchall()


def main():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    print("=" * 70)
    print("1. ROW COUNTS PER TABLE")
    print("=" * 70)
    tables = ["Player", "Match", "Delivery", "CareerStat", "AuctionHistory"]
    counts = {}
    for t in tables:
        cur.execute(f'SELECT COUNT(*) FROM "{t}"')
        counts[t] = cur.fetchone()[0]
        print(f"  {t:20s} {counts[t]:>12,}")

    print("\n" + "=" * 70)
    print("2. GRAIN CHECK — delivery sequence within a match")
    print("=" * 70)
    cur.execute("""
        SELECT m."matchId", d.inning, d.over, d.ball, d.batter, d.bowler,
               d."runsTotal", d.wicket IS NOT NULL AS has_wicket
        FROM "Delivery" d
        JOIN "Match" m ON m.id = d."matchId"
        WHERE m."matchId" = (
            SELECT m2."matchId" FROM "Match" m2
            JOIN "Delivery" d2 ON d2."matchId" = m2.id
            GROUP BY m2."matchId" HAVING COUNT(*) > 200
            ORDER BY m2."matchId" LIMIT 1
        )
        ORDER BY d.inning, d.over, d.ball
        LIMIT 25
    """)
    rows = cur.fetchall()
    print(f"  Sample match (cricsheet id): {rows[0][0] if rows else 'N/A'}")
    print(f"  {'inning':>6} {'over':>4} {'ball':>4} {'batter':<18} {'bowler':<14} {'runs':>4} wkt")
    print("  " + "-" * 60)
    for r in rows:
        print(f"  {r[1]:>6} {r[2]:>4} {r[3]:>4} {r[4]:<18} {r[5]:<14} {r[6]:>4} {'Y' if r[7] else 'N'}")

    print("\n" + "=" * 70)
    print("3. NULL / EMPTY COUNTS — Delivery + Match (joinable context)")
    print("=" * 70)
    delivery_cols = [
        ("inning", 'd.inning IS NULL'),
        ("over", 'd.over IS NULL'),
        ("ball", 'd.ball IS NULL'),
        ("batter", 'd.batter IS NULL OR d.batter = \'\''),
        ("bowler", 'd.bowler IS NULL OR d.bowler = \'\''),
        ("nonStriker", 'd."nonStriker" IS NULL OR d."nonStriker" = \'\''),
        ("runsBatter", 'd."runsBatter" IS NULL'),
        ("runsExtras", 'd."runsExtras" IS NULL'),
        ("runsTotal", 'd."runsTotal" IS NULL'),
        ("wicket (json)", 'd.wicket IS NULL'),
        ("extras (json)", 'd.extras IS NULL'),
    ]
    total_d = counts["Delivery"]
    for label, cond in delivery_cols:
        cur.execute(f'SELECT COUNT(*) FROM "Delivery" d WHERE {cond}')
        n = cur.fetchone()[0]
        pct = 100.0 * n / total_d if total_d else 0
        print(f"  Delivery.{label:18s} null/empty: {n:>10,} ({pct:5.2f}%)")

    match_cols = [
        ("format", 'm.format IS NULL OR m.format = \'\''),
        ("date", 'm.date IS NULL'),
        ("venue", 'm.venue IS NULL OR m.venue = \'\''),
        ("city", 'm.city IS NULL OR m.city = \'\''),
        ("team1", 'm.team1 IS NULL OR m.team1 = \'\''),
        ("team2", 'm.team2 IS NULL OR m.team2 = \'\''),
        ("winner", 'm.winner IS NULL OR m.winner = \'\''),
        ("season", 'm.season IS NULL OR m.season = \'\''),
        ("tossWinner", 'm."tossWinner" IS NULL OR m."tossWinner" = \'\''),
        ("tossDecision", 'm."tossDecision" IS NULL OR m."tossDecision" = \'\''),
    ]
    total_m = counts["Match"]
    print()
    for label, cond in match_cols:
        cur.execute(f'SELECT COUNT(*) FROM "Match" m WHERE {cond}')
        n = cur.fetchone()[0]
        pct = 100.0 * n / total_m if total_m else 0
        print(f"  Match.{label:18s} null/empty: {n:>10,} ({pct:5.2f}%)")

    # Player style join coverage (bowler_type / batting_style proxy)
    cur.execute("""
        SELECT
          COUNT(*) AS total,
          COUNT(pb."battingStyle") AS batter_style,
          COUNT(pw."bowlingStyle") AS bowler_style
        FROM "Delivery" d
        LEFT JOIN "Player" pb ON pb.name = d.batter
        LEFT JOIN "Player" pw ON pw.name = d.bowler
    """)
    r = cur.fetchone()
    print(f"\n  Player join (name match) — battingStyle: {r[1]:,}/{r[0]:,} ({100*r[1]/r[0]:.1f}%)")
    print(f"  Player join (name match) — bowlingStyle: {r[2]:,}/{r[0]:,} ({100*r[2]/r[0]:.1f}%)")

    print("\n" + "=" * 70)
    print("4. DUPLICATE DELIVERIES — (match internal id, inning, over, ball)")
    print("=" * 70)
    cur.execute("""
        SELECT COUNT(*) FROM (
            SELECT "matchId", inning, over, ball, COUNT(*) AS c
            FROM "Delivery"
            GROUP BY 1, 2, 3, 4
            HAVING COUNT(*) > 1
        ) dup
    """)
    dup_groups = cur.fetchone()[0]
    cur.execute("""
        SELECT COALESCE(SUM(c - 1), 0) FROM (
            SELECT COUNT(*) AS c
            FROM "Delivery"
            GROUP BY "matchId", inning, over, ball
            HAVING COUNT(*) > 1
        ) x
    """)
    extra_rows = cur.fetchone()[0]
    print(f"  Duplicate key groups: {dup_groups:,}")
    print(f"  Extra rows beyond unique grain: {extra_rows:,}")

    if dup_groups > 0:
        cur.execute("""
            SELECT m."matchId", d.inning, d.over, d.ball, COUNT(*) AS c
            FROM "Delivery" d
            JOIN "Match" m ON m.id = d."matchId"
            GROUP BY m."matchId", d.inning, d.over, d.ball
            HAVING COUNT(*) > 1
            ORDER BY c DESC
            LIMIT 5
        """)
        print("  Top duplicate examples:")
        for r in cur.fetchall():
            print(f"    match={r[0]} inn={r[1]} over={r[2]} ball={r[3]} count={r[4]}")

    print("\n" + "=" * 70)
    print("5. MATCH CONTEXT COVERAGE (for similar-situation engine)")
    print("=" * 70)
    context = {
        "innings number": "d.inning IS NOT NULL",
        "over number": "d.over IS NOT NULL",
        "ball number": "d.ball IS NOT NULL",
        "venue (via Match)": "m.venue IS NOT NULL AND m.venue <> ''",
        "city (via Match)": "m.city IS NOT NULL AND m.city <> ''",
        "format (via Match)": "m.format IS NOT NULL AND m.format <> ''",
        "team1/team2 (batting team derivable)": "m.team1 IS NOT NULL AND m.team2 IS NOT NULL",
        "wicket_type (in JSON)": "d.wicket IS NOT NULL",
        "extras detail (JSON)": "d.extras IS NOT NULL AND d.extras::text <> 'null'",
        "target score": "FALSE /* NOT IN SCHEMA */",
        "wickets remaining": "FALSE /* NOT IN SCHEMA */",
        "current run rate": "FALSE /* NOT IN SCHEMA — must compute */",
        "runs at ball (cumulative)": "FALSE /* NOT IN SCHEMA — must compute */",
        "wickets at ball": "FALSE /* NOT IN SCHEMA — must compute */",
        "match phase (PP/middle/death)": "FALSE /* NOT IN SCHEMA — must derive from over+format */",
        "bowler_type": "pw.\"bowlingStyle\" IS NOT NULL",
        "batter_type": "pb.\"battingStyle\" IS NOT NULL",
    }
    for label, cond in context.items():
        if "NOT IN SCHEMA" in cond or "must compute" in cond or "must derive" in cond:
            print(f"  {label:40s} MISSING — derive at feature time")
        else:
            cur.execute(f"""
                SELECT COUNT(*) FROM "Delivery" d
                JOIN "Match" m ON m.id = d."matchId"
                LEFT JOIN "Player" pb ON pb.name = d.batter
                LEFT JOIN "Player" pw ON pw.name = d.bowler
                WHERE {cond}
            """)
            n = cur.fetchone()[0]
            pct = 100.0 * n / total_d if total_d else 0
            print(f"  {label:40s} {n:>10,} ({pct:5.2f}%)")

    # Wicket kind breakdown
    cur.execute("""
        SELECT d.wicket->>'kind' AS kind, COUNT(*) AS c
        FROM "Delivery" d
        WHERE d.wicket IS NOT NULL
        GROUP BY 1 ORDER BY c DESC LIMIT 10
    """)
    print("\n  Wicket kinds (top 10):")
    for r in cur.fetchall():
        print(f"    {r[0] or '(null kind)':<20} {r[1]:>8,}")

    print("\n" + "=" * 70)
    print("6. TIME RANGE & FORMAT MIX")
    print("=" * 70)
    cur.execute("""
        SELECT format, COUNT(*) AS matches,
               MIN(date)::date AS min_date, MAX(date)::date AS max_date
        FROM "Match"
        GROUP BY format
        ORDER BY matches DESC
    """)
    print(f"  {'format':<12} {'matches':>8} {'min_date':>12} {'max_date':>12}")
    for r in cur.fetchall():
        print(f"  {r[0]:<12} {r[1]:>8,} {str(r[2] or 'NULL'):>12} {str(r[3] or 'NULL'):>12}")

    cur.execute("""
        SELECT m.format, COUNT(*) AS deliveries
        FROM "Delivery" d JOIN "Match" m ON m.id = d."matchId"
        GROUP BY m.format ORDER BY deliveries DESC
    """)
    print("\n  Deliveries by format:")
    for r in cur.fetchall():
        pct = 100.0 * r[1] / total_d
        print(f"    {r[0]:<12} {r[1]:>10,} ({pct:5.1f}%)")

    print("\n" + "=" * 70)
    print("7. SAMPLE ROWS (Delivery + Match join)")
    print("=" * 70)
    cur.execute("""
        SELECT m."matchId", m.format, m.date::date, m.venue, m.team1, m.team2,
               d.inning, d.over, d.ball, d.batter, d.bowler, d."nonStriker",
               d."runsBatter", d."runsExtras", d."runsTotal",
               d.wicket, d.extras
        FROM "Delivery" d
        JOIN "Match" m ON m.id = d."matchId"
        ORDER BY m.date DESC NULLS LAST, d.inning, d.over, d.ball
        LIMIT 5
    """)
    cols = [d[0] for d in cur.description]
    samples = [dict(zip(cols, row)) for row in cur.fetchall()]
    for i, s in enumerate(samples, 1):
        s["date"] = str(s["date"])
        print(f"\n  Row {i}:")
        print(json.dumps(s, indent=2, default=str))

    cur.close()
    conn.close()

    # pandas vs cuDF benchmark
    print("\n" + "=" * 70)
    print("8. PANDAS vs cuDF LOAD + GROUPBY BENCHMARK")
    print("=" * 70)
    run_benchmark()


def run_benchmark():
    import pandas as pd

    conn = psycopg2.connect(DB_URL)
    sql = """
        SELECT d.inning, d.over, d.ball, d.batter, d.bowler,
               d."runsBatter", d."runsExtras", d."runsTotal",
               m.format, m.venue
        FROM "Delivery" d
        JOIN "Match" m ON m.id = d."matchId"
    """

    t0 = time.perf_counter()
    df = pd.read_sql(sql, conn)
    t_load_pd = time.perf_counter() - t0
    print(f"  pandas load: {len(df):,} rows in {t_load_pd:.2f}s")

    t0 = time.perf_counter()
    agg_pd = df.groupby(["format", "batter"]).agg(
        balls=("runsTotal", "count"),
        runs=("runsTotal", "sum"),
        avg=("runsBatter", "mean"),
    ).reset_index()
    t_agg_pd = time.perf_counter() - t0
    print(f"  pandas groupby (format × batter): {len(agg_pd):,} groups in {t_agg_pd:.2f}s")
    print(f"  pandas total: {t_load_pd + t_agg_pd:.2f}s")

    conn.close()

    try:
        import cudf
        import cupy  # noqa: F401

        conn = psycopg2.connect(DB_URL)
        t0 = time.perf_counter()
        pdf = pd.read_sql(sql, conn)
        gdf = cudf.from_pandas(pdf)
        t_load_cudf = time.perf_counter() - t0
        print(f"\n  cuDF load (via pandas bridge): {len(gdf):,} rows in {t_load_cudf:.2f}s")

        t0 = time.perf_counter()
        agg_cudf = gdf.groupby(["format", "batter"]).agg(
            {"runsTotal": ["count", "sum"], "runsBatter": "mean"}
        )
        t_agg_cudf = time.perf_counter() - t0
        print(f"  cuDF groupby: {len(agg_cudf):,} groups in {t_agg_cudf:.2f}s")
        print(f"  cuDF total: {t_load_cudf + t_agg_cudf:.2f}s")
        speedup = (t_load_pd + t_agg_pd) / (t_load_cudf + t_agg_cudf)
        print(f"  Speedup (cuDF/pandas): {speedup:.2f}x")
        conn.close()
    except ImportError as e:
        print(f"\n  cuDF not available ({e}). Install: pip install cudf-cu12 (requires NVIDIA GPU + CUDA)")
    except Exception as e:
        print(f"\n  cuDF benchmark failed: {e}")


if __name__ == "__main__":
    main()
