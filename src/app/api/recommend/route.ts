import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Create a connection pool to reuse connections across API requests
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Laasya%40123@localhost:5432/cricmetrics',
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { format = 'T20', over, score, wickets, venue } = body;

    if (over === undefined || score === undefined || wickets === undefined) {
      return NextResponse.json({ error: 'Missing required fields (over, score, wickets)' }, { status: 400 });
    }

    // 1. Derive match phase and input run rate
    let matchPhase = 'death';
    if (over < 6) matchPhase = 'powerplay';
    else if (over < 16) matchPhase = 'middle';

    const inputRR = over === 0 ? 0 : score / over;

    // 2. Build the query to find similar historical situations
    // We look at the actual delivery that matched the context. 
    // To approximate "next ball outcome" and "runs in next over", we aggregate the runs scored on deliveries in this state.
    const query = `
      WITH matches AS (
        SELECT 
          "runsTotal",
          CASE WHEN "runsTotal" = 0 THEN 'Dot'
               WHEN "runsTotal" = 1 THEN 'Single'
               WHEN "runsTotal" = 4 THEN 'Four'
               WHEN "runsTotal" = 6 THEN 'Six'
               ELSE 'Other' END as outcome
        FROM delivery_features
        WHERE 
          match_phase = $1
          AND format = $2
          AND wickets_at_ball BETWEEN $3 AND $4
          -- Calculate RR of the historical state (runs_at_ball / current overs played)
          AND (
            CASE WHEN (over + ball/6.0) = 0 THEN 0 
            ELSE (runs_at_ball / (over + ball/6.0)) END
          ) BETWEEN $5 AND $6
      )
      SELECT 
        COUNT(*) as total_situations,
        AVG("runsTotal") as avg_runs_per_ball,
        MODE() WITHIN GROUP (ORDER BY outcome) as most_common_outcome
      FROM matches;
    `;

    // Query with ±1 wickets and ±1.5 RR
    const values = [
      matchPhase,
      format,
      Math.max(0, wickets - 1),
      wickets + 1,
      Math.max(0, inputRR - 1.5),
      inputRR + 1.5
    ];

    const result = await pool.query(query, values);
    const row = result.rows[0];

    const count = parseInt(row.total_situations || '0', 10);
    if (count === 0) {
      return NextResponse.json({
        recommendation: "Not enough historical data for this exact situation.",
        supportingDeliveryCount: 0,
        avgOutcome: 0,
        mostCommonOutcome: "N/A"
      });
    }

    const avgRunsPerBall = parseFloat(row.avg_runs_per_ball);
    // Approximate "average runs in next over" by multiplying average ball by 6
    const avgRunsNextOver = (avgRunsPerBall * 6).toFixed(1);

    // Formulate a recommendation
    const isAggressive = avgRunsNextOver > 8.0;
    const recommendation = isAggressive
      ? `Historical data suggests an aggressive approach here yields ~${avgRunsNextOver} runs in the next over. While a ${row.most_common_outcome} remains the most frequent single outcome, the high expected run rate justifies prioritizing boundaries.`
      : `Play it steady. Historically teams score ~${avgRunsNextOver} runs in the next over from this position. Focus on strike rotation and minimizing risk; expect a ${row.most_common_outcome} as the typical outcome.`;

    return NextResponse.json({
      recommendation,
      supportingDeliveryCount: count,
      avgOutcome: avgRunsNextOver,
      mostCommonOutcome: row.most_common_outcome
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
