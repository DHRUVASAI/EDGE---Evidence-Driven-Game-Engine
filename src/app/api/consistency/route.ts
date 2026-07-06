import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { prisma } from '@/lib/prisma';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Laasya%40123@localhost:5432/cricmetrics',
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let player = searchParams.get('player');
    const playerId = searchParams.get('player_id');
    const format = (searchParams.get('format') || 'T20').toUpperCase();
    const dbFormat = format === 'TEST' ? 'Test' : format === 'IPL' ? 'T20' : format;
    const window = parseInt(searchParams.get('window') || '10');
    const requestedMetric = searchParams.get('metric') || 'runs'; // runs, wickets, sr, economy, batting, bowling
    const metric = requestedMetric === 'batting' ? 'runs' : requestedMetric === 'bowling' ? 'wickets' : requestedMetric;

    if (!player && playerId) {
      const foundPlayer = await prisma.player.findUnique({
        where: { id: playerId },
        select: { name: true },
      });
      player = foundPlayer?.name || null;
    }

    if (!player) {
      return NextResponse.json({ error: 'Missing player parameter' }, { status: 400 });
    }

    // Get player's match data with the metric
    let query = '';
    let params: any[] = [player, format, window];

    if (metric === 'runs' || metric === 'sr') {
      query = `
        SELECT 
          m.id as match_id,
          m.date,
          COALESCE(m.venue, m.city, 'Unknown') as venue,
          CONCAT(COALESCE(m.team1, 'Team 1'), ' vs ', COALESCE(m.team2, 'Team 2')) as opponent,
          SUM(d."runsBatter")::int as runs,
          COUNT(*)::int as balls_faced,
          CASE WHEN COUNT(*) > 0 THEN (SUM(d."runsBatter") * 100.0 / COUNT(*))::float ELSE 0 END as strike_rate
        FROM "Delivery" d
        JOIN "Match" m ON d."matchId" = m.id
        WHERE d.batter = $1 AND m.format = $2
        GROUP BY m.id, m.date, m.venue, m.city, m.team1, m.team2
        ORDER BY m.date DESC NULLS LAST
        LIMIT $3
      `;
    } else {
      query = `
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
    }

    params = [player, dbFormat, window];
    const result = await pool.query(query, params);
    const rows = result.rows;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No data found for player' }, { status: 404 });
    }

    // Calculate consistency metrics
    const values = rows.map(r => {
      if (metric === 'runs') return r.runs;
      if (metric === 'sr') return r.strike_rate;
      if (metric === 'wickets') return r.wickets;
      if (metric === 'economy') return r.economy;
      return 0;
    }).filter(v => v !== null && v !== undefined);

    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const cv = mean !== 0 ? (stdDev / mean) * 100 : 0; // Coefficient of Variation %

    // Consistency rating
    let consistencyRating = 'Very Consistent';
    if (cv > 50) consistencyRating = 'Inconsistent';
    else if (cv > 30) consistencyRating = 'Moderately Consistent';
    else if (cv > 15) consistencyRating = 'Consistent';

    // Trend (last 5 vs previous 5)
    let trend = 'Stable';
    if (n >= 10) {
      const recent5 = values.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
      const prev5 = values.slice(5, 10).reduce((a, b) => a + b, 0) / 5;
      const change = ((recent5 - prev5) / prev5) * 100;
      if (change > 15) trend = 'Improving';
      else if (change < -15) trend = 'Declining';
    }

    // Percentile ranks
    const sorted = [...values].sort((a, b) => a - b);
    const p25 = sorted[Math.floor(n * 0.25)];
    const p50 = sorted[Math.floor(n * 0.5)];
    const p75 = sorted[Math.floor(n * 0.75)];

    return NextResponse.json({
      player,
      format,
      metric,
      window: n,
      consistency: {
        mean: parseFloat(mean.toFixed(2)),
        stdDev: parseFloat(stdDev.toFixed(2)),
        cv: parseFloat(cv.toFixed(2)),
        rating: consistencyRating,
        trend,
      },
      percentiles: {
        p25: parseFloat(p25.toFixed(2)),
        p50: parseFloat(p50.toFixed(2)),
        p75: parseFloat(p75.toFixed(2)),
      },
      matchData: rows.map(r => ({
        matchId: r.match_id,
        date: r.date,
        venue: r.venue,
        opponent: r.opponent,
        value: metric === 'runs' ? r.runs : metric === 'sr' ? r.strike_rate : metric === 'wickets' ? r.wickets : r.economy,
      })),
    });
  } catch (error: any) {
    console.error('Consistency error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
