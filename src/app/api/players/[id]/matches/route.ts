import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 10;
    const offset = (page - 1) * limit;

    if (!format) {
      return NextResponse.json({ error: 'Missing format', status: 400 }, { status: 400 });
    }

    const player = await prisma.player.findUnique({ where: { id } });
    if (!player) {
      return NextResponse.json({ error: 'Player not found', status: 404 }, { status: 404 });
    }

    const totalResult = await prisma.$queryRaw<any[]>`
      SELECT COUNT(DISTINCT m.id)::int as count
      FROM "Delivery" d
      JOIN "Match" m ON d."matchId" = m.id
      WHERE (d.batter = ${player.name} OR d.bowler = ${player.name}) AND m.format = ${format}
    `;
    const totalMatches = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(totalMatches / limit);

    const matches = await prisma.$queryRaw<any[]>`
      SELECT 
        m.id, m."matchId", m.format, m.date, m.team1, m.team2,
        SUM(CASE WHEN d.batter = ${player.name} THEN d."runsBatter" ELSE 0 END)::int as "runsScored",
        SUM(CASE WHEN d.batter = ${player.name} THEN 1 ELSE 0 END)::int as "ballsFaced",
        SUM(CASE WHEN d.bowler = ${player.name} AND d.wicket IS NOT NULL THEN 1 ELSE 0 END)::int as "wicketsTaken",
        SUM(CASE WHEN d.bowler = ${player.name} THEN d."runsTotal" ELSE 0 END)::int as "runsConceded",
        SUM(CASE WHEN d.bowler = ${player.name} THEN 1 ELSE 0 END)::int as "ballsBowled"
      FROM "Delivery" d
      JOIN "Match" m ON d."matchId" = m.id
      WHERE (d.batter = ${player.name} OR d.bowler = ${player.name}) AND m.format = ${format}
      GROUP BY m.id, m."matchId", m.format, m.date, m.team1, m.team2
      ORDER BY m.date DESC NULLS LAST
      LIMIT ${limit} OFFSET ${offset}
    `;

    const processedMatches = matches.map(m => ({
      ...m,
      economy: m.ballsBowled > 0 ? parseFloat(((m.runsConceded * 6) / m.ballsBowled).toFixed(2)) : 0
    }));

    return NextResponse.json({
      matches: processedMatches,
      totalPages,
      currentPage: page
    });
  } catch (error: any) {
    console.error('Error fetching player matches:', error);
    return NextResponse.json({ error: 'Internal Server Error', status: 500 }, { status: 500 });
  }
}
