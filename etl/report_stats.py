import psycopg2
import os
from dotenv import load_dotenv

load_dotenv(r"c:\Users\dhruv\Downloads\sport\cricmetrics\.env")
conn = psycopg2.connect(os.environ.get('DIRECT_URL'))
cur = conn.cursor()

print("--- Data Report ---")
cur.execute('SELECT count(*) FROM "Match"')
print(f"Total Matches: {cur.fetchone()[0]}")

cur.execute('SELECT format, count(*) FROM "Match" GROUP BY format ORDER BY count(*) DESC')
print("\nMatches per Format:")
for row in cur.fetchall():
    print(f"  {row[0]}: {row[1]}")

cur.execute('SELECT count(*) FROM "Delivery"')
print(f"\nTotal Deliveries: {cur.fetchone()[0]}")

cur.execute('SELECT count(*) FROM "Player"')
print(f"\nTotal Unique Players: {cur.fetchone()[0]}")

conn.close()
