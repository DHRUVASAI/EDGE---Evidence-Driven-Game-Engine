import { NextResponse } from 'next/server';
import { queryBigQuery, getTableName } from '@/lib/bigquery';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'IPL';
    const player = searchParams.get('player');
    const days = parseInt(searchParams.get('days') || '14');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!player) {
      return NextResponse.json({ error: 'Player parameter required' }, { status: 400 });
    }

    const bowlingTable = getTableName('player_form_features_bowling', format);

    // Query workload data
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

    // Calculate summary stats
    const totalBalls = rows.reduce((sum, r) => sum + (r.balls_bowled || 0), 0);
    const totalWickets = rows.reduce((sum, r) => sum + (r.wickets || 0), 0);
    const totalRuns = rows.reduce((sum, r) => sum + (r.runs_conceded || 0), 0);
    const avgEconomy = rows.length > 0 
      ? rows.reduce((sum, r) => sum + (r.economy || 0), 0) / rows.length 
      : 0;
    const currentWorkload = rows[0]?.['workload_' + days + 'd'] || 0;

    // Risk assessment
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
  } catch (error: any) {
    console.error('Workload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}