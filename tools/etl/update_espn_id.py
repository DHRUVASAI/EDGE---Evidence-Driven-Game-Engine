import os
import pandas as pd
import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
db_url = os.environ.get('DIRECT_URL')
conn = psycopg2.connect(db_url)
cur = conn.cursor()

# Get mapping
cur.execute('SELECT id, name FROM "Player"')
name_map = {p[1]: p[0] for p in cur.fetchall()}
player_names = list(name_map.keys())

# We will use thefuzz to match but only fast if we do it
from thefuzz import process, fuzz
import re

def clean_name(raw_name):
    if pd.isna(raw_name): return ""
    cleaned = re.sub(r'\s*\([^)]*\)', '', str(raw_name))
    cleaned = cleaned.replace('*', '').strip()
    return cleaned

def fuzzy_match_player(raw_name):
    if not raw_name or pd.isna(raw_name): return None
    csv_name = clean_name(raw_name)
    if csv_name in name_map:
        return name_map[csv_name]
    
    match, score = process.extractOne(csv_name, player_names, scorer=fuzz.token_sort_ratio)
    if score >= 85:
        return name_map[match]
    return None

df = pd.read_csv(r"C:\Users\dhruv\Downloads\sport\players-data-updated.csv")
updated = 0
for idx, row in df.iterrows():
    p_name = row.get('player_name')
    espn_id = row.get('player_id')
    if pd.isna(espn_id): continue
    
    pid = fuzzy_match_player(p_name)
    if pid:
        cur.execute('UPDATE "Player" SET "espnId" = %s WHERE id = %s', (str(int(espn_id)), pid))
        updated += 1

conn.commit()
cur.close()
conn.close()
print(f"Updated {updated} espnIds")
