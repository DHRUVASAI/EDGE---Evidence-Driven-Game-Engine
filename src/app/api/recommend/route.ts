import { NextResponse } from 'next/server';
import { Pool } from 'pg';

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

    // 1. Derive match phase and input run rate based on format
    let matchPhase = 'death';
    if (format === 'ODI') {
      if (over < 10) matchPhase = 'powerplay';
      else if (over < 40) matchPhase = 'middle';
    } else {
      if (over < 6) matchPhase = 'powerplay';
      else if (over < 16) matchPhase = 'middle';
    }

    const inputRR = over === 0 ? 0 : score / over;

    let count = 0;
    let avgRunsNextOver = '0.0';
    let mostCommonOutcome = 'Dot';

    if (format === 'ODI') {
      // Fetch similar ODI deliveries using indexed match-ID approach
      const matchesRes = await pool.query('SELECT id FROM "Match" WHERE format = \'ODI\' LIMIT 80');
      const matchIds = matchesRes.rows.map(r => r.id);

      if (matchIds.length > 0) {
        const deliveriesRes = await pool.query(`
          SELECT "runsTotal", COUNT(*)::int as count
          FROM "Delivery"
          WHERE "matchId" = ANY($1) AND over = $2
          GROUP BY "runsTotal"
        `, [matchIds, over]);

        let totalRuns = 0;
        let totalBalls = 0;
        let maxCount = -1;

        const outcomes: Record<string, number> = { Dot: 0, Single: 0, Four: 0, Six: 0, Other: 0 };

        deliveriesRes.rows.forEach(row => {
          const r = row.runsTotal;
          const c = row.count;

          totalRuns += r * c;
          totalBalls += c;

          if (r === 0) outcomes.Dot += c;
          else if (r === 1) outcomes.Single += c;
          else if (r === 4) outcomes.Four += c;
          else if (r === 6) outcomes.Six += c;
          else outcomes.Other += c;
        });

        count = totalBalls;

        if (count > 0) {
          const avgRunsPerBall = totalRuns / count;
          avgRunsNextOver = (avgRunsPerBall * 6).toFixed(1);

          // Find most common outcome
          Object.entries(outcomes).forEach(([key, val]) => {
            if (val > maxCount) {
              maxCount = val;
              mostCommonOutcome = key;
            }
          });
        }
      }
    } else {
      // Standard T20 query using delivery_features
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

      count = parseInt(row.total_situations || '0', 10);
      if (count > 0) {
        const avgRunsPerBall = parseFloat(row.avg_runs_per_ball);
        avgRunsNextOver = (avgRunsPerBall * 6).toFixed(1);
        mostCommonOutcome = row.most_common_outcome || 'Dot';
      }
    }

    if (count === 0) {
      return NextResponse.json({
        recommendation: "Not enough historical data for this exact situation.",
        supportingDeliveryCount: 0,
        avgOutcome: 0,
        mostCommonOutcome: "N/A"
      });
    }

    const runsNextVal = parseFloat(avgRunsNextOver);
    const isAggressive = format === 'ODI' ? runsNextVal > 6.0 : runsNextVal > 8.0;
    const recommendation = isAggressive
      ? `Historical data suggests an aggressive approach here yields ~${avgRunsNextOver} runs in the next over. While a ${mostCommonOutcome} remains the most frequent single outcome, the high expected run rate justifies prioritizing boundaries.`
      : `Play it steady. Historically teams score ~${avgRunsNextOver} runs in the next over from this position. Focus on strike rotation and minimizing risk; expect a ${mostCommonOutcome} as the typical outcome.`;

    return NextResponse.json({
      recommendation,
      supportingDeliveryCount: count,
      avgOutcome: avgRunsNextOver,
      mostCommonOutcome
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
