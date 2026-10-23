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

async function getLocalWorkload(player: string, format: string, days: number, limit: number) {
  const dbFormat = normalizeFormat(format);
  const sql = `
    SELECT 
      m.id as match_id,
      m.date,
      COALESCE(m.venue, m.city, 'Unknown') as venue,
      CONCAT(COALESCE(m.team1, 'Team 1'), ' vs ', COALESCE(m.team2, 'Team 2')) as opponent,
      COUNT(*)::int as balls_bowled,
      (COUNT(*) / 6.0)::float as overs,
      SUM(d."runsTotal")::int as runs_conceded,
      SUM(CASE WHEN d.wicket IS NOT NULL THEN 1 ELSE 0 END)::int as wickets,
      CASE WHEN COUNT(*) > 0 THEN (SUM(d."runsTotal") * 6.0 / COUNT(*))::float ELSE 0 END as economy,
      0::float as death_economy,
      COUNT(*)::int as "workload_${days}d",
      CASE WHEN COUNT(*) > 0 THEN (SUM(d."runsTotal") * 6.0 / COUNT(*))::float ELSE 0 END as rolling_avg_economy,
      SUM(CASE WHEN d.wicket IS NOT NULL THEN 1 ELSE 0 END)::int as rolling_avg_wickets,
      COUNT(*)::int as rolling_workload_balls
    FROM "Delivery" d
    JOIN "Match" m ON d."matchId" = m.id
    WHERE d.bowler = $1 AND m.format = $2
    GROUP BY m.id, m.date, m.venue, m.city, m.team1, m.team2
    ORDER BY m.date DESC NULLS LAST
    LIMIT $3
  `;

  const result = await pool.query(sql, [player, dbFormat, limit]);
  const rows = result.rows;

  const totalBalls = rows.reduce((sum, r) => sum + (r.balls_bowled || 0), 0);
  const totalWickets = rows.reduce((sum, r) => sum + (r.wickets || 0), 0);
  const totalRuns = rows.reduce((sum, r) => sum + (r.runs_conceded || 0), 0);
  const avgEconomy = rows.length > 0 
    ? rows.reduce((sum, r) => sum + (r.economy || 0), 0) / rows.length 
    : 0;
  const currentWorkload = rows[0]?.balls_bowled || 0;

  let riskLevel = 'Low';
  let riskReason = 'Workload within normal range';
  if (currentWorkload > 120) {
    riskLevel = 'High';
    riskReason = `High workload (${currentWorkload} balls). Consider resting or reducing overs.`;
  } else if (currentWorkload > 80) {
    riskLevel = 'Medium';
    riskReason = `Moderate workload (${currentWorkload} balls). Monitor closely.`;
  }

  return {
    player,
    format,
    windowDays: days,
    matches: rows,
    summary: {
      matchesAnalyzed: rows.length,
      totalBalls,
      totalWickets,
      totalRunsConceded: totalRuns,
      avgEconomy: parseFloat(avgEconomy.toFixed(2)),
      currentWorkload,
      riskLevel,
      riskReason,
    },
    source: 'local-fallback',
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'IPL';
    let player = searchParams.get('player');
    const playerId = searchParams.get('player_id');
    const days = parseInt(searchParams.get('days') || '14');
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

    try {
      const bowlingTable = getTableName('player_form_features_bowling', format);

      // Query workload data from BigQuery
      const sql = `
        SELECT 
          match_id,
          date,
          venue,
          opponent,
          balls_bowled,
          overs,
          runs_conceded,
          wickets,
          economy,
          death_economy,
          workload_${days}d as workload_${days}d,
          rolling_${days}_avg_economy as rolling_avg_economy,
          rolling_${days}_avg_wickets as rolling_avg_wickets,
          rolling_${days}_workload_balls as rolling_workload_balls
        FROM ${bowlingTable}
        WHERE player = @player
        ORDER BY date DESC
        LIMIT ${limit}
      `;

      const rows = await queryBigQuery(sql, { player });

      const totalBalls = rows.reduce((sum, r) => sum + (r.balls_bowled || 0), 0);
      const totalWickets = rows.reduce((sum, r) => sum + (r.wickets || 0), 0);
      const totalRuns = rows.reduce((sum, r) => sum + (r.runs_conceded || 0), 0);
      const avgEconomy = rows.length > 0 
        ? rows.reduce((sum, r) => sum + (r.economy || 0), 0) / rows.length 
        : 0;
      const currentWorkload = rows[0]?.['workload_' + days + 'd'] || 0;

      let riskLevel = 'Low';
      let riskReason = 'Workload within normal range';
      
      if (currentWorkload > 120) {
        riskLevel = 'High';
        riskReason = `High workload (${currentWorkload} balls in last ${days} days). Consider resting or reducing overs.`;
      } else if (currentWorkload > 80) {
        riskLevel = 'Medium';
        riskReason = `Moderate workload (${currentWorkload} balls in last ${days} days). Monitor closely.`;
      }

      return NextResponse.json({
        player,
        format,
        windowDays: days,
        matches: rows,
        summary: {
          matchesAnalyzed: rows.length,
          totalBalls,
          totalWickets,
          totalRunsConceded: totalRuns,
          avgEconomy: parseFloat(avgEconomy.toFixed(2)),
          currentWorkload,
          riskLevel,
          riskReason,
        },
      });
    } catch {
      // BigQuery unavailable -> fallback to PostgreSQL database
      const fallback = await getLocalWorkload(player, format, days, limit);
      return NextResponse.json(fallback);
    }
  } catch (error: any) {
    console.error('Workload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}