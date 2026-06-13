import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
db_url = os.environ.get('DIRECT_URL')
conn = psycopg2.connect(db_url)
cur = conn.cursor()

cur.execute('CREATE EXTENSION IF NOT EXISTS pg_trgm;')
cur.execute('CREATE INDEX IF NOT EXISTS idx_player_name_trgm ON "Player" USING gin(name gin_trgm_ops);')
cur.execute('CREATE INDEX IF NOT EXISTS idx_player_fullname_trgm ON "Player" USING gin("fullName" gin_trgm_ops);')

conn.commit()
print("Trigram extension and indexes added.")
cur.close()
conn.close()
