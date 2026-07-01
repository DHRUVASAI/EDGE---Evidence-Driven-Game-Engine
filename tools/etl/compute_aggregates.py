import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
db_url = os.environ.get('DIRECT_URL')
conn = psycopg2.connect(db_url)
cur = conn.cursor()

cur.execute('''
    DROP MATERIALIZED VIEW IF EXISTS batting_summary;
    CREATE MATERIALIZED VIEW batting_summary AS
    SELECT
      p.id as "playerId",
      m.format,
      COUNT(DISTINCT m.id) as matches,
      COUNT(DISTINCT d."matchId") as innings,
      SUM(d."runsBatter") as runs,
      SUM(CASE WHEN d."runsBatter" = 4 THEN 1 ELSE 0 END) as fours,
      SUM(CASE WHEN d."runsBatter" = 6 THEN 1 ELSE 0 END) as sixes,
      COUNT(d.id) as "ballsFaced",
      CASE WHEN COUNT(d.id) > 0 THEN (SUM(d."runsBatter") * 100.0 / COUNT(d.id)) ELSE 0 END as "strikeRate"
    FROM "Player" p
    JOIN "Delivery" d ON p.name = d.batter
    JOIN "Match" m ON d."matchId" = m.id
    GROUP BY p.id, m.format;
''')

cur.execute('''
    DROP MATERIALIZED VIEW IF EXISTS bowling_summary;
    CREATE MATERIALIZED VIEW bowling_summary AS
    SELECT
      p.id as "playerId",
      m.format,
      COUNT(DISTINCT m.id) as matches,
      COUNT(DISTINCT d."matchId") as innings,
      COUNT(d.id) as "ballsBowled",
      SUM(d."runsTotal") as "runsConceded",
      SUM(CASE WHEN d.wicket IS NOT NULL THEN 1 ELSE 0 END) as wickets,
      CASE WHEN SUM(CASE WHEN d.wicket IS NOT NULL THEN 1 ELSE 0 END) > 0 THEN 
        (SUM(d."runsTotal") * 1.0 / SUM(CASE WHEN d.wicket IS NOT NULL THEN 1 ELSE 0 END))
      ELSE 0 END as "bowlingAvg",
      CASE WHEN COUNT(d.id) > 0 THEN
        (SUM(d."runsTotal") * 6.0 / COUNT(d.id))
      ELSE 0 END as "economy"
    FROM "Player" p
    JOIN "Delivery" d ON p.name = d.bowler
    JOIN "Match" m ON d."matchId" = m.id
    GROUP BY p.id, m.format;
''')

cur.execute('''
    DROP MATERIALIZED VIEW IF EXISTS ipl_batting_summary;
    CREATE MATERIALIZED VIEW ipl_batting_summary AS
    SELECT
      p.id as "playerId",
      'IPL' as format,
      COUNT(DISTINCT m.id) as matches,
      COUNT(DISTINCT d."matchId") as innings,
      SUM(d."runsBatter") as runs,
      SUM(CASE WHEN d."runsBatter" = 4 THEN 1 ELSE 0 END) as fours,
      SUM(CASE WHEN d."runsBatter" = 6 THEN 1 ELSE 0 END) as sixes,
      COUNT(d.id) as "ballsFaced",
      CASE WHEN COUNT(d.id) > 0 THEN (SUM(d."runsBatter") * 100.0 / COUNT(d.id)) ELSE 0 END as "strikeRate"
    FROM "Player" p
    JOIN "Delivery" d ON p.name = d.batter
    JOIN "Match" m ON d."matchId" = m.id
    WHERE m.format = 'T20' AND (
      m.season ILIKE '%IPL%' 
      OR m.team1 = ANY(ARRAY['Mumbai Indians', 'Chennai Super Kings', 'Royal Challengers Bangalore', 'Kolkata Knight Riders', 'Sunrisers Hyderabad', 'Delhi Capitals', 'Punjab Kings', 'Rajasthan Royals', 'Lucknow Super Giants', 'Gujarat Titans'])
      OR m.team2 = ANY(ARRAY['Mumbai Indians', 'Chennai Super Kings', 'Royal Challengers Bangalore', 'Kolkata Knight Riders', 'Sunrisers Hyderabad', 'Delhi Capitals', 'Punjab Kings', 'Rajasthan Royals', 'Lucknow Super Giants', 'Gujarat Titans'])
    )
    GROUP BY p.id;
''')

cur.execute('''
    DROP MATERIALIZED VIEW IF EXISTS ipl_bowling_summary;
    CREATE MATERIALIZED VIEW ipl_bowling_summary AS
    SELECT
      p.id as "playerId",
      'IPL' as format,
      COUNT(DISTINCT m.id) as matches,
      COUNT(DISTINCT d."matchId") as innings,
      COUNT(d.id) as "ballsBowled",
      SUM(d."runsTotal") as "runsConceded",
      SUM(CASE WHEN d.wicket IS NOT NULL THEN 1 ELSE 0 END) as wickets,
      CASE WHEN SUM(CASE WHEN d.wicket IS NOT NULL THEN 1 ELSE 0 END) > 0 THEN 
        (SUM(d."runsTotal") * 1.0 / SUM(CASE WHEN d.wicket IS NOT NULL THEN 1 ELSE 0 END))
      ELSE 0 END as "bowlingAvg",
      CASE WHEN COUNT(d.id) > 0 THEN
        (SUM(d."runsTotal") * 6.0 / COUNT(d.id))
      ELSE 0 END as "economy"
    FROM "Player" p
    JOIN "Delivery" d ON p.name = d.bowler
    JOIN "Match" m ON d."matchId" = m.id
    WHERE m.format = 'T20' AND (
      m.season ILIKE '%IPL%' 
      OR m.team1 = ANY(ARRAY['Mumbai Indians', 'Chennai Super Kings', 'Royal Challengers Bangalore', 'Kolkata Knight Riders', 'Sunrisers Hyderabad', 'Delhi Capitals', 'Punjab Kings', 'Rajasthan Royals', 'Lucknow Super Giants', 'Gujarat Titans'])
      OR m.team2 = ANY(ARRAY['Mumbai Indians', 'Chennai Super Kings', 'Royal Challengers Bangalore', 'Kolkata Knight Riders', 'Sunrisers Hyderabad', 'Delhi Capitals', 'Punjab Kings', 'Rajasthan Royals', 'Lucknow Super Giants', 'Gujarat Titans'])
    )
    GROUP BY p.id;
''')

conn.commit()
cur.close()
conn.close()
print("Materialized views created successfully.")
