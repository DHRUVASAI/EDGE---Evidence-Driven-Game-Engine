import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDisplayName, getPlayerImageApiUrl } from '@/lib/utils';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const player = await prisma.player.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        fullName: true,
        country: true,
        role: true,
        battingStyle: true,
        bowlingStyle: true,
        espnId: true,
        cricsheetId: true,
        imageUrl: true,
        createdAt: true,
        careerStats: true,
      },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const statsByFormat: Record<string, any> = {};
    player.careerStats.forEach(stat => {
      statsByFormat[stat.format] = stat;
    });

    // Dynamically compute IPL stats if the player has IPL matches in the DB
    try {
      const IPL_TEAMS = [
        'Mumbai Indians', 'Chennai Super Kings', 'Royal Challengers Bangalore',
        'Kolkata Knight Riders', 'Rajasthan Royals', 'Delhi Capitals',
        'Kings XI Punjab', 'Sunrisers Hyderabad', 'Deccan Chargers',
        'Pune Warriors', 'Rising Pune Supergiant', 'Rising Pune Supergiants',
        'Gujarat Lions', 'Lucknow Super Giants', 'Gujarat Titans',
        'Punjab Kings', 'Delhi Daredevils', 'Kochi Tuskers Kerala',
        'Royal Challengers Bengaluru'
      ];
      
      const playerName = player.name;

      const matchesRes = await prisma.$queryRaw<any[]>`
        SELECT DISTINCT m.id
        FROM "Delivery" d
        JOIN "Match" m ON d."matchId" = m.id
        WHERE (d.batter = ${playerName} OR d.bowler = ${playerName})
          AND (m.team1 = ANY(${IPL_TEAMS}) OR m.team2 = ANY(${IPL_TEAMS}))
      `;
      const matchesCount = matchesRes.length;

      if (matchesCount > 0) {
        // Batting stats
        const batRes = await prisma.$queryRaw<any[]>`
          SELECT 
            m.id as match_id,
            SUM(d."runsBatter")::int as runs,
            COUNT(CASE WHEN d.wicket IS NOT NULL AND d.wicket->0->>'player_out' = ${playerName} THEN 1 END)::int as is_out,
            COUNT(*)::int as balls_faced
          FROM "Delivery" d
          JOIN "Match" m ON d."matchId" = m.id
          WHERE d.batter = ${playerName}
            AND (m.team1 = ANY(${IPL_TEAMS}) OR m.team2 = ANY(${IPL_TEAMS}))
          GROUP BY m.id
        `;

        let runs = 0;
        let ballsFaced = 0;
        let dismissals = 0;
        let highScoreVal = 0;
        let highScoreNotOut = false;
        let hundreds = 0;
        let fifties = 0;
        const innings = batRes.length;

        batRes.forEach(r => {
          runs += r.runs || 0;
          ballsFaced += r.balls_faced || 0;
          dismissals += r.is_out || 0;
          
          const rRuns = r.runs || 0;
          if (rRuns > highScoreVal) {
            highScoreVal = rRuns;
            highScoreNotOut = r.is_out === 0;
          }
          if (rRuns >= 100) hundreds++;
          else if (rRuns >= 50) fifties++;
        });

        const avg = dismissals > 0 ? parseFloat((runs / dismissals).toFixed(2)) : runs;
        const sr = ballsFaced > 0 ? parseFloat(((runs / ballsFaced) * 100).toFixed(2)) : 0;
        const highScore = highScoreVal + (highScoreNotOut ? '*' : '');

        // Bowling stats
        const bowlRes = await prisma.$queryRaw<any[]>`
          SELECT 
            m.id as match_id,
            COUNT(CASE WHEN d.wicket IS NOT NULL AND NOT (d.wicket->0->>'kind' = 'run out') AND NOT (d.wicket->0->>'kind' = 'retired hurt') AND NOT (d.wicket->0->>'kind' = 'obstructing the field') THEN 1 END)::int as wickets,
            SUM(d."runsTotal")::int as runs_conceded,
            COUNT(*)::int as balls_bowled
          FROM "Delivery" d
          JOIN "Match" m ON d."matchId" = m.id
          WHERE d.bowler = ${playerName}
            AND (m.team1 = ANY(${IPL_TEAMS}) OR m.team2 = ANY(${IPL_TEAMS}))
          GROUP BY m.id
        `;

        let wickets = 0;
        let runsConceded = 0;
        let ballsBowled = 0;
        let fiveWickets = 0;

        bowlRes.forEach(r => {
          wickets += r.wickets || 0;
          runsConceded += r.runs_conceded || 0;
          ballsBowled += r.balls_bowled || 0;
          if ((r.wickets || 0) >= 5) fiveWickets++;
        });

        const bowlAvg = wickets > 0 ? parseFloat((runsConceded / wickets).toFixed(2)) : null;
        const bowlEcon = ballsBowled > 0 ? parseFloat(((runsConceded / ballsBowled) * 6).toFixed(2)) : null;
        const bowlSR = wickets > 0 ? parseFloat((ballsBowled / wickets).toFixed(2)) : null;

        // Fielding stats
        const fieldRes = await prisma.$queryRaw<any[]>`
          SELECT 
            COUNT(CASE WHEN d.wicket IS NOT NULL AND d.wicket->0->>'kind' = 'caught' AND d.wicket->0->'fielders'->0->>'name' = ${playerName} THEN 1 END)::int as catches,
            COUNT(CASE WHEN d.wicket IS NOT NULL AND d.wicket->0->>'kind' = 'stumped' AND d.wicket->0->'fielders'->0->>'name' = ${playerName} THEN 1 END)::int as stumpings
          FROM "Delivery" d
          JOIN "Match" m ON d."matchId" = m.id
          WHERE (m.team1 = ANY(${IPL_TEAMS}) OR m.team2 = ANY(${IPL_TEAMS}))
        `;
        const catches = fieldRes[0]?.catches || 0;
        const stumpings = fieldRes[0]?.stumpings || 0;

        statsByFormat['IPL'] = {
          id: 'ipl-computed-' + player.id,
          playerId: player.id,
          format: 'IPL',
          matches: matchesCount,
          innings: innings,
          runs: runs,
          avg: avg,
          sr: sr,
          hundreds: hundreds,
          fifties: fifties,
          highScore: highScore,
          wickets: wickets,
          bowlAvg: bowlAvg,
          bowlEcon: bowlEcon,
          bowlSR: bowlSR,
          fiveWickets: fiveWickets,
          catches: catches,
          stumpings: stumpings,
        };
      }
    } catch (err) {
      console.error('Error computing IPL stats:', err);
    }

    return NextResponse.json({
      id: player.id,
      name: player.name,
      fullName: player.fullName,
      displayName: getDisplayName(player),
      country: player.country,
      role: player.role,
      battingStyle: player.battingStyle,
      bowlingStyle: player.bowlingStyle,
      imageUrl: getPlayerImageApiUrl(player),
      careerStats: statsByFormat,
    });
  } catch (error: any) {
    console.error('Error fetching player stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
