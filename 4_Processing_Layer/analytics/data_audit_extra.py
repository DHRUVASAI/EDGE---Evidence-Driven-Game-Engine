import psycopg2
import json

conn = psycopg2.connect("postgresql://postgres:Laasya%40123@localhost:5432/cricmetrics")
cur = conn.cursor()

cur.execute(
    'SELECT COUNT(*) FROM "Delivery" d LEFT JOIN "Match" m ON m.id = d."matchId" WHERE m.id IS NULL'
)
print("Orphan deliveries (no match):", cur.fetchone()[0])

cur.execute('SELECT COUNT(*) FROM "Delivery" d JOIN "Match" m ON m.id = d."matchId"')
print("Deliveries with match join:", cur.fetchone()[0])

cur.execute('SELECT wicket FROM "Delivery" WHERE wicket IS NOT NULL LIMIT 8')
print("\nWicket JSON samples:")
for r in cur.fetchall():
    print(" ", r[0])

cur.execute(
    """SELECT COUNT(*) FROM "Delivery"
       WHERE wicket IS NOT NULL AND wicket::text NOT IN ('null','[]','{}')"""
)
print("\nNon-empty wicket rows:", cur.fetchone()[0])

cur.execute(
    """SELECT column_name FROM information_schema.columns
       WHERE table_name='Delivery' ORDER BY 1"""
)
print("\nDelivery columns:", [r[0] for r in cur.fetchall()])

cur.execute(
    """SELECT format, COUNT(*) FROM "Match"
       WHERE team1 LIKE '%Royal Challengers%' OR team2 LIKE '%Royal Challengers%'
       GROUP BY format"""
)
print("\nRCB/IPL proxy matches by format:", cur.fetchall())

cur.execute("SELECT MIN(ball), MAX(ball), MIN(over), MAX(over) FROM \"Delivery\"")
print("over/ball range:", cur.fetchone())
cur.execute('SELECT MIN(inning), MAX(inning) FROM "Delivery"')
print("inning range:", cur.fetchone())

# Wicket kind if stored as array
cur.execute(
    """SELECT wicket->0->>'kind' AS kind, COUNT(*) AS c
       FROM "Delivery" WHERE wicket IS NOT NULL
       GROUP BY 1 ORDER BY c DESC LIMIT 12"""
)
print("\nWicket kinds (array path [0].kind):")
for r in cur.fetchall():
    print(f"  {r[0] or '(null)':<22} {r[1]:>8,}")

# Player style coverage - unique name match only
cur.execute(
    """SELECT
         COUNT(DISTINCT d.id) AS deliveries,
         COUNT(DISTINCT d.id) FILTER (WHERE pb."battingStyle" IS NOT NULL) AS with_bat_style,
         COUNT(DISTINCT d.id) FILTER (WHERE pw."bowlingStyle" IS NOT NULL) AS with_bowl_style
       FROM "Delivery" d
       LEFT JOIN "Player" pb ON pb.name = d.batter
       LEFT JOIN "Player" pw ON pw.name = d.bowler"""
)
r = cur.fetchone()
print(f"\nStyle coverage (deduped): bat {r[1]:,}/{r[0]:,} ({100*r[1]/r[0]:.1f}%), bowl {r[2]:,}/{r[0]:,} ({100*r[2]/r[0]:.1f}%)")

conn.close()
