import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPlayerImageUrl } from '@/lib/utils';

export const revalidate = 3600;

const IPL_TEAMS = [
  'Mumbai Indians', 'Chennai Super Kings', 'Royal Challengers Bangalore',
  'Kolkata Knight Riders', 'Rajasthan Royals', 'Delhi Capitals',
  'Kings XI Punjab', 'Sunrisers Hyderabad', 'Deccan Chargers',
  'Pune Warriors', 'Rising Pune Supergiant', 'Rising Pune Supergiants',
  'Gujarat Lions', 'Lucknow Super Giants', 'Gujarat Titans',
  'Punjab Kings', 'Delhi Daredevils', 'Kochi Tuskers Kerala',
  'Royal Challengers Bengaluru'
];

export async function GET() {
  try {
    const matchesPerFormat = await prisma.match.groupBy({
      by: ['format'],
      _count: true,
    });

    const totalDeliveries = await prisma.delivery.count();
    const totalPlayers = await prisma.player.count();

    // 1. Matches by Season (Trend Line)
    const matchesBySeason = await prisma.$queryRaw<any[]>`
      SELECT season, COUNT(*)::int as count
      FROM "Match"
      WHERE season ~ '^[0-9]{4}$'
      GROUP BY season
      ORDER BY season ASC
    `;

    // 2. Top Venues (Bar Chart)
    const topVenues = await prisma.$queryRaw<any[]>`
      SELECT venue, COUNT(*)::int as count
      FROM "Match"
      WHERE venue IS NOT NULL AND venue != ''
      GROUP BY venue
      ORDER BY count DESC
      LIMIT 5
    `;

    // 3. IPL Orange Cap (Top 5 Runs)
    const iplOrangeCap = await prisma.$queryRaw<any[]>`
      SELECT p.id, p.name, p."fullName", p."imageUrl", p.country, p.role, SUM(d."runsBatter")::int as "totalRuns"
      FROM "Delivery" d
      JOIN "Match" m ON d."matchId" = m.id
      JOIN "Player" p ON p.name = d.batter
      WHERE m.format = 'T20' AND (
        m.team1 = ANY(${IPL_TEAMS}) 
        OR m.team2 = ANY(${IPL_TEAMS})
      )
      GROUP BY p.id, p.name, p."fullName", p."imageUrl", p.country, p.role
      ORDER BY "totalRuns" DESC NULLS LAST
      LIMIT 5
    `;

    // 4. IPL Purple Cap (Top 5 Wickets)
    const iplPurpleCap = await prisma.$queryRaw<any[]>`
      SELECT p.id, p.name, p."fullName", p."imageUrl", p.country, p.role, COUNT(*)::int as "totalWickets"
      FROM "Delivery" d
      JOIN "Match" m ON d."matchId" = m.id
      JOIN "Player" p ON p.name = d.bowler
      WHERE m.format = 'T20' AND (
        m.team1 = ANY(${IPL_TEAMS}) 
        OR m.team2 = ANY(${IPL_TEAMS})
      )
      AND d.wicket IS NOT NULL 
      AND (d.wicket->0->>'kind') NOT IN ('run out', 'retired hurt', 'obstructing the field')
      GROUP BY p.id, p.name, p."fullName", p."imageUrl", p.country, p.role
      ORDER BY "totalWickets" DESC NULLS LAST
      LIMIT 5
    `;

    // 5. Traditional highlight details
    const topRunScorer = await prisma.$queryRaw<any[]>`
      SELECT p.name, p."espnId", p."imageUrl", SUM(b.runs)::int as "totalRuns"
      FROM batting_summary b
      JOIN "Player" p ON p.id = b."playerId"
      GROUP BY p.name, p."espnId", p."imageUrl"
      ORDER BY "totalRuns" DESC NULLS LAST
      LIMIT 1
    `;

    const topWicketTaker = await prisma.$queryRaw<any[]>`
      SELECT p.name, p."espnId", p."imageUrl", SUM(b.wickets)::int as "totalWickets"
      FROM bowling_summary b
      JOIN "Player" p ON p.id = b."playerId"
      GROUP BY p.name, p."espnId", p."imageUrl"
      ORDER BY "totalWickets" DESC NULLS LAST
      LIMIT 1
    `;

    const mostSixesIPL = await prisma.$queryRaw<any[]>`
      SELECT p.name as "playerName", p."espnId", p."imageUrl", COUNT(*)::int as "totalSixes"
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
      GROUP BY p.name, p."espnId", p."imageUrl"
      ORDER BY "totalSixes" DESC NULLS LAST
      LIMIT 1
    `;

    // Format results with fallback images
    const formatHighlight = (p: any) => {
      if (!p) return null;
      return {
        ...p,
        imageUrl: getPlayerImageUrl(p.imageUrl || p.espnId)
      };
    };

    const formatPlayer = (p: any) => ({
      ...p,
      imageUrl: getPlayerImageUrl(p.imageUrl)
    });

    return NextResponse.json({
      counts: {
        matchesPerFormat: matchesPerFormat.map(m => ({ format: m.format, count: m._count })),
        totalDeliveries,
        totalPlayers
      },
      seasonTrends: matchesBySeason,
      topVenues,
      iplSummary: {
        orangeCap: iplOrangeCap.map(formatPlayer),
        purpleCap: iplPurpleCap.map(formatPlayer)
      },
      highlights: {
        topRunScorer: formatHighlight(topRunScorer[0]),
        topWicketTaker: formatHighlight(topWicketTaker[0]),
        mostSixesIPL: formatHighlight(mostSixesIPL[0])
      }
    });

  } catch (error: any) {
    console.error('Error fetching dashboard summary:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
