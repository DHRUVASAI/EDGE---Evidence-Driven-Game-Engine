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

    // Run non-joining queries in parallel to keep response time below 200ms
    const [statsRes, mvpBatterRes, mvpBowlerRes, recentMatches] = await Promise.all([
      // 1. Matches and Wins count
      prisma.$queryRaw<any[]>`
        SELECT 
          COUNT(*)::int as "matchesPlayed",
          COUNT(CASE WHEN winner = ANY(${teamNames}) THEN 1 END)::int as "wins"
        FROM "Match"
        WHERE team1 = ANY(${teamNames}) OR team2 = ANY(${teamNames})
      `,

      // 2. Fast Top Batter query using CareerStat (IPL format) and filtering by team player names in AuctionHistory
      prisma.$queryRaw<any[]>`
        SELECT p.id as player_id, p.name, p."fullName", p."imageUrl", cs.runs
        FROM "CareerStat" cs
        JOIN "Player" p ON cs."playerId" = p.id
        WHERE cs.format = 'IPL' AND cs.runs IS NOT NULL
          AND p.id IN (
            SELECT DISTINCT "playerId" FROM "AuctionHistory" WHERE team = ANY(${teamNames})
          )
        ORDER BY cs.runs DESC
        LIMIT 1
      `,

      // 3. Fast Top Bowler query using CareerStat (IPL format) and filtering by team player names in AuctionHistory
      prisma.$queryRaw<any[]>`
        SELECT p.id as player_id, p.name, p."fullName", p."imageUrl", cs.wickets
        FROM "CareerStat" cs
        JOIN "Player" p ON cs."playerId" = p.id
        WHERE cs.format = 'IPL' AND cs.wickets IS NOT NULL
          AND p.id IN (
            SELECT DISTINCT "playerId" FROM "AuctionHistory" WHERE team = ANY(${teamNames})
          )
        ORDER BY cs.wickets DESC
        LIMIT 1
      `,

      // 4. Recent Matches
      prisma.$queryRaw<any[]>`
        SELECT id, date, team1, team2, winner, venue
        FROM "Match"
        WHERE team1 = ANY(${teamNames}) OR team2 = ANY(${teamNames})
        ORDER BY date DESC
        LIMIT 5
      `
    ]);

    const stats = statsRes[0] || { matchesPlayed: 0, wins: 0 };

    const topBatter = mvpBatterRes[0] ? {
      player_id: mvpBatterRes[0].player_id,
      name: mvpBatterRes[0].name,
      fullName: mvpBatterRes[0].fullName,
      imageUrl: getPlayerImageUrl(mvpBatterRes[0].imageUrl || mvpBatterRes[0].player_id),
      runs: mvpBatterRes[0].runs
    } : null;

    const topBowler = mvpBowlerRes[0] ? {
      player_id: mvpBowlerRes[0].player_id,
      name: mvpBowlerRes[0].name,
      fullName: mvpBowlerRes[0].fullName,
      imageUrl: getPlayerImageUrl(mvpBowlerRes[0].imageUrl || mvpBowlerRes[0].player_id),
      wickets: mvpBowlerRes[0].wickets
    } : null;

    return NextResponse.json({
      matchesPlayed: stats.matchesPlayed,
      wins: stats.wins,
      topBatter,
      topBowler,
      recentMatches
    });

  } catch (error: any) {
    console.error('Error fetching IPL team stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
