import os
import glob
import pandas as pd
from thefuzz import process, fuzz
import psycopg2
from dotenv import load_dotenv
import re
import uuid

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
db_url = os.environ.get('DATABASE_URL')
conn = psycopg2.connect(db_url)
cur = conn.cursor()

cur.execute('SELECT id, name, "cricsheetId" FROM "Player"')
db_players = cur.fetchall()

cricsheet_map = {p[2]: p[0] for p in db_players if p[2]}
name_map = {p[1]: p[0] for p in db_players}
player_names = list(name_map.keys())

unmatched_log = open('unmatched_players.log', 'w', encoding='utf-8')

def clean_name(raw_name):
    if pd.isna(raw_name): return ""
    cleaned = re.sub(r'\s*\([^)]*\)', '', str(raw_name))
    cleaned = cleaned.replace('*', '').strip()
    return cleaned

def fuzzy_match_player(raw_name, file_context):
    if not raw_name or pd.isna(raw_name): return None
    csv_name = clean_name(raw_name)
    if csv_name in name_map:
        return name_map[csv_name]
    
    match, score = process.extractOne(csv_name, player_names, scorer=fuzz.token_sort_ratio)
    if score >= 85:
        return name_map[match]
    
    unmatched_log.write(f"[{file_context}] Skipped '{csv_name}', closest match '{match}' ({score}%)\n")
    return None

def get_int(row, col):
    if col not in row: return None
    val = row[col]
    if pd.isna(val): return None
    try: return int(float(val))
    except: return None

def get_float(row, col):
    if col not in row: return None
    val = row[col]
    if pd.isna(val): return None
    try: return float(val)
    except: return None

def get_str(row, col):
    if col not in row: return None
    val = row[col]
    if pd.isna(val): return None
    return str(val)

def process_players_data():
    file_path = r"C:\Users\dhruv\Downloads\sport\players-data-updated.csv"
    if not os.path.exists(file_path): return
    df = pd.read_csv(file_path)
    matched = 0
    skipped = 0
    
    for idx, row in df.iterrows():
        p_name = get_str(row, 'player_name')
        pid = fuzzy_match_player(p_name, "players-data-updated.csv")
        if pid:
            cur.execute('''
                UPDATE "Player" 
                SET "battingStyle" = %s, "bowlingStyle" = %s, role = %s, "fullName" = %s
                WHERE id = %s
            ''', (get_str(row, 'bat_style'), get_str(row, 'bowl_style'), get_str(row, 'field_pos'), get_str(row, 'player_full_name'), pid))
            matched += 1
        else:
            skipped += 1
            
    conn.commit()
    print(f"players-data-updated.csv: Matched {matched}, Skipped {skipped}")

def process_career_stats(file_path, format_str, stat_type):
    if not os.path.exists(file_path): return
    df = pd.read_csv(file_path)
    matched = 0
    skipped = 0
    
    for idx, row in df.iterrows():
        p_name = get_str(row, 'Player') or get_str(row, 'player')
        pid = fuzzy_match_player(p_name, f"CareerStat_{format_str}_{stat_type}")
        if not pid:
            skipped += 1
            continue
            
        cur.execute('SELECT id FROM "CareerStat" WHERE "playerId" = %s AND format = %s', (pid, format_str))
        stat = cur.fetchone()
        stat_id = stat[0] if stat else uuid.uuid4().hex
        
        if stat_type == 'batting':
            cur.execute('''
                INSERT INTO "CareerStat" (id, "playerId", format, matches, innings, runs, avg, sr, hundreds, fifties, "highScore")
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT ("playerId", format) DO UPDATE SET
                    matches = COALESCE("CareerStat".matches, EXCLUDED.matches),
                    innings = COALESCE("CareerStat".innings, EXCLUDED.innings),
                    runs = COALESCE("CareerStat".runs, EXCLUDED.runs),
                    avg = COALESCE("CareerStat".avg, EXCLUDED.avg),
                    sr = COALESCE("CareerStat".sr, EXCLUDED.sr),
                    hundreds = COALESCE("CareerStat".hundreds, EXCLUDED.hundreds),
                    fifties = COALESCE("CareerStat".fifties, EXCLUDED.fifties),
                    "highScore" = COALESCE("CareerStat"."highScore", EXCLUDED."highScore")
            ''', (
                stat_id, pid, format_str, 
                get_int(row, 'Mat'), get_int(row, 'Inns'), get_int(row, 'Runs'),
                get_float(row, 'Ave'), get_float(row, 'SR'), get_int(row, '100'),
                get_int(row, '50'), get_str(row, 'HS')
            ))
        elif stat_type == 'bowling':
            cur.execute('''
                INSERT INTO "CareerStat" (id, "playerId", format, matches, innings, wickets, "bowlAvg", "bowlEcon", "bowlSR", "fiveWickets")
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT ("playerId", format) DO UPDATE SET
                    wickets = COALESCE("CareerStat".wickets, EXCLUDED.wickets),
                    "bowlAvg" = COALESCE("CareerStat"."bowlAvg", EXCLUDED."bowlAvg"),
                    "bowlEcon" = COALESCE("CareerStat"."bowlEcon", EXCLUDED."bowlEcon"),
                    "bowlSR" = COALESCE("CareerStat"."bowlSR", EXCLUDED."bowlSR"),
                    "fiveWickets" = COALESCE("CareerStat"."fiveWickets", EXCLUDED."fiveWickets")
            ''', (
                stat_id, pid, format_str,
                get_int(row, 'Mat'), get_int(row, 'Inns'), get_int(row, 'Wkts'),
                get_float(row, 'Ave'), get_float(row, 'Econ'), get_float(row, 'SR'), get_int(row, '5')
            ))
        elif stat_type == 'fielding':
            cur.execute('''
                INSERT INTO "CareerStat" (id, "playerId", format, catches, stumpings, runouts)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT ("playerId", format) DO UPDATE SET
                    catches = COALESCE("CareerStat".catches, EXCLUDED.catches),
                    stumpings = COALESCE("CareerStat".stumpings, EXCLUDED.stumpings),
                    runouts = COALESCE("CareerStat".runouts, EXCLUDED.runouts)
            ''', (
                stat_id, pid, format_str,
                get_int(row, 'Ct'), get_int(row, 'St'), get_int(row, 'Ro')
            ))
        matched += 1
    conn.commit()
    print(f"{os.path.basename(file_path)} [{format_str} {stat_type}]: Matched {matched}, Skipped {skipped}")

def process_auction_data():
    file_path = r"C:\Users\dhruv\Downloads\sport\IPL dataset final.csv"
    if not os.path.exists(file_path): return
    df = pd.read_csv(file_path)
    matched = 0
    skipped = 0
    
    for idx, row in df.iterrows():
        p_name = get_str(row, 'Player')
        pid = fuzzy_match_player(p_name, "IPL dataset final.csv")
        if pid:
            cur.execute('''
                INSERT INTO "AuctionHistory" (id, "playerId", year, team, "soldPrice", "basePrice")
                VALUES (%s, %s, %s, %s, %s, %s)
            ''', (
                uuid.uuid4().hex,
                pid,
                get_int(row, 'year') or 2023,
                get_str(row, 'TEAM'),
                get_str(row, 'SOLD_PRICE'),
                get_str(row, 'BASE_PRICE')
            ))
            matched += 1
        else:
            skipped += 1
    conn.commit()
    print(f"IPL dataset final.csv: Matched {matched}, Skipped {skipped}")

def process_ipl_perf():
    path = r"C:\Users\dhruv\Downloads\sport\IPL - Player Performance Dataset\*.csv"
    matched_total = 0
    for file in glob.glob(path):
        df = pd.read_csv(file)
        for idx, row in df.iterrows():
            p_name = get_str(row, 'Player') or get_str(row, 'player')
            pid = fuzzy_match_player(p_name, f"IPL_Perf_{os.path.basename(file)}")
            if pid:
                cur.execute('SELECT id FROM "CareerStat" WHERE "playerId" = %s AND format = %s', (pid, 'IPL'))
                stat = cur.fetchone()
                stat_id = stat[0] if stat else uuid.uuid4().hex
                cur.execute('''
                    INSERT INTO "CareerStat" (id, "playerId", format, runs, wickets, sr, "bowlEcon")
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT ("playerId", format) DO NOTHING
                ''', (
                    stat_id, pid, 'IPL',
                    get_int(row, 'Runs'), get_int(row, 'Wickets'), get_float(row, 'Strike Rate'), get_float(row, 'Economy')
                ))
                matched_total += 1
    conn.commit()
    print(f"IPL Performance CSVs: Matched & Inserted {matched_total}")

BASE_DIR = r"C:\Users\dhruv\Downloads\sport"
process_players_data()

process_career_stats(os.path.join(BASE_DIR, 'odb.csv'), 'ODI', 'batting')
process_career_stats(os.path.join(BASE_DIR, 'twb.csv'), 'T20', 'batting')
for f in glob.glob(os.path.join(BASE_DIR, 'Batting', '*.csv')):
    process_career_stats(f, 'TEST', 'batting')

process_career_stats(os.path.join(BASE_DIR, 'tbo.csv'), 'ODI', 'bowling')
process_career_stats(os.path.join(BASE_DIR, 'twbo.csv'), 'T20', 'bowling')
for f in glob.glob(os.path.join(BASE_DIR, 'Bowling', '*.csv')):
    process_career_stats(f, 'TEST', 'bowling')

for f in glob.glob(os.path.join(BASE_DIR, 'Fielding', '*.csv')):
    fmt = 'TEST'
    if 'odi' in f.lower(): fmt = 'ODI'
    elif 't20' in f.lower(): fmt = 'T20'
    process_career_stats(f, fmt, 'fielding')

process_auction_data()
process_ipl_perf()

cur.close()
conn.close()
unmatched_log.close()
print("\ningest_csvs.py execution completed.")
