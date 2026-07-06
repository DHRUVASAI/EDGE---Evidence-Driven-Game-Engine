import { NextResponse } from 'next/server';
import { queryBigQuery, getTableName } from '@/lib/bigquery';
import { Pool } from 'pg';
import { prisma } from '@/lib/prisma';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Laasya%40123@localhost:5432/cricmetrics',
});

function normalizeFormat(format: string) {
  const upper = format.toUpperCase();
  if (upper === 'TEST') return 'Test';
  if (upper === 'IPL') return 'T20';
  return upper;
}

function addRollingFields(rows: any[], windowSize: number, valueKey: string, secondaryKey: string, secondaryRollingKey: string) {
  return rows.map((row, index) => {
    const slice = rows.slice(Math.max(0, index - windowSize + 1), index + 1);
    const values = slice.map((item) => Number(item[valueKey] || 0));
    const secondaryValues = slice.map((item) => Number(item[secondaryKey] || 0));
    const avg = values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
    const secondaryAvg = secondaryValues.reduce((sum, value) => sum + value, 0) / Math.max(secondaryValues.length, 1);
    const variance = values.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / Math.max(values.length, 1);
    const consistency = avg ? Math.max(0, 100 - (Math.sqrt(variance) / avg) * 100) : 0;

    return {
      ...row,
      [`rolling_avg_${windowSize}`]: Number(avg.toFixed(2)),
      [secondaryRollingKey]: Number(secondaryAvg.toFixed(2)),
      [`consistency_${windowSize}`]: Number(consistency.toFixed(2)),
    };
  });
}

async function getLocalFormTrends(player: string, format: string, windowSize: number, limit: number) {
  const dbFormat = normalizeFormat(format);

  const battingSql = `
    SELECT
      m.id as match_id,
      m.date,
      COALESCE(m.venue, m.city, 'Unknown') as venue,
      CONCAT(COALESCE(m.team1, 'Team 1'), ' vs ', COALESCE(m.team2, 'Team 2')) as opponent,
      SUM(d."runsBatter")::int as runs,
      COUNT(*)::int as balls_faced,
      CASE WHEN COUNT(*) > 0 THEN (SUM(d."runsBatter") * 100.0 / COUNT(*))::float ELSE 0 END as sr
    FROM "Delivery" d
    JOIN "Match" m ON d."matchId" = m.id
    WHERE d.batter = $1 AND m.format = $2
    GROUP BY m.id, m.date, m.venue, m.city, m.team1, m.team2
    ORDER BY m.date DESC NULLS LAST
    LIMIT $3
  `;

  const bowlingSql = `
    SELECT
      m.id as match_id,
      m.date,
      COALESCE(m.venue, m.city, 'Unknown') as venue,
      CONCAT(COALESCE(m.team1, 'Team 1'), ' vs ', COALESCE(m.team2, 'Team 2')) as opponent,
      SUM(CASE WHEN d.wicket IS NOT NULL THEN 1 ELSE 0 END)::int as wickets,
      COUNT(*)::int as balls_bowled,
      SUM(d."runsTotal")::int as runs_conceded,
      CASE WHEN COUNT(*) > 0 THEN (SUM(d."runsTotal") * 6.0 / COUNT(*))::float ELSE 0 END as economy
    FROM "Delivery" d
    JOIN "Match" m ON d."matchId" = m.id
    WHERE d.bowler = $1 AND m.format = $2
    GROUP BY m.id, m.date, m.venue, m.city, m.team1, m.team2
    ORDER BY m.date DESC NULLS LAST
    LIMIT $3
  `;

  const [battingResult, bowlingResult] = await Promise.all([
    pool.query(battingSql, [player, dbFormat, limit]),
    pool.query(bowlingSql, [player, dbFormat, limit]),
  ]);

  const batting = addRollingFields([...battingResult.rows].reverse(), windowSize, 'runs', 'sr', `rolling_sr_${windowSize}`);
  const bowling = addRollingFields([...bowlingResult.rows].reverse(), windowSize, 'wickets', 'economy', `rolling_econ_${windowSize}`);

  return {
    batting: [...batting].reverse(),
    bowling: [...bowling].reverse(),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'IPL';
    let player = searchParams.get('player');
    const playerId = searchParams.get('player_id');
    const window = searchParams.get('window') || '5'; // 5 or 10
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!player && playerId) {
      const foundPlayer = await prisma.player.findUnique({
        where: { id: playerId },
        select: { name: true },
      });
      player = foundPlayer?.name || null;
    }

    if (!player) {
      return NextResponse.json({ error: 'Player parameter required' }, { status: 400 });
    }

    const battingTable = getTableName('player_form_features_batting', format);
    const bowlingTable = getTableName('player_form_features_bowling', format);

    // Query batting form trends
    const battingSql = `
      SELECT 
        match_id,
        date,
        venue,
        opponent,
        runs,
        balls_faced,
        sr,
        avg_${window} as rolling_avg_${window},
        sr_${window} as rolling_sr_${window},
        consistency_${window} as consistency_${window}
      FROM ${battingTable}
      WHERE player = @player
      ORDER BY date DESC
      LIMIT ${limit}
    `;

    // Query bowling form trends
    const bowlingSql = `
      SELECT 
        match_id,
        date,
        venue,
        opponent,
        wickets,
        balls_bowled,
        economy,
        avg_${window} as rolling_avg_${window},
        econ_${window} as rolling_econ_${window},
        consistency_${window} as consistency_${window}
      FROM ${bowlingTable}
      WHERE player = @player
      ORDER BY date DESC
      LIMIT ${limit}
    `;

    const [battingRows, bowlingRows] = await Promise.all([
      queryBigQuery(battingSql, { player }),
      queryBigQuery(bowlingSql, { player }),
    ]);

    return NextResponse.json({
      player,
      format,
      window: parseInt(window),
      batting: battingRows,
      bowling: bowlingRows,
    });
  } catch (error: any) {
    console.error('Form trends error:', error);
    try {
      const { searchParams } = new URL(request.url);
      const format = searchParams.get('format') || 'IPL';
      let player = searchParams.get('player');
      const playerId = searchParams.get('player_id');
      const window = parseInt(searchParams.get('window') || '5');
      const limit = parseInt(searchParams.get('limit') || '20');

      if (!player && playerId) {
        const foundPlayer = await prisma.player.findUnique({
          where: { id: playerId },
          select: { name: true },
        });
        player = foundPlayer?.name || null;
      }

      if (!player) {
        return NextResponse.json({ error: 'Player parameter required' }, { status: 400 });
      }

      const localData = await getLocalFormTrends(player, format, window, limit);
      return NextResponse.json({
        player,
        format,
        window,
        ...localData,
        source: 'local-fallback',
      });
    } catch (fallbackError: any) {
      console.error('Form trends local fallback error:', fallbackError);
      return NextResponse.json({ error: fallbackError.message || error.message }, { status: 500 });
    }
  }
}
