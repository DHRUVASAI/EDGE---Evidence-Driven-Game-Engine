import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
db_url = os.environ.get('DATABASE_URL')
conn = psycopg2.connect(db_url)
cur = conn.cursor()

updates = {
    'V Kohli': ('India', 'Batsman'),
    'RG Sharma': ('India', 'Batsman'),
    'JM Anderson': ('England', 'Bowler'),
    'MS Dhoni': ('India', 'Wicketkeeper Batsman'),
    'AB de Villiers': ('South Africa', 'Batsman'),
    'CH Gayle': ('West Indies', 'Batsman'),
    'SR Tendulkar': ('India', 'Batsman'),
    'KC Sangakkara': ('Sri Lanka', 'Wicketkeeper Batsman'),
    'JE Root': ('England', 'Batsman'),
    'KS Williamson': ('New Zealand', 'Batsman'),
    'SPD Smith': ('Australia', 'Batsman'),
    'DA Warner': ('Australia', 'Batsman'),
    'SK Raina': ('India', 'Batsman'),
    'RV Uthappa': ('India', 'Batsman'),
    'F du Plessis': ('South Africa', 'Batsman'),
    'S Dhawan': ('India', 'Batsman'),
    'SC Ganguly': ('India', 'Batsman'),
    'V Sehwag': ('India', 'Batsman'),
    'JH Kallis': ('South Africa', 'Allrounder'),
    'M Muralitharan': ('Sri Lanka', 'Bowler'),
    'SK Warne': ('Australia', 'Bowler'),
    'GD McGrath': ('Australia', 'Bowler'),
    'B Lee': ('Australia', 'Bowler'),
    'DW Steyn': ('South Africa', 'Bowler'),
    'Lasith Malinga': ('Sri Lanka', 'Bowler'),
    'Z Khan': ('India', 'Bowler')
}

for name, (country, role) in updates.items():
    cur.execute(
        'UPDATE "Player" SET country = %s, role = %s WHERE name = %s OR "fullName" = %s;',
        (country, role, name, name)
    )

cur.execute('UPDATE "Player" SET role = TRIM(role) WHERE role != TRIM(role);')

conn.commit()
print("Top players patched successfully.")
cur.close()
conn.close()
