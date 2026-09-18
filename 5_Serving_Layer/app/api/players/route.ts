import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPlayerImageApiUrl } from '@/lib/utils';

function cleanRole(role: string | null): string {
  if (!role) return 'Cricketer';
  const r = role.toLowerCase();
  if (r.includes('bat')) return 'BAT';
  if (r.includes('bowl')) return 'BOWL';
  if (r.includes('all') || r.includes('round')) return 'AR';
  if (r.includes('keep') || r.includes('wicket')) return 'WK';
  if (r === 'player') return 'AR'; // fallback junk value → treat as all-rounder
  return role.toUpperCase().slice(0, 4);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'ipl';

    const formatMap: Record<string, string> = {
      ipl: 'IPL',
      odi: 'ODI',
      t20: 'T20',
      test: 'TEST',
    };

    const dbFormat = formatMap[format.toLowerCase()] || 'IPL';

    let players = await prisma.$queryRaw<any[]>`
      SELECT DISTINCT p.id, p.name, p."fullName", p.country, p.role, p."espnId", p."imageUrl",
        COALESCE(cs.matches, 0) as matches,
        COALESCE(cs.runs, 0) as runs
      FROM "CareerStat" cs
      JOIN "Player" p ON p.id = cs."playerId"
      WHERE cs.format = ${dbFormat}
      ORDER BY matches DESC NULLS LAST, runs DESC NULLS LAST
      LIMIT 120
    `;

    if (players.length === 0 && dbFormat === 'IPL') {
      players = await prisma.$queryRaw<any[]>`
        SELECT DISTINCT p.id, p.name, p."fullName", p.country, p.role, p."espnId", p."imageUrl",
          COALESCE(cs.matches, 0) as matches,
          COALESCE(cs.runs, 0) as runs
        FROM "CareerStat" cs
        JOIN "Player" p ON p.id = cs."playerId"
        WHERE cs.format = 'T20'
        ORDER BY matches DESC NULLS LAST, runs DESC NULLS LAST
        LIMIT 120
      `;
    }

    const seen = new Set<string>();
    const uniquePlayers = players.filter((player) => {
      if (seen.has(player.id)) return false;
      seen.add(player.id);
      return true;
    });

    return NextResponse.json(uniquePlayers.map((player) => {
      // Clean display name: strip junk suffixes like "(Player)" or "(Batsman)"
      const rawName: string = player.fullName || player.name || '';
      const displayName = rawName
        .replace(/\s*\([^)]*\)\s*/g, '') // remove anything in parentheses
        .trim();

      // Clean country: strip junk like "INT" when we have a real country name
      const country: string = (player.country || '').trim();
      const displayCountry = country === 'INT' || country.length === 0 ? 'INT' : country;

      return {
        player_id: player.id,
        player_name: displayName || rawName,
        role: cleanRole(player.role),
        team: displayCountry,
        imageUrl: getPlayerImageApiUrl(player),
      };
    }));
  } catch (error: any) {
    console.error('Error fetching players:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
