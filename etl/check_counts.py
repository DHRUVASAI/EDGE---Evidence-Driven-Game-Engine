import psycopg2
import os
from dotenv import load_dotenv

load_dotenv(r"c:\Users\dhruv\Downloads\sport\cricmetrics\.env")
conn = psycopg2.connect(os.environ.get('DIRECT_URL'))
cur = conn.cursor()
cur.execute('SELECT count(*) FROM "Match"')
print("Matches:", cur.fetchone()[0])
cur.execute('SELECT count(*) FROM "Delivery"')
print("Deliveries:", cur.fetchone()[0])
cur.execute('SELECT count(*) FROM "Player"')
print("Players:", cur.fetchone()[0])
