import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPlayerImageUrl, getDisplayName } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q) {
      return NextResponse.json({ error: 'Query parameter "q" is required', status: 400 }, { status: 400 });
    }

    const trimmedQ = q.trim();
    const initial = trimmedQ[0];
    const words = trimmedQ.split(' ');
    const surname = words.length > 1 ? words[words.length - 1] : trimmedQ;

    let players = await prisma.$queryRaw<any[]>`
      SELECT DISTINCT ON (id) * FROM (
        SELECT *, 1 as priority FROM "Player" 
        WHERE "fullName" ILIKE '%' || ${trimmedQ} || '%'
        UNION
        SELECT *, 2 as priority FROM "Player"
        WHERE name ILIKE '%' || ${surname} || '%'
        UNION  
        SELECT *, 3 as priority FROM "Player"
        WHERE name ILIKE ${initial} || '%' || ${surname} || '%'
      ) combined
      ORDER BY id, priority
      LIMIT 10
    `;

    if (players.length === 0) {
      players = await prisma.$queryRaw<any[]>`
        SELECT *, similarity(name, ${trimmedQ}) as sim FROM "Player"
        WHERE similarity(name, ${trimmedQ}) > 0.2 
           OR similarity(COALESCE("fullName",''), ${trimmedQ}) > 0.3
        ORDER BY GREATEST(similarity(name, ${trimmedQ}), similarity(COALESCE("fullName",''), ${trimmedQ})) DESC
        LIMIT 10
      `;
    }

    const playerIds = players.map(p => p.id);
    const careerStats = await prisma.careerStat.findMany({
      where: { playerId: { in: playerIds } }
    });

    const statsByPlayer: Record<string, any[]> = {};
    careerStats.forEach(stat => {
      if (!statsByPlayer[stat.playerId]) statsByPlayer[stat.playerId] = [];
      statsByPlayer[stat.playerId].push(stat);
    });

    const results = players.map(player => {
      const pStats = statsByPlayer[player.id] || [];
      let topFormat = '';
      let maxMatches = -1;
      let totalRuns = 0;
      let totalWickets = 0;

      pStats.forEach(stat => {
        const matches = stat.matches || 0;
        if (matches > maxMatches) {
          maxMatches = matches;
          topFormat = stat.format;
        }
        totalRuns += stat.runs || 0;
        totalWickets += stat.wickets || 0;
      });

      return {
        id: player.id,
        name: player.name,
        displayName: getDisplayName(player),
        country: player.country,
        role: player.role,
        espnId: player.espnId,
        imageUrl: getPlayerImageUrl(player.espnId),
        topFormat,
        runs: totalRuns,
        wickets: totalWickets,
      };
    });

    results.sort((a, b) => {
      const aPriority = players.find(p => p.id === a.id)?.priority || 99;
      const bPriority = players.find(p => p.id === b.id)?.priority || 99;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return b.runs - a.runs;
    });

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error in search API:', error);
    return NextResponse.json({ error: 'Internal Server Error', status: 500 }, { status: 500 });
  }
}
