import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Laasya%40123@localhost:5432/cricmetrics',
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mode = 'situation', format = 'T20', over, score, wickets } = body;

    if (over === undefined || score === undefined || wickets === undefined) {
      return NextResponse.json({ error: 'Missing required fields (over, score, wickets)' }, { status: 400 });
    }

    // ==========================================
    // 1. MODE: BOWLING CHANGE RECOMMENDATIONS
    // ==========================================
    if (mode === 'bowling') {
      const { currentBowler = 'JJ Bumrah', runsConceded = 0, wicketsTaken = 0, oversBowled = 1 } = body;

      // Classify bowler style: pace vs spin
      const bowlerRes = await pool.query(
        `SELECT name, "bowlingStyle" FROM "Player" WHERE name ILIKE $1 OR "fullName" ILIKE $1 LIMIT 1`,
        [`%${currentBowler}%`]
      );
      
      let bowlerStyle = 'pace';
      let matchedName = currentBowler;
      if (bowlerRes.rows.length > 0) {
        matchedName = bowlerRes.rows[0].name;
        const s = (bowlerRes.rows[0].bowlingStyle || '').toLowerCase();
        if (s.includes('spin') || s.includes('orthodox') || s.includes('legbreak') || s.includes('googly') || s.includes('offbreak') || s.includes('slow')) {
          bowlerStyle = 'spin';
        }
      }

      // Query bowler's own historical stats in this over
      const bowlerHistory = await pool.query(
        `SELECT SUM("runsTotal")::int as total_runs, COUNT(*)::int as total_balls,
                SUM(CASE WHEN wicket IS NOT NULL THEN 1 ELSE 0 END)::int as total_wickets
         FROM "Delivery"
         WHERE bowler = $1 AND over = $2`,
        [matchedName, over]
      );
      const bh = bowlerHistory.rows[0];
      const bowlerAvgRuns = bh && bh.total_balls > 0 ? ((bh.total_runs / bh.total_balls) * 6).toFixed(1) : 'N/A';
      const bowlerWicketsCount = bh ? bh.total_wickets || 0 : 0;

      let paceRuns = 0, paceBalls = 0, paceWickets = 0;
      let spinRuns = 0, spinBalls = 0, spinWickets = 0;
      let totalScenarios = 0;

      if (format === 'T20') {
        // Query similar match situations at this over
        const matchesRes = await pool.query(`
          SELECT DISTINCT "matchId"
          FROM delivery_features
          WHERE over = $1 AND wickets_at_ball BETWEEN $2 AND $3
          LIMIT 100
        `, [over, Math.max(0, wickets - 1), wickets + 1]);
        const matchIds = matchesRes.rows.map(r => r.matchId);

        if (matchIds.length > 0) {
          const deliveriesRes = await pool.query(`
            SELECT bowler, "runsTotal", wicket
            FROM "Delivery"
            WHERE "matchId" = ANY($1) AND over = $2
          `, [matchIds, over]);

          totalScenarios = matchIds.length;

          const uniqueBowlers = Array.from(new Set(deliveriesRes.rows.map(d => d.bowler)));
          const styleMap: Record<string, string> = {};
          if (uniqueBowlers.length > 0) {
            const playersRes = await pool.query(`
              SELECT name, "bowlingStyle"
              FROM "Player"
              WHERE name = ANY($1)
            `, [uniqueBowlers]);
            playersRes.rows.forEach(p => {
              const s = (p.bowlingStyle || '').toLowerCase();
              const style = (s.includes('spin') || s.includes('orthodox') || s.includes('legbreak') || s.includes('googly') || s.includes('offbreak') || s.includes('slow')) ? 'spin' : 'pace';
              styleMap[p.name] = style;
            });
          }

          deliveriesRes.rows.forEach(d => {
            const style = styleMap[d.bowler] || 'pace';
            if (style === 'spin') {
              spinRuns += d.runsTotal;
              spinBalls += 1;
              if (d.wicket) spinWickets += 1;
            } else {
              paceRuns += d.runsTotal;
              paceBalls += 1;
              if (d.wicket) paceWickets += 1;
            }
          });
        }
      } else {
        // ODI mode
        const matchesRes = await pool.query(`
          SELECT id FROM "Match" WHERE format = 'ODI' LIMIT 80
        `);
        const matchIds = matchesRes.rows.map(r => r.id);

        if (matchIds.length > 0) {
          const deliveriesRes = await pool.query(`
            SELECT bowler, "runsTotal", wicket
            FROM "Delivery"
            WHERE "matchId" = ANY($1) AND over = $2
          `, [matchIds, over]);

          totalScenarios = matchIds.length;

          const uniqueBowlers = Array.from(new Set(deliveriesRes.rows.map(d => d.bowler)));
          const styleMap: Record<string, string> = {};
          if (uniqueBowlers.length > 0) {
            const playersRes = await pool.query(`
              SELECT name, "bowlingStyle"
              FROM "Player"
              WHERE name = ANY($1)
            `, [uniqueBowlers]);
            playersRes.rows.forEach(p => {
              const s = (p.bowlingStyle || '').toLowerCase();
              const style = (s.includes('spin') || s.includes('orthodox') || s.includes('legbreak') || s.includes('googly') || s.includes('offbreak') || s.includes('slow')) ? 'spin' : 'pace';
              styleMap[p.name] = style;
            });
          }

          deliveriesRes.rows.forEach(d => {
            const style = styleMap[d.bowler] || 'pace';
            if (style === 'spin') {
              spinRuns += d.runsTotal;
              spinBalls += 1;
              if (d.wicket) spinWickets += 1;
            } else {
              paceRuns += d.runsTotal;
              paceBalls += 1;
              if (d.wicket) paceWickets += 1;
            }
          });
        }
      }

      const paceAvg = paceBalls > 0 ? ((paceRuns / paceBalls) * 6).toFixed(1) : '7.2';
      const spinAvg = spinBalls > 0 ? ((spinRuns / spinBalls) * 6).toFixed(1) : '6.8';

      // Current bowler stats evaluation
      const currentEcon = parseFloat(oversBowled) > 0 ? (runsConceded / parseFloat(oversBowled)) : 0;
      const expectedEcon = bowlerStyle === 'spin' ? parseFloat(spinAvg) : parseFloat(paceAvg);
      const oppositeEcon = bowlerStyle === 'spin' ? parseFloat(paceAvg) : parseFloat(spinAvg);

      let action = 'continue';
      let recommendation = '';

      if (currentEcon > expectedEcon + 2.0 || currentEcon > (format === 'T20' ? 10.5 : 7.0)) {
        action = 'change';
        if (oppositeEcon < expectedEcon - 0.4) {
          action = bowlerStyle === 'spin' ? 'change_pace' : 'change_spin';
          recommendation = `Current bowler is expensive (Econ: ${currentEcon.toFixed(1)}). Pace bowlers have historically performed better in this situation (Econ: ${paceAvg} vs Spin: ${spinAvg}). We recommend bringing on a pace bowler.`;
        } else {
          recommendation = `Current bowler is expensive (Econ: ${currentEcon.toFixed(1)} vs style average ${expectedEcon.toFixed(1)}). We recommend making a change. Bring on a fresh bowler from the other end.`;
        }
      } else {
        action = 'continue';
        recommendation = `${matchedName} is bowling a disciplined spell (Econ: ${currentEcon.toFixed(1)} vs expected ${expectedEcon.toFixed(1)}). Historically, ${bowlerStyle === 'spin' ? 'Spin' : 'Pace'} works well in this match phase. Recommend continuing their spell.`;
      }

      return NextResponse.json({
        recommendation,
        bowlerName: matchedName,
        bowlerStyle,
        bowlerAvgRuns,
        bowlerWickets: bowlerWicketsCount,
        paceAvgRuns: paceAvg,
        spinAvgRuns: spinAvg,
        action,
        supportingDeliveryCount: totalScenarios * 6
      });
    }

    // ==========================================
    // 2. MODE: LIVE WIN PROBABILITY & RISK SCORING
    // ==========================================
    if (mode === 'win_prob') {
      const { target = 160 } = body;
      const runsNeeded = target - score;
      const ballsRemaining = (format === 'T20' ? 120 : 300) - (over * 6);
      const reqRR = ballsRemaining > 0 ? runsNeeded / (ballsRemaining / 6) : 0;

      let totalScenarios = 0;
      let wins = 0;

      if (format === 'T20') {
        // Query targets for all matches
        const firstInningScores = await pool.query(`
          SELECT "matchId", MAX(runs_at_ball) as first_inning_runs
          FROM delivery_features
          WHERE inning = 1
          GROUP BY "matchId"
        `);
        const targetMap: Record<string, number> = {};
        firstInningScores.rows.forEach(r => {
          targetMap[r.matchId] = parseInt(r.first_inning_runs) + 1;
        });

        // Query inning 2 at end of over
        const situationsRes = await pool.query(`
          SELECT DISTINCT ON (df."matchId") df."matchId", df.runs_at_ball, df.wickets_at_ball,
                 m."tossWinner", m."tossDecision", m.winner
          FROM delivery_features df
          JOIN "Match" m ON df."matchId" = m.id
          WHERE df.inning = 2 AND df.over = $1
          ORDER BY df."matchId", df.ball DESC
        `, [over]);

        situationsRes.rows.forEach(row => {
          const t = targetMap[row.matchId];
          if (!t) return;

          const h_score = parseInt(row.runs_at_ball);
          const h_wickets = parseInt(row.wickets_at_ball);
          const h_runsNeeded = t - h_score;
          const h_reqRR = ballsRemaining > 0 ? h_runsNeeded / (ballsRemaining / 6) : 0;

          // Wickets +/- 1, required RR +/- 2.5
          const wicketsMatch = h_wickets >= wickets - 1 && h_wickets <= wickets + 1;
          const rrMatch = ballsRemaining > 0 ? (h_reqRR >= reqRR - 2.5 && h_reqRR <= reqRR + 2.5) : true;

          if (wicketsMatch && rrMatch) {
            totalScenarios++;
            const tossWinner = row.tossWinner;
            const tossDecision = row.tossDecision;
            const winner = row.winner;

            let chaseWon = false;
            if (winner && tossWinner) {
              const isTossWinnerWinner = tossWinner === winner;
              if (isTossWinnerWinner && tossDecision === 'field') {
                chaseWon = true;
              } else if (!isTossWinnerWinner && tossDecision === 'bat') {
                chaseWon = true;
              }
            }
            if (chaseWon) wins++;
          }
        });
      } else {
        // ODI Chasing Win Probability
        const matchesRes = await pool.query(`
          SELECT id, "tossWinner", "tossDecision", winner
          FROM "Match"
          WHERE format = 'ODI'
          LIMIT 80
        `);
        const matchMap: Record<string, any> = {};
        const matchIds = matchesRes.rows.map(m => {
          matchMap[m.id] = m;
          return m.id;
        });

        if (matchIds.length > 0) {
          const deliverySums = await pool.query(`
            SELECT "matchId", inning, SUM("runsTotal")::int as runs,
                   SUM(CASE WHEN wicket IS NOT NULL THEN 1 ELSE 0 END)::int as wickets
            FROM "Delivery"
            WHERE "matchId" = ANY($1) AND over <= $2
            GROUP BY "matchId", inning
          `, [matchIds, over]);

          const matchInnings: Record<string, any> = {};
          deliverySums.rows.forEach(row => {
            if (!matchInnings[row.matchId]) matchInnings[row.matchId] = {};
            matchInnings[row.matchId][row.inning] = { runs: row.runs, wickets: row.wickets };
          });

          const firstInningTotals = await pool.query(`
            SELECT "matchId", SUM("runsTotal")::int as runs
            FROM "Delivery"
            WHERE "matchId" = ANY($1) AND inning = 1
            GROUP BY "matchId"
          `, [matchIds]);

          const targetMap: Record<string, number> = {};
          firstInningTotals.rows.forEach(r => {
            targetMap[r.matchId] = r.runs + 1;
          });

          Object.entries(matchInnings).forEach(([matchId, innings]) => {
            const t = targetMap[matchId];
            const inn2 = innings[2];
            const mInfo = matchMap[matchId];
            if (!t || !inn2 || !mInfo) return;

            const h_score = inn2.runs;
            const h_wickets = inn2.wickets;
            const h_runsNeeded = t - h_score;
            const h_reqRR = ballsRemaining > 0 ? h_runsNeeded / (ballsRemaining / 6) : 0;

            const wicketsMatch = h_wickets >= wickets - 1 && h_wickets <= wickets + 1;
            const rrMatch = ballsRemaining > 0 ? (h_reqRR >= reqRR - 2.0 && h_reqRR <= reqRR + 2.0) : true;

            if (wicketsMatch && rrMatch) {
              totalScenarios++;
              const tossWinner = mInfo.tossWinner;
              const tossDecision = mInfo.tossDecision;
              const winner = mInfo.winner;

              let chaseWon = false;
              if (winner && tossWinner) {
                const isTossWinnerWinner = tossWinner === winner;
                if (isTossWinnerWinner && tossDecision === 'field') {
                  chaseWon = true;
                } else if (!isTossWinnerWinner && tossDecision === 'bat') {
                  chaseWon = true;
                }
              }
              if (chaseWon) wins++;
            }
          });
        }
      }

      let winProb = totalScenarios > 0 ? Math.round((wins / totalScenarios) * 100) : 50;
      if (totalScenarios > 0) {
        winProb = Math.min(95, Math.max(5, winProb));
      }

      // Risk score: High, Medium, Low
      let risk = 'Low';
      let riskReason = '';

      if (reqRR > (format === 'T20' ? 12.0 : 8.0) || wickets > 7) {
        risk = 'High';
        riskReason = `Required run rate is extremely high (${reqRR.toFixed(2)}) or batting side has lost too many wickets (${wickets}). High risk situation.`;
      } else if (reqRR > (format === 'T20' ? 8.0 : 5.5) || wickets > 4) {
        risk = 'Medium';
        riskReason = `Chasing team needs a scoring rate of ${reqRR.toFixed(2)} runs/over with ${10 - wickets} wickets remaining. Balanced contest, moderate risk.`;
      } else {
        risk = 'Low';
        riskReason = `Chasing team is in a commanding position. Required run rate is comfortable (${reqRR.toFixed(2)}) with solid wickets in hand.`;
      }

      const recommendation = winProb > 65
        ? `chasing team is currently highly favored to win. Historical data shows teams succeed in ${winProb}% of similar chases. Focus on low-risk strokeplay and strike rotation.`
        : winProb < 35
        ? `defending team is in control. Historical success rate from this position is only ${winProb}%. Chasing team must take calculated boundary risks immediately.`
        : `Even contest. The win probability stands at ${winProb}%. The next 2-3 overs will be decisive for the match outcome.`;

      return NextResponse.json({
        recommendation,
        winProb1: 100 - winProb, // defending
        winProb2: winProb, // chasing
        risk,
        riskReason,
        supportingDeliveryCount: totalScenarios * 6,
        reqRR: reqRR.toFixed(2),
        runsNeeded
      });
    }

    // ==========================================
    // 3. MODE: STANDARD SITUATION ENGINE
    // ==========================================
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

          Object.entries(outcomes).forEach(([key, val]) => {
            if (val > maxCount) {
              maxCount = val;
              mostCommonOutcome = key;
            }
          });
        }
      }
    } else {
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
