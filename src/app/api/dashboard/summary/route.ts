import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPlayerImageUrl } from '@/lib/utils';

export const revalidate = 3600;

export async function GET() {
  try {
    const matchesPerFormat = await prisma.match.groupBy({
      by: ['format'],
      _count: true,
    });

    const totalDeliveries = await prisma.delivery.count();
    const totalPlayers = await prisma.player.count();

    const topRunScorer = await prisma.$queryRaw<any[]>`
      SELECT p.name, p."espnId", SUM(b.runs)::int as "totalRuns"
      FROM batting_summary b
      JOIN "Player" p ON p.id = b."playerId"
      GROUP BY p.name, p."espnId"
      ORDER BY "totalRuns" DESC NULLS LAST
      LIMIT 1
    `;

    const topWicketTaker = await prisma.$queryRaw<any[]>`
      SELECT p.name, p."espnId", SUM(b.wickets)::int as "totalWickets"
      FROM bowling_summary b
      JOIN "Player" p ON p.id = b."playerId"
      GROUP BY p.name, p."espnId"
      ORDER BY "totalWickets" DESC NULLS LAST
      LIMIT 1
    `;

    const mostSixesIPL = await prisma.$queryRaw<any[]>`
      SELECT p.name as "playerName", p."espnId", COUNT(*)::int as "totalSixes"
      FROM "Delivery" d
      JOIN "Match" m ON d."matchId" = m.id
      JOIN "Player" p ON p.name = d.batter
      WHERE d."runsBatter" = 6 
        AND m.format = 'T20' 
        AND (
          m.season ILIKE '%IPL%' 
          OR m.team1 = ANY(ARRAY['Mumbai Indians', 'Chennai Super Kings', 'Royal Challengers Bangalore', 'Kolkata Knight Riders', 'Sunrisers Hyderabad', 'Delhi Capitals', 'Punjab Kings', 'Rajasthan Royals', 'Lucknow Super Giants', 'Gujarat Titans'])
          OR m.team2 = ANY(ARRAY['Mumbai Indians', 'Chennai Super Kings', 'Royal Challengers Bangalore', 'Kolkata Knight Riders', 'Sunrisers Hyderabad', 'Delhi Capitals', 'Punjab Kings', 'Rajasthan Royals', 'Lucknow Super Giants', 'Gujarat Titans'])
        )
      GROUP BY p.name, p."espnId"
      ORDER BY "totalSixes" DESC NULLS LAST
      LIMIT 1
    `;

    return NextResponse.json({
      counts: {
        matchesPerFormat: matchesPerFormat.map(m => ({ format: m.format, count: m._count })),
        totalDeliveries,
        totalPlayers
      },
      highlights: {
        topRunScorer: topRunScorer[0] ? {
          ...topRunScorer[0],
          imageUrl: getPlayerImageUrl(topRunScorer[0].espnId)
        } : null,
        topWicketTaker: topWicketTaker[0] ? {
          ...topWicketTaker[0],
          imageUrl: getPlayerImageUrl(topWicketTaker[0].espnId)
        } : null,
        mostSixesIPL: mostSixesIPL[0] ? {
          playerName: mostSixesIPL[0].playerName,
          totalSixes: mostSixesIPL[0].totalSixes,
          imageUrl: getPlayerImageUrl(mostSixesIPL[0].espnId)
        } : null
      }
    });

  } catch (error: any) {
    console.error('Error fetching dashboard summary:', error);
    return NextResponse.json({ error: 'Internal Server Error', status: 500 }, { status: 500 });
  }
}
