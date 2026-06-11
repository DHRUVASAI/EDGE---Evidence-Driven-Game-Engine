import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getPlayerImageUrl, getDisplayName } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const stat = searchParams.get('stat');
    const season = searchParams.get('season');

    if (!format || !stat) {
      return NextResponse.json({ error: 'Missing format or stat', status: 400 }, { status: 400 });
    }

    const validStats = ['runs', 'wickets', 'avg', 'sr', 'econ', 'hundreds'];
    if (!validStats.includes(stat)) {
      return NextResponse.json({ error: 'Invalid stat parameter', status: 400 }, { status: 400 });
    }

    const isBatting = ['runs', 'avg', 'sr', 'hundreds'].includes(stat);
    let results: any[] = [];

    let formatFilter = Prisma.sql`m.format = ${format}`;
    if (format === 'IPL') {
      formatFilter = Prisma.sql`m.format = 'T20' AND (
        m.season ILIKE '%IPL%' 
        OR m.team1 = ANY(ARRAY['Mumbai Indians', 'Chennai Super Kings', 'Royal Challengers Bangalore', 'Kolkata Knight Riders', 'Sunrisers Hyderabad', 'Delhi Capitals', 'Punjab Kings', 'Rajasthan Royals', 'Lucknow Super Giants', 'Gujarat Titans'])
        OR m.team2 = ANY(ARRAY['Mumbai Indians', 'Chennai Super Kings', 'Royal Challengers Bangalore', 'Kolkata Knight Riders', 'Sunrisers Hyderabad', 'Delhi Capitals', 'Punjab Kings', 'Rajasthan Royals', 'Lucknow Super Giants', 'Gujarat Titans'])
      )`;
    }

    if (season) {
      // Aggregate Delivery table for the specific season
      if (isBatting) {
        if (stat === 'runs') {
          results = await prisma.$queryRaw<any[]>`
            SELECT p.name as "playerName", p."fullName", p."espnId", COUNT(DISTINCT m.id)::int as matches, SUM(d."runsBatter")::int as value
            FROM "Player" p
            JOIN "Delivery" d ON p.name = d.batter
            JOIN "Match" m ON d."matchId" = m.id
            WHERE ${formatFilter} AND m.season = ${season}
            GROUP BY p.id
            ORDER BY value DESC NULLS LAST
            LIMIT 20
          `;
        } else if (stat === 'sr') {
          results = await prisma.$queryRaw<any[]>`
            SELECT p.name as "playerName", p."fullName", p."espnId", COUNT(DISTINCT m.id)::int as matches, 
                   (SUM(d."runsBatter") * 100.0 / COUNT(d.id))::float as value
            FROM "Player" p
            JOIN "Delivery" d ON p.name = d.batter
            JOIN "Match" m ON d."matchId" = m.id
            WHERE ${formatFilter} AND m.season = ${season}
            GROUP BY p.id
            HAVING COUNT(d.id) > 50
            ORDER BY value DESC NULLS LAST
            LIMIT 20
          `;
        } else if (stat === 'hundreds') {
          results = await prisma.$queryRaw<any[]>`
            SELECT "playerName", "espnId", COUNT(match_id)::int as matches, SUM(CASE WHEN runs >= 100 THEN 1 ELSE 0 END)::int as value
            FROM (
              SELECT p.name as "playerName", p."fullName", p."espnId", m.id as match_id, SUM(d."runsBatter") as runs
              FROM "Player" p
              JOIN "Delivery" d ON p.name = d.batter
              JOIN "Match" m ON d."matchId" = m.id
              WHERE ${formatFilter} AND m.season = ${season}
              GROUP BY p.id, m.id
            ) match_runs
            GROUP BY "playerName", "espnId"
            ORDER BY value DESC NULLS LAST
            LIMIT 20
          `;
        } else if (stat === 'avg') {
          // Approximate average using runs / dismissals
          results = await prisma.$queryRaw<any[]>`
            SELECT p.name as "playerName", p."fullName", p."espnId", COUNT(DISTINCT m.id)::int as matches, 
                   CASE WHEN SUM(CASE WHEN d.wicket IS NOT NULL AND d.batter = (d.wicket->>'player_out') THEN 1 ELSE 0 END) > 0 
                        THEN SUM(d."runsBatter")::float / SUM(CASE WHEN d.wicket IS NOT NULL AND d.batter = (d.wicket->>'player_out') THEN 1 ELSE 0 END)
                        ELSE SUM(d."runsBatter")::float 
                   END as value
            FROM "Player" p
            JOIN "Delivery" d ON p.name = d.batter
            JOIN "Match" m ON d."matchId" = m.id
            WHERE ${formatFilter} AND m.season = ${season}
            GROUP BY p.id
            HAVING SUM(d."runsBatter") > 100
            ORDER BY value DESC NULLS LAST
            LIMIT 20
          `;
        }
      } else {
        // Bowling season queries
        if (stat === 'wickets') {
          results = await prisma.$queryRaw<any[]>`
            SELECT p.name as "playerName", p."fullName", p."espnId", COUNT(DISTINCT m.id)::int as matches, SUM(CASE WHEN d.wicket IS NOT NULL THEN 1 ELSE 0 END)::int as value
            FROM "Player" p
            JOIN "Delivery" d ON p.name = d.bowler
            JOIN "Match" m ON d."matchId" = m.id
            WHERE ${formatFilter} AND m.season = ${season}
            GROUP BY p.id
            ORDER BY value DESC NULLS LAST
            LIMIT 20
          `;
        } else if (stat === 'econ') {
          results = await prisma.$queryRaw<any[]>`
            SELECT p.name as "playerName", p."fullName", p."espnId", COUNT(DISTINCT m.id)::int as matches, 
                   (SUM(d."runsTotal") * 6.0 / COUNT(d.id))::float as value
            FROM "Player" p
            JOIN "Delivery" d ON p.name = d.bowler
            JOIN "Match" m ON d."matchId" = m.id
            WHERE ${formatFilter} AND m.season = ${season}
            GROUP BY p.id
            HAVING COUNT(d.id) > 60
            ORDER BY value ASC NULLS LAST
            LIMIT 20
          `;
        } else if (stat === 'avg') {
          results = await prisma.$queryRaw<any[]>`
            SELECT p.name as "playerName", p."fullName", p."espnId", COUNT(DISTINCT m.id)::int as matches, 
                   (SUM(d."runsTotal")::float / NULLIF(SUM(CASE WHEN d.wicket IS NOT NULL THEN 1 ELSE 0 END), 0))::float as value
            FROM "Player" p
            JOIN "Delivery" d ON p.name = d.bowler
            JOIN "Match" m ON d."matchId" = m.id
            WHERE m.format = ${format} AND m.season = ${season}
            GROUP BY p.id
            HAVING SUM(CASE WHEN d.wicket IS NOT NULL THEN 1 ELSE 0 END) > 5
            ORDER BY value ASC NULLS LAST
            LIMIT 20
          `;
        }
      }
    } else {
      // Use Materialized views or CareerStat
      if (stat === 'hundreds') {
         // Fallback to CareerStat since materialized view lacks 'hundreds'
         results = await prisma.$queryRaw<any[]>`
           SELECT p.name as "playerName", p."fullName", p."espnId", c.matches::int, c.hundreds as value
           FROM "CareerStat" c
           JOIN "Player" p ON p.id = c."playerId"
           WHERE c.format = ${format} AND c.hundreds IS NOT NULL
           ORDER BY value DESC NULLS LAST
           LIMIT 20
         `;
      } else if (stat === 'avg' && isBatting) {
         results = await prisma.$queryRaw<any[]>`
           SELECT p.name as "playerName", p."fullName", p."espnId", c.matches::int, c.avg as value
           FROM "CareerStat" c
           JOIN "Player" p ON p.id = c."playerId"
           WHERE c.format = ${format} AND c.avg IS NOT NULL
           ORDER BY value DESC NULLS LAST
           LIMIT 20
         `;
      } else if (stat === 'avg' && !isBatting) {
         results = await prisma.$queryRaw<any[]>`
           SELECT p.name as "playerName", p."fullName", p."espnId", c.matches::int, c."bowlAvg" as value
           FROM "CareerStat" c
           JOIN "Player" p ON p.id = c."playerId"
           WHERE c.format = ${format} AND c."bowlAvg" IS NOT NULL
           ORDER BY value ASC NULLS LAST
           LIMIT 20
         `;
      } else {
         let viewName = isBatting ? 'batting_summary' : 'bowling_summary';
         if (format === 'IPL') {
           viewName = isBatting ? 'ipl_batting_summary' : 'ipl_bowling_summary';
         }
         let statCol = '';
         if (stat === 'runs') statCol = 'runs';
         if (stat === 'sr') statCol = 'strikeRate';
         if (stat === 'wickets') statCol = 'wickets';
         if (stat === 'econ') statCol = 'economy';

         const order = (stat === 'econ') ? 'ASC' : 'DESC';

         // Safe dynamic query using raw string building since parameters are validated above
         if (format === 'IPL') {
           results = await prisma.$queryRawUnsafe(`
             SELECT p.name as "playerName", p."fullName", p."espnId", v.matches::int, v."${statCol}" as value
             FROM ${viewName} v
             JOIN "Player" p ON p.id = v."playerId"
             ORDER BY v."${statCol}" ${order} NULLS LAST
             LIMIT 20
           `);
         } else {
           results = await prisma.$queryRawUnsafe(`
             SELECT p.name as "playerName", p."fullName", p."espnId", v.matches::int, v."${statCol}" as value
             FROM ${viewName} v
             JOIN "Player" p ON p.id = v."playerId"
             WHERE v.format = $1
             ORDER BY v."${statCol}" ${order} NULLS LAST
             LIMIT 20
           `, format);
         }
      }
    }

    const leaderboard = results.map((r, index) => ({
      rank: index + 1,
      playerName: getDisplayName({ name: r.playerName, fullName: r.fullName }),
      value: typeof r.value === 'bigint' ? Number(r.value) : r.value,
      matches: typeof r.matches === 'bigint' ? Number(r.matches) : r.matches,
      imageUrl: getPlayerImageUrl(r.espnId)
    }));

    return NextResponse.json(leaderboard);
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Internal Server Error', status: 500 }, { status: 500 });
  }
}
