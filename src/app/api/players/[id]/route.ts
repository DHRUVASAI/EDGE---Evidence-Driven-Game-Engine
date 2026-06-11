import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPlayerImageUrl, getDisplayName } from '@/lib/utils';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        careerStats: true,
        auctionHistory: {
          orderBy: { year: 'asc' },
        },
      },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found', status: 404 }, { status: 404 });
    }

    const statsByFormat: Record<string, any> = {};
    player.careerStats.forEach(stat => {
      statsByFormat[stat.format] = stat;
    });

    const recentMatches = await prisma.$queryRaw<any[]>`
      SELECT 
        m.id, m."matchId", m.format, m.date, m.team1, m.team2,
        SUM(CASE WHEN d.batter = ${player.name} THEN d."runsBatter" ELSE 0 END)::int as "runsScored",
        SUM(CASE WHEN d.batter = ${player.name} THEN 1 ELSE 0 END)::int as "ballsFaced",
        SUM(CASE WHEN d.bowler = ${player.name} AND d.wicket IS NOT NULL THEN 1 ELSE 0 END)::int as "wicketsTaken",
        SUM(CASE WHEN d.bowler = ${player.name} THEN d."runsTotal" ELSE 0 END)::int as "runsConceded",
        SUM(CASE WHEN d.bowler = ${player.name} THEN 1 ELSE 0 END)::int as "ballsBowled"
      FROM "Delivery" d
      JOIN "Match" m ON d."matchId" = m.id
      WHERE d.batter = ${player.name} OR d.bowler = ${player.name}
      GROUP BY m.id, m."matchId", m.format, m.date, m.team1, m.team2
      ORDER BY m.date DESC NULLS LAST
      LIMIT 10
    `;

    const processedMatches = recentMatches.map(m => ({
      ...m,
      economy: m.ballsBowled > 0 ? parseFloat(((m.runsConceded * 6) / m.ballsBowled).toFixed(2)) : 0
    }));

    const responseData: any = {
      ...player,
      displayName: getDisplayName(player),
      imageUrl: getPlayerImageUrl(player.espnId),
      careerStats: statsByFormat,
      recentMatches: processedMatches
    };

    if (player.careerStats.length === 0) {
      const computed = await prisma.$queryRaw<any[]>`
        SELECT 
          COUNT(DISTINCT m.id)::int as matches_played,
          SUM(CASE WHEN d.batter = ${player.name} THEN d."runsBatter" ELSE 0 END)::int as total_runs,
          SUM(CASE WHEN d.batter = ${player.name} AND d.wicket IS NOT NULL THEN 1 ELSE 0 END)::int as dismissals,
          SUM(CASE WHEN d.bowler = ${player.name} AND d.wicket IS NOT NULL THEN 1 ELSE 0 END)::int as wickets_taken,
          SUM(CASE WHEN d.bowler = ${player.name} THEN d."runsTotal" ELSE 0 END)::int as runs_conceded,
          SUM(CASE WHEN d.bowler = ${player.name} THEN 1 ELSE 0 END)::int as balls_bowled
        FROM "Delivery" d
        JOIN "Match" m ON d."matchId" = m.id
        WHERE d.batter = ${player.name} OR d.bowler = ${player.name}
      `;
      responseData.computedStats = computed[0] || null;
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Error fetching player details:', error);
    return NextResponse.json({ error: 'Internal Server Error', status: 500 }, { status: 500 });
  }
}
