import os
import csv
import psycopg2
from thefuzz import process
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
db_url = os.environ.get('DATABASE_URL')

def main():
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    cur.execute('SELECT id, name FROM "Player"')
    db_players = cur.fetchall()
    db_player_names = {row[1]: row[0] for row in db_players}
    
    csv_path = r'C:\Users\dhruv\Downloads\sport\players-data-updated.csv'
    
    updates = []
    unmatched = []
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            player_id = row.get('player_id')
            player_name = row.get('player_name')
            bat_style = row.get('bat_style')
            bowl_style = row.get('bowl_style')
            player_full_name = row.get('player_full_name')
            
            if not player_name:
                continue
                
            db_id = db_player_names.get(player_name)
            
            if not db_id:
                # fuzzy match
                match, score = process.extractOne(player_name, list(db_player_names.keys()))
                if score >= 85:
                    db_id = db_player_names[match]
                else:
                    unmatched.append(f"{player_name} (closest: {match} {score})")
                    continue
                    
            updates.append((
                player_full_name,
                player_id,
                bat_style,
                bowl_style,
                db_id
            ))
            
    if updates:
        from psycopg2.extras import execute_batch
        execute_batch(
            cur,
            '''
            UPDATE "Player" SET 
              "fullName" = %s,
              "espnId" = %s,
              "battingStyle" = %s,
              "bowlingStyle" = %s
            WHERE id = %s
            ''',
            updates
        )
        conn.commit()
        
    print(f"Patched {len(updates)} players.")
    
    with open(os.path.join(os.path.dirname(__file__), 'patch_log.txt'), 'w', encoding='utf-8') as log_f:
        for u in unmatched:
            log_f.write(u + '\\n')
            
    cur.close()
    conn.close()

if __name__ == '__main__':
    main()
