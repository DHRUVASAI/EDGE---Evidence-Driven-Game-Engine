"""Fast backfill of Delivery.battingTeam using pre-joined lookup table."""
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
url = os.environ.get("DIRECT_URL") or os.environ.get("DATABASE_URL")

conn = psycopg2.connect(url)
conn.autocommit = False
cur = conn.cursor()

print("Creating innings_team_match lookup (Match.id + inning -> battingTeam)...")
cur.execute(
    """
    DROP TABLE IF EXISTS innings_team_match;
    CREATE TABLE innings_team_match AS
    SELECT m.id AS match_pk, it.inning, it."battingTeam"
    FROM innings_team it
    JOIN "Match" m ON m."matchId" = it."matchId";
    """
)
cur.execute("CREATE INDEX idx_innings_team_match ON innings_team_match (match_pk, inning)")
conn.commit()

cur.execute("SELECT COUNT(*) FROM innings_team_match")
print(f"innings_team_match rows: {cur.fetchone()[0]:,}")

print("Updating Delivery.battingTeam (this may take a few minutes)...")
cur.execute(
    """
    UPDATE "Delivery" d
    SET "battingTeam" = itm."battingTeam"
    FROM innings_team_match itm
    WHERE d."matchId" = itm.match_pk
      AND d.inning = itm.inning
    """
)
print(f"Updated rows: {cur.rowcount:,}")
conn.commit()

cur.execute('SELECT COUNT(*) FROM "Delivery"')
total = cur.fetchone()[0]
cur.execute('SELECT COUNT(*) FROM "Delivery" WHERE "battingTeam" IS NULL')
nulls = cur.fetchone()[0]
print(f"\nVerification: NULL battingTeam = {nulls:,} / {total:,} ({100*nulls/total:.4f}%)")

cur.execute(
    """
    SELECT m."matchId", d.inning, d."battingTeam", d.over, d.ball, d.batter
    FROM "Delivery" d
    JOIN "Match" m ON m.id = d."matchId"
    WHERE d."battingTeam" IS NOT NULL
    LIMIT 5
    """
)
print("\nSample rows:")
for r in cur.fetchall():
    print(" ", r)

cur.close()
conn.close()
