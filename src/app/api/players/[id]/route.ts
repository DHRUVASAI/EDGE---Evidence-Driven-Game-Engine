import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPlayerImageUrl, getDisplayName } from '@/lib/utils';
import { generatePlayerBio } from '@/lib/generatePlayerBio';

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

    // Dynamically compute stats from Delivery/Match tables for missing formats
    const computedFormats = await prisma.$queryRaw<any[]>`
      SELECT 
        m.format,
        COUNT(DISTINCT m.id)::int as matches_played,
        SUM(CASE WHEN d.batter = ${player.name} THEN d."runsBatter" ELSE 0 END)::int as total_runs,
        SUM(CASE WHEN d.batter = ${player.name} AND d.wicket IS NOT NULL THEN 1 ELSE 0 END)::int as dismissals,
        SUM(CASE WHEN d.batter = ${player.name} THEN 1 ELSE 0 END)::int as balls_faced,
        SUM(CASE WHEN d.bowler = ${player.name} AND d.wicket IS NOT NULL THEN 1 ELSE 0 END)::int as wickets_taken,
        SUM(CASE WHEN d.bowler = ${player.name} THEN d."runsTotal" ELSE 0 END)::int as runs_conceded,
        SUM(CASE WHEN d.bowler = ${player.name} THEN 1 ELSE 0 END)::int as balls_bowled
      FROM "Delivery" d
      JOIN "Match" m ON d."matchId" = m.id
      WHERE d.batter = ${player.name} OR d.bowler = ${player.name}
      GROUP BY m.format
    `;

    computedFormats.forEach(f => {
      const fmt = f.format;
      if (!statsByFormat[fmt] && f.matches_played > 0) {
        statsByFormat[fmt] = {
          id: `computed-${fmt}-${player.id}`,
          playerId: player.id,
          format: fmt,
          matches: f.matches_played,
          runs: f.total_runs,
          avg: f.dismissals > 0 ? parseFloat((f.total_runs / f.dismissals).toFixed(2)) : f.total_runs,
          sr: f.balls_faced > 0 ? parseFloat(((f.total_runs / f.balls_faced) * 100).toFixed(2)) : 0,
          wickets: f.wickets_taken,
          econ: f.balls_bowled > 0 ? parseFloat(((f.runs_conceded * 6) / f.balls_bowled).toFixed(2)) : 0
        };
      }
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
      imageUrl: player.imageUrl || getPlayerImageUrl(player.espnId),
      careerStats: statsByFormat,
      recentMatches: processedMatches
    };

    let runs = 0, wickets = 0, matches = 0;
    Object.values(statsByFormat).forEach((s: any) => {
      runs += s.runs || 0;
      wickets += s.wickets || 0;
      matches += s.matches || 0;
    });
      
      const bio = await generatePlayerBio({
        name: player.fullName || player.name,
        country: player.country,
        role: player.role,
        battingStyle: player.battingStyle,
        bowlingStyle: player.bowlingStyle,
        runs,
        wickets,
        matches,
      });

      if (bio) {
        await prisma.player.update({
          where: { id: player.id },
          data: { bio },
        });
        responseData.bio = bio;
      }
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Error fetching player details:', error);
    return NextResponse.json({ error: 'Internal Server Error', status: 500 }, { status: 500 });
  }
}
