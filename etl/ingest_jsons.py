import os
import json
import argparse
import uuid
import datetime
from glob import glob
import psycopg2
from psycopg2.extras import execute_values, Json
from dotenv import load_dotenv
from tqdm import tqdm
from urllib.parse import unquote

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
db_url = os.environ.get('DIRECT_URL')

def get_connection():
    return psycopg2.connect(db_url)

BASE_DIR = r"C:\Users\dhruv\Downloads\sport"
FOLDERS = ["ipl", "odis", "t20", "tests", "odms", "mdms"]

def process_file(filepath, conn):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    match_id_str = os.path.basename(filepath).replace('.json', '')
    
    with conn.cursor() as cur:
        cur.execute('SELECT id FROM "Match" WHERE "matchId" = %s', (match_id_str,))
        if cur.fetchone() is not None:
            return 0, 0 # skipped
            
    info = data.get('info', {})
    
    format_type = info.get('match_type', 'UNKNOWN').upper()
    if 'TEST' in format_type:
        format_type = 'TEST'
    
    dates = info.get('dates', [])
    match_date = dates[0] if dates else None
    
    venue = info.get('venue')
    city = info.get('city')
    
    teams = info.get('teams', [])
    team1 = teams[0] if len(teams) > 0 else None
    team2 = teams[1] if len(teams) > 1 else None
    
    outcome = info.get('outcome', {})
    winner = outcome.get('winner')
    if isinstance(winner, dict):
        winner = winner.get('team')
    
    pom = info.get('player_of_match', [])
    player_of_match = pom[0] if pom else None
    
    toss = info.get('toss', {})
    toss_winner = toss.get('winner')
    toss_decision = toss.get('decision')
    
    season = str(info.get('season', ''))
    
    match_pk = uuid.uuid4().hex
    
    registry = info.get('registry', {}).get('people', {})
    players_data = []
    for name, cricsheet_id in registry.items():
        players_data.append((uuid.uuid4().hex, name, cricsheet_id, datetime.datetime.now()))
        
    with conn.cursor() as cur:
        if players_data:
            execute_values(
                cur,
                '''
                INSERT INTO "Player" (id, name, "cricsheetId", "createdAt")
                VALUES %s
                ON CONFLICT ("cricsheetId") DO NOTHING
                ''',
                players_data
            )
            
        cur.execute(
            '''
            INSERT INTO "Match" (id, "matchId", format, date, venue, city, team1, team2, winner, "playerOfMatch", "tossWinner", "tossDecision", season, "createdAt")
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''',
            (match_pk, match_id_str, format_type, match_date, venue, city, team1, team2, winner, player_of_match, toss_winner, toss_decision, season, datetime.datetime.now())
        )
        
    deliveries = []
    skip_deliveries = False
    if format_type in ['ODM', 'MDM'] and match_date and match_date < '2016-01-01':
        skip_deliveries = True
        
    if not skip_deliveries:
        innings = data.get('innings', [])
        for inning_idx, inning in enumerate(innings):
            overs = inning.get('overs', [])
            for over in overs:
                over_num = over.get('over')
                for ball_idx, delivery in enumerate(over.get('deliveries', [])):
                    batter = delivery.get('batter')
                    bowler = delivery.get('bowler')
                    non_striker = delivery.get('non_striker')
                    runs = delivery.get('runs', {})
                    runs_batter = runs.get('batter', 0)
                    runs_extras = runs.get('extras', 0)
                    runs_total = runs.get('total', 0)
                    
                    wicket = delivery.get('wickets', None)
                    wicket_val = Json(wicket) if wicket else None
                    
                    extras = delivery.get('extras', None)
                    extras_val = Json(extras) if extras else None
                        
                    deliveries.append((
                        uuid.uuid4().hex,
                        match_pk,
                        inning_idx + 1,
                        over_num,
                        ball_idx + 1,
                        batter,
                        bowler,
                        non_striker,
                        runs_batter,
                        runs_extras,
                        runs_total,
                        wicket_val,
                        extras_val
                    ))
    if deliveries:
        with conn.cursor() as cur:
            execute_values(
                cur,
                '''
                INSERT INTO "Delivery" (id, "matchId", inning, over, ball, batter, bowler, "nonStriker", "runsBatter", "runsExtras", "runsTotal", wicket, extras)
                VALUES %s
                ''',
                deliveries,
                page_size=500
            )
            
    conn.commit()
    return 1, len(deliveries)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--test', action='store_true', help='Run on first 10 files per folder')
    args = parser.parse_args()
    
    conn = get_connection()
    
    total_matches = 0
    total_deliveries = 0
    
    all_files = []
    for folder in FOLDERS:
        folder_path = os.path.join(BASE_DIR, folder)
        files = glob(os.path.join(folder_path, '*.json'))
        if args.test:
            files = files[:10]
        all_files.extend(files)
        
    print(f"Found {len(all_files)} files to process.")
    
    with tqdm(total=len(all_files), desc="Processing JSONs") as pbar:
        for filepath in all_files:
            try:
                m_inserted, d_inserted = process_file(filepath, conn)
                total_matches += m_inserted
                total_deliveries += d_inserted
            except Exception as e:
                print(f"\\nError processing {filepath}: {e}")
                conn.rollback()
            pbar.update(1)
            pbar.set_postfix({'Matches': total_matches, 'Deliveries': total_deliveries})
            
    conn.close()
    print("\\nDone!")
    print(f"Matches inserted: {total_matches}")
    print(f"Deliveries inserted: {total_deliveries}")

if __name__ == '__main__':
    main()
