import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
db_url = os.environ.get('DATABASE_URL')
conn = psycopg2.connect(db_url)
cur = conn.cursor()

cur.execute('SELECT format, count(*) FROM "CareerStat" GROUP BY format')
print("CareerStat rows per format:")
for row in cur.fetchall():
    print(f"  {row[0]}: {row[1]}")

cur.execute('SELECT count(*) FROM "AuctionHistory"')
print(f"\nAuctionHistory rows: {cur.fetchone()[0]}")

cur.execute('SELECT count(*) FROM "Player" WHERE "espnId" IS NOT NULL')
print(f"\nPlayers with espnId populated: {cur.fetchone()[0]}")

cur.close()
conn.close()
