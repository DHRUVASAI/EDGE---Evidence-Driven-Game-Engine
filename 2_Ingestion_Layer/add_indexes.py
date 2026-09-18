import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
db_url = os.environ.get('DIRECT_URL')
conn = psycopg2.connect(db_url)
cur = conn.cursor()

cur.execute('CREATE INDEX IF NOT EXISTS idx_delivery_match_id ON "Delivery"("matchId");')
cur.execute('CREATE INDEX IF NOT EXISTS idx_match_season_format ON "Match"("season", "format");')

conn.commit()
cur.close()
conn.close()
print("Indexes added successfully.")
