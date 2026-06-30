import psycopg2

c = psycopg2.connect("postgresql://postgres:Laasya%40123@localhost:5432/cricmetrics")
cur = c.cursor()
cur.execute(
    "SELECT column_name FROM information_schema.columns "
    "WHERE table_name='Delivery' AND column_name='battingTeam'"
)
print("col exists:", cur.fetchone())
try:
    cur.execute("SELECT COUNT(*) FROM innings_team")
    print("innings_team:", cur.fetchone()[0])
except Exception as e:
    print("innings_team error:", e)
cur.execute('SELECT COUNT(*) FROM "Delivery" WHERE "battingTeam" IS NOT NULL')
print("filled:", cur.fetchone()[0])
cur.execute('SELECT COUNT(*) FROM "Delivery" WHERE "battingTeam" IS NULL')
print("null:", cur.fetchone()[0])
c.close()
