import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPlayerImageUrl } from '@/lib/utils';

const TEAM_MAP: Record<string, string[]> = {
  CSK: ['Chennai Super Kings'],
  MI: ['Mumbai Indians'],
  RCB: ['Royal Challengers Bangalore', 'Royal Challengers Bengaluru'],
  KKR: ['Kolkata Knight Riders'],
  RR: ['Rajasthan Royals'],
  SRH: ['Sunrisers Hyderabad', 'Deccan Chargers'],
  DC: ['Delhi Capitals', 'Delhi Daredevils'],
  PBKS: ['Punjab Kings', 'Kings XI Punjab'],
  GT: ['Gujarat Titans'],
  LSG: ['Lucknow Super Giants']
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamKey = searchParams.get('teamKey') || 'CSK';

    const teamNames = TEAM_MAP[teamKey] || TEAM_MAP['CSK'];

    // 1. Matches and Wins
    const statsRes = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*)::int as "matchesPlayed",
        COUNT(CASE WHEN winner = ANY(${teamNames}) THEN 1 END)::int as "wins"
      FROM "Match"
      WHERE team1 = ANY(${teamNames}) OR team2 = ANY(${teamNames})
    `;
    const stats = statsRes[0] || { matchesPlayed: 0, wins: 0 };

    // 2. Top Batter
    const topBatterRes = await prisma.$queryRaw<any[]>`
      WITH batting_runs AS (
        SELECT 
          p.id as player_id,
          p.name,
          p."fullName",
          p."imageUrl",
          SUM(d."runsBatter")::int as "runs"
        FROM "Delivery" d
        JOIN "Match" m ON d."matchId" = m.id
        JOIN "Player" p ON p.name = d.batter
        WHERE (m.team1 = ANY(${teamNames}) OR m.team2 = ANY(${teamNames}))
          AND (
            CASE 
              WHEN d.inning = 1 THEN 
                CASE 
                  WHEN (m."tossWinner" = m.team1 AND m."tossDecision" = 'bat') OR (m."tossWinner" = m.team2 AND m."tossDecision" = 'field') THEN m.team1
                  ELSE m.team2
                END
              WHEN d.inning = 2 THEN
                CASE 
                  WHEN (m."tossWinner" = m.team1 AND m."tossDecision" = 'bat') OR (m."tossWinner" = m.team2 AND m."tossDecision" = 'field') THEN m.team2
                  ELSE m.team1
                END
              ELSE NULL
            END
          ) = ANY(${teamNames})
        GROUP BY p.id, p.name, p."fullName", p."imageUrl"
      )
      SELECT * FROM batting_runs
      ORDER BY "runs" DESC
      LIMIT 1
    `;
    const topBatter = topBatterRes[0] ? {
      ...topBatterRes[0],
      imageUrl: getPlayerImageUrl(topBatterRes[0].imageUrl)
    } : null;

    // 3. Top Bowler
    const topBowlerRes = await prisma.$queryRaw<any[]>`
      WITH bowling_wickets AS (
        SELECT 
          p.id as player_id,
          p.name,
          p."fullName",
          p."imageUrl",
          COUNT(*)::int as "wickets"
        FROM "Delivery" d
        JOIN "Match" m ON d."matchId" = m.id
        JOIN "Player" p ON p.name = d.bowler
        WHERE (m.team1 = ANY(${teamNames}) OR m.team2 = ANY(${teamNames}))
          AND (
            CASE 
              WHEN d.inning = 1 THEN 
                CASE 
                  WHEN (m."tossWinner" = m.team1 AND m."tossDecision" = 'bat') OR (m."tossWinner" = m.team2 AND m."tossDecision" = 'field') THEN m.team2
                  ELSE m.team1
                END
              WHEN d.inning = 2 THEN
                CASE 
                  WHEN (m."tossWinner" = m.team1 AND m."tossDecision" = 'bat') OR (m."tossWinner" = m.team2 AND m."tossDecision" = 'field') THEN m.team1
                  ELSE m.team2
                END
              ELSE NULL
            END
          ) = ANY(${teamNames})
          AND d.wicket IS NOT NULL
          AND (d.wicket->0->>'kind') NOT IN ('run out', 'retired hurt', 'obstructing the field')
        GROUP BY p.id, p.name, p."fullName", p."imageUrl"
      )
      SELECT * FROM bowling_wickets
      ORDER BY "wickets" DESC
      LIMIT 1
    `;
    const topBowler = topBowlerRes[0] ? {
      ...topBowlerRes[0],
      imageUrl: getPlayerImageUrl(topBowlerRes[0].imageUrl)
    } : null;

    // 4. Season Match Volume
    const seasonTrends = await prisma.$queryRaw<any[]>`
      SELECT season, COUNT(*)::int as count
      FROM "Match"
      WHERE (team1 = ANY(${teamNames}) OR team2 = ANY(${teamNames}))
        AND season ~ '^[0-9]{4}$'
      GROUP BY season
      ORDER BY season ASC
    `;

    return NextResponse.json({
      matchesPlayed: stats.matchesPlayed,
      wins: stats.wins,
      topBatter,
      topBowler,
      seasonTrends
    });

  } catch (error: any) {
    console.error('Error fetching IPL team stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
