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

async function getLocalVenueOpponent(player: string, format: string, limit: number) {
  const dbFormat = normalizeFormat(format);
  const battingSql = `
    SELECT
      COALESCE(m.venue, m.city, 'Unknown') as venue,
      CONCAT(COALESCE(m.team1, 'Team 1'), ' vs ', COALESCE(m.team2, 'Team 2')) as opponent,
      COUNT(DISTINCT m.id)::int as matches,
      SUM(match_runs.runs)::int as total_runs,
      AVG(match_runs.runs)::float as avg_runs,
      AVG(match_runs.sr)::float as avg_sr,
      MAX(match_runs.runs)::int as high_score,
      SUM(match_runs.balls)::int as total_balls,
      0::int as total_wickets,
      0::float as avg_wickets,
      0::float as avg_economy,
      0::int as best_figures
    FROM "Match" m
    JOIN (
      SELECT
        d2."matchId",
        SUM(d2."runsBatter")::int as runs,
        COUNT(*)::int as balls,
        CASE WHEN COUNT(*) > 0 THEN (SUM(d2."runsBatter") * 100.0 / COUNT(*))::float ELSE 0 END as sr
      FROM "Delivery" d2
      WHERE d2.batter = $1
      GROUP BY d2."matchId"
    ) match_runs ON match_runs."matchId" = m.id
    WHERE m.format = $2
    GROUP BY m.venue, m.city, m.team1, m.team2
    ORDER BY matches DESC, total_runs DESC
    LIMIT $3
  `;

  const bowlingSql = `
    SELECT
      COALESCE(m.venue, m.city, 'Unknown') as venue,
      CONCAT(COALESCE(m.team1, 'Team 1'), ' vs ', COALESCE(m.team2, 'Team 2')) as opponent,
      COUNT(DISTINCT m.id)::int as matches,
      0::int as total_runs,
      0::float as avg_runs,
      0::float as avg_sr,
      0::int as high_score,
      SUM(match_bowling.balls)::int as total_balls,
      SUM(match_bowling.wickets)::int as total_wickets,
      AVG(match_bowling.wickets)::float as avg_wickets,
      AVG(match_bowling.economy)::float as avg_economy,
      MAX(match_bowling.wickets)::int as best_figures
    FROM "Match" m
    JOIN (
      SELECT
        d2."matchId",
        SUM(CASE WHEN d2.wicket IS NOT NULL THEN 1 ELSE 0 END)::int as wickets,
        COUNT(*)::int as balls,
        SUM(d2."runsTotal")::int as runs_conceded,
        CASE WHEN COUNT(*) > 0 THEN (SUM(d2."runsTotal") * 6.0 / COUNT(*))::float ELSE 0 END as economy
      FROM "Delivery" d2
      WHERE d2.bowler = $1
      GROUP BY d2."matchId"
    ) match_bowling ON match_bowling."matchId" = m.id
    WHERE m.format = $2
    GROUP BY m.venue, m.city, m.team1, m.team2
    ORDER BY matches DESC, total_wickets DESC
    LIMIT $3
  `;

  const [battingResult, bowlingResult] = await Promise.all([
    pool.query(battingSql, [player, dbFormat, limit]),
    pool.query(bowlingSql, [player, dbFormat, limit]),
  ]);

  return {
    batting: battingResult.rows,
    bowling: bowlingResult.rows,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'IPL';
    let player = searchParams.get('player');
    const playerId = searchParams.get('player_id');
    const venue = searchParams.get('venue');
    const opponent = searchParams.get('opponent');
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

    // Build WHERE clause for venue/opponent filters
    const filters: string[] = ['player = @player'];
    const params: Record<string, any> = { player };

    if (venue) {
      filters.push('venue = @venue');
      params.venue = venue;
    }
    if (opponent) {
      filters.push('opponent = @opponent');
      params.opponent = opponent;
    }

    const whereClause = filters.join(' AND ');

    // Batting venue/opponent stats
    const battingSql = `
      SELECT 
        venue,
        opponent,
        COUNT(*) as matches,
        SUM(runs) as total_runs,
        AVG(runs) as avg_runs,
        AVG(sr) as avg_sr,
        MAX(runs) as high_score,
        SUM(balls_faced) as total_balls
      FROM ${battingTable}
      WHERE ${whereClause}
      GROUP BY venue, opponent
      ORDER BY matches DESC, total_runs DESC
      LIMIT ${limit}
    `;

    // Bowling venue/opponent stats
    const bowlingSql = `
      SELECT 
        venue,
        opponent,
        COUNT(*) as matches,
        SUM(wickets) as total_wickets,
        AVG(wickets) as avg_wickets,
        AVG(economy) as avg_economy,
        MAX(wickets) as best_figures,
        SUM(balls_bowled) as total_balls
      FROM ${bowlingTable}
      WHERE ${whereClause}
      GROUP BY venue, opponent
      ORDER BY matches DESC, total_wickets DESC
      LIMIT ${limit}
    `;

    const [battingRows, bowlingRows] = await Promise.all([
      queryBigQuery(battingSql, params),
      queryBigQuery(bowlingSql, params),
    ]);

    return NextResponse.json({
      player,
      format,
      filters: { venue, opponent },
      batting: battingRows,
      bowling: bowlingRows,
    });
  } catch (error: any) {
    console.error('Venue/Opponent error:', error);
    try {
      const { searchParams } = new URL(request.url);
      const format = searchParams.get('format') || 'IPL';
      let player = searchParams.get('player');
      const playerId = searchParams.get('player_id');
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

      const localData = await getLocalVenueOpponent(player, format, limit);
      return NextResponse.json({
        player,
        format,
        filters: { venue: null, opponent: null },
        ...localData,
        source: 'local-fallback',
      });
    } catch (fallbackError: any) {
      console.error('Venue/Opponent local fallback error:', fallbackError);
      return NextResponse.json({ error: fallbackError.message || error.message }, { status: 500 });
    }
  }
}
