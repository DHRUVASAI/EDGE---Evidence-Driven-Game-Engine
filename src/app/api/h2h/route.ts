import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPlayerImageUrl } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const player1Id = searchParams.get('player1');
    const player2Id = searchParams.get('player2');
    const format = searchParams.get('format');

    if (!player1Id || !player2Id || !format) {
      return NextResponse.json({ error: 'Missing player1, player2, or format', status: 400 }, { status: 400 });
    }

    const p1 = await prisma.player.findUnique({ where: { id: player1Id }, include: { careerStats: { where: { format } } } });
    const p2 = await prisma.player.findUnique({ where: { id: player2Id }, include: { careerStats: { where: { format } } } });

    if (!p1 || !p2) {
      return NextResponse.json({ error: 'One or both players not found', status: 404 }, { status: 404 });
    }

    const p1Stats = p1.careerStats[0] || null;
    const p2Stats = p2.careerStats[0] || null;

    const matchup1vs2 = await prisma.$queryRaw<any[]>`
      SELECT SUM(d."runsBatter")::int as runs, COUNT(d.id)::int as balls, SUM(CASE WHEN d.wicket IS NOT NULL THEN 1 ELSE 0 END)::int as dismissals
      FROM "Delivery" d
      JOIN "Match" m ON d."matchId" = m.id
      WHERE d.batter = ${p1.name} AND d.bowler = ${p2.name} AND m.format = ${format}
    `;

    const matchup2vs1 = await prisma.$queryRaw<any[]>`
      SELECT SUM(d."runsBatter")::int as runs, COUNT(d.id)::int as balls, SUM(CASE WHEN d.wicket IS NOT NULL THEN 1 ELSE 0 END)::int as dismissals
      FROM "Delivery" d
      JOIN "Match" m ON d."matchId" = m.id
      WHERE d.batter = ${p2.name} AND d.bowler = ${p1.name} AND m.format = ${format}
    `;

    const responseData = {
      player1: {
        id: p1.id,
        name: p1.name,
        imageUrl: getPlayerImageUrl(p1.espnId),
        careerStats: p1Stats
      },
      player2: {
        id: p2.id,
        name: p2.name,
        imageUrl: getPlayerImageUrl(p2.espnId),
        careerStats: p2Stats
      },
      matchup: {
        player1Batter: {
          runs: matchup1vs2[0]?.runs || 0,
          balls: matchup1vs2[0]?.balls || 0,
          dismissals: matchup1vs2[0]?.dismissals || 0,
        },
        player2Batter: {
          runs: matchup2vs1[0]?.runs || 0,
          balls: matchup2vs1[0]?.balls || 0,
          dismissals: matchup2vs1[0]?.dismissals || 0,
        }
      }
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Error fetching h2h:', error);
    return NextResponse.json({ error: 'Internal Server Error', status: 500 }, { status: 500 });
  }
}
