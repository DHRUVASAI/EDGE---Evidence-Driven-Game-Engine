import { NextResponse } from 'next/server';
import { queryBigQuery, getTableName } from '@/lib/bigquery';
import { prisma } from '@/lib/prisma';

type XIPlayer = {
  player: string;
  role: string;
  form_score_100: number;
  is_captain: boolean;
  is_vice_captain: boolean;
  selection_order: number;
  rationale: string;
  team: string;
  opponent: string;
  venue: string;
  date: string;
};

const formatMap: Record<string, string> = {
  ipl: 'IPL',
  odi: 'ODI',
  t20: 'T20',
  test: 'TEST',
};

function roleBucket(role: string | null, wickets: number, runs: number, name?: string | null): 'BAT' | 'BOWL' | 'AR' | 'WK' {
  const normalized = (role || '').toLowerCase();
  const normalizedName = (name || '').toLowerCase();
  const keeperNames = ['buttler', 'dhoni', 'de kock', 'pooran', 'karthik', 'samson', 'rizwan', 'bairstow', 'healy', 'mooney'];

  if (keeperNames.some((keeperName) => normalizedName.includes(keeperName))) return 'WK';
  if (normalized.includes('wicket') || normalized.includes('keeper')) return 'WK';
  if (normalized.includes('all')) return 'AR';
  if (normalized.includes('bowl')) return 'BOWL';
  if (wickets >= 40 && runs >= 500) return 'AR';
  if (wickets > runs / 35) return 'BOWL';
  return 'BAT';
}

function pickBalancedXI(rows: Array<any>) {
  const picked: Array<any> = [];
  const pickedNames = new Set<string>();

  const add = (candidates: Array<any>, count: number) => {
    for (const row of candidates) {
      if (picked.length >= 11 || pickedNames.has(row.name)) continue;
      picked.push(row);
      pickedNames.add(row.name);
      if (picked.filter((player) => player.role === row.role).length >= count) break;
    }
  };

  add(rows.filter((row) => row.role === 'WK'), 1);
  add(rows.filter((row) => row.role === 'BAT'), 5);
  add(rows.filter((row) => row.role === 'AR'), 3);
  add(rows.filter((row) => row.role === 'BOWL'), 4);
  add(rows, 11);

  return picked.slice(0, 11);
}

function formatTeams(players: XIPlayer[]) {
  const roleCounts = { BAT: 0, BOWL: 0, AR: 0, WK: 0 };
  players.forEach((player) => {
    if (roleCounts[player.role as keyof typeof roleCounts] !== undefined) {
      roleCounts[player.role as keyof typeof roleCounts]++;
    }
  });

  return {
    'Local Form XI': {
      players,
      roleCounts,
      captain: players.find((p) => p.is_captain)?.player || null,
      viceCaptain: players.find((p) => p.is_vice_captain)?.player || null,
      totalPlayers: players.length,
    },
  };
}

async function getLocalXI(format: string): Promise<Record<string, any>> {
  const dbFormat = formatMap[format.toLowerCase()] || format.toUpperCase();
  let stats = await prisma.$queryRaw<any[]>`
    SELECT
      p.name,
      p."fullName",
      p.role,
      COALESCE(cs.runs, 0)::int as runs,
      COALESCE(cs.wickets, 0)::int as wickets,
      COALESCE(cs.matches, 0)::int as matches,
      COALESCE(cs.avg, 0)::float as avg,
      COALESCE(cs.sr, 0)::float as sr,
      COALESCE(cs."bowlEcon", 0)::float as "bowlEcon"
    FROM "CareerStat" cs
    JOIN "Player" p ON p.id = cs."playerId"
    WHERE cs.format = ${dbFormat}
    ORDER BY (COALESCE(cs.runs, 0) * 0.55 + COALESCE(cs.wickets, 0) * 22 + COALESCE(cs.matches, 0) * 1.5) DESC
    LIMIT 120
  `;

  if (stats.length === 0 && dbFormat === 'IPL') {
    stats = await prisma.$queryRaw<any[]>`
      SELECT
        p.name,
        p."fullName",
        p.role,
        COALESCE(cs.runs, 0)::int as runs,
        COALESCE(cs.wickets, 0)::int as wickets,
        COALESCE(cs.matches, 0)::int as matches,
        COALESCE(cs.avg, 0)::float as avg,
        COALESCE(cs.sr, 0)::float as sr,
        COALESCE(cs."bowlEcon", 0)::float as "bowlEcon"
      FROM "CareerStat" cs
      JOIN "Player" p ON p.id = cs."playerId"
      WHERE cs.format = 'T20'
      ORDER BY (COALESCE(cs.runs, 0) * 0.55 + COALESCE(cs.wickets, 0) * 22 + COALESCE(cs.matches, 0) * 1.5) DESC
      LIMIT 120
    `;
  }

  const sourceRows = stats
    .map((stat) => ({
      ...stat,
      role: roleBucket(stat.role, Number(stat.wickets || 0), Number(stat.runs || 0), stat.fullName || stat.name),
      score: (stat.runs || 0) * 0.55 + (stat.wickets || 0) * 22 + (stat.matches || 0) * 1.5,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 60);

  const players = pickBalancedXI(sourceRows).map((row, index) => {
    const role = row.role;
    const score = Math.min(100, Math.max(35, Number(row.runs || 0) / 60 + Number(row.wickets || 0) * 2.5 + Number(row.matches || 0) * 0.35));

    return {
      player: row.fullName || row.name,
      role,
      form_score_100: Number(score.toFixed(1)),
      is_captain: index === 0,
      is_vice_captain: index === 1,
      selection_order: index + 1,
      rationale: `Local ${dbFormat} record: ${row.runs || 0} runs, ${row.wickets || 0} wickets across ${row.matches || 0} matches.`,
      team: 'Local Form XI',
      opponent: 'Best available',
      venue: 'All venues',
      date: new Date().toISOString().slice(0, 10),
    };
  });

  return formatTeams(players);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'IPL';
    const team = searchParams.get('team');
    const opponent = searchParams.get('opponent');
    const venue = searchParams.get('venue');
    const date = searchParams.get('date'); // Optional: for upcoming match

    const scoreTable = getTableName('player_form_score', format);

    // Build WHERE clause
    const filters: string[] = [];
    const params: Record<string, any> = {};

    if (team) {
      filters.push('team = @team');
      params.team = team;
    }
    if (opponent) {
      filters.push('opponent = @opponent');
      params.opponent = opponent;
    }
    if (venue) {
      filters.push('venue = @venue');
      params.venue = venue;
    }
    if (date) {
      filters.push('date = @date');
      params.date = date;
    } else {
      // Default to latest match
      filters.push('date = (SELECT MAX(date) FROM ' + scoreTable + ')');
    }

    const whereClause = filters.length > 0 ? 'WHERE ' + filters.join(' AND ') : '';

    // Get XI recommendations
    const xiSql = `
      SELECT 
        player,
        role,
        form_score_100,
        is_captain,
        is_vice_captain,
        selection_order,
        rationale,
        team,
        opponent,
        venue,
        date
      FROM ${scoreTable}
      ${whereClause}
      ORDER BY selection_order
    `;

    const xiRows = await queryBigQuery(xiSql, params);

    // Group by team if multiple teams in result
    const byTeam: Record<string, any[]> = {};
    xiRows.forEach(row => {
      const t = row.team || 'Unknown';
      if (!byTeam[t]) byTeam[t] = [];
      byTeam[t].push(row);
    });

    // Format response with role counts
    const formattedTeams: Record<string, any> = {};
    Object.entries(byTeam).forEach(([teamName, players]) => {
      const roleCounts = { BAT: 0, BOWL: 0, AR: 0, WK: 0 };
      players.forEach(p => {
        if (roleCounts[p.role as keyof typeof roleCounts] !== undefined) {
          roleCounts[p.role as keyof typeof roleCounts]++;
        }
      });

      const captain = players.find(p => p.is_captain);
      const viceCaptain = players.find(p => p.is_vice_captain);

      formattedTeams[teamName] = {
        players,
        roleCounts,
        captain: captain?.player || null,
        viceCaptain: viceCaptain?.player || null,
        totalPlayers: players.length,
      };
    });

    return NextResponse.json({
      format,
      filters: { team, opponent, venue, date },
      teams: formattedTeams,
    });
  } catch (error: any) {
    console.error('XI recommendations error:', error);
    try {
      const { searchParams } = new URL(request.url);
      const format = searchParams.get('format') || 'IPL';
      const teams = await getLocalXI(format);

      return NextResponse.json({
        format,
        filters: { team: null, opponent: null, venue: null, date: null },
        teams,
        source: 'local-fallback',
      });
    } catch (fallbackError: any) {
      console.error('Local XI fallback error:', fallbackError);
      return NextResponse.json({ error: fallbackError.message || error.message }, { status: 500 });
    }
  }
}
