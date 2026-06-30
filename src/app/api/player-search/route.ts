import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPlayerImageUrl, getDisplayName } from '@/lib/utils';

// Helper to normalize strings: lowercase, strip punctuation, strip extra spaces
function cleanString(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Jaro-Winkler distance for fuzzy matching
function getJaroWinkler(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  if (m === 0 && n === 0) return 100;
  if (m === 0 || n === 0) return 0;

  const matchWindow = Math.max(0, Math.floor(Math.max(m, n) / 2) - 1);
  const s1Matches = Array(m).fill(false);
  const s2Matches = Array(n).fill(false);

  let matches = 0;
  for (let i = 0; i < m; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(n - 1, i + matchWindow);
    for (let j = start; j <= end; j++) {
      if (!s2Matches[j] && s1[i] === s2[j]) {
        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }
  }

  if (matches === 0) return 0;

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < m; i++) {
    if (s1Matches[i]) {
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }
  }

  const jaro = (matches / m + matches / n + (matches - transpositions / 2) / matches) / 3;

  // Winkler prefix scale
  let prefix = 0;
  for (let i = 0; i < Math.min(4, m, n); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }

  const jaroWinkler = jaro + prefix * 0.1 * (1 - jaro);
  return jaroWinkler * 100;
}

// Token-based matching function
function getTokenSimilarity(query: string, name: string): number {
  const qWords = query.split(/\s+/).filter(Boolean);
  const nWords = name.split(/\s+/).filter(Boolean);

  if (qWords.length === 0 || nWords.length === 0) return 0;

  let totalScore = 0;
  for (const qw of qWords) {
    let maxWordScore = 0;
    for (const nw of nWords) {
      const score = getJaroWinkler(qw, nw);
      if (score > maxWordScore) maxWordScore = score;
    }
    totalScore += maxWordScore;
  }

  return totalScore / qWords.length;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    const query = cleanString(q);
    if (query.length < 2) {
      return NextResponse.json([]);
    }

    const words = query.split(' ');
    const surname = words[words.length - 1];

    // Fetch potential candidates from DB using SQL ILIKE and Trigram similarity to narrow it down quickly
    // Only query existing database columns for Player (no dob, bio, imageUrl)
    const candidates = await prisma.$queryRaw<any[]>`
      SELECT DISTINCT ON (id) id, name, "fullName", country, role, "espnId", "imageUrl" 
      FROM (
        SELECT id, name, "fullName", country, role, "espnId", "imageUrl", 1 as priority FROM "Player"
        WHERE "fullName" ILIKE '%' || ${surname} || '%'
        UNION
        SELECT id, name, "fullName", country, role, "espnId", "imageUrl", 2 as priority FROM "Player"
        WHERE name ILIKE '%' || ${surname} || '%'
        UNION
        SELECT id, name, "fullName", country, role, "espnId", "imageUrl", 3 as priority FROM "Player"
        WHERE similarity(name, ${q}) > 0.15 OR similarity(COALESCE("fullName",''), ${q}) > 0.15
      ) combined
      LIMIT 100
    `;

    // Process and score candidates in JS
    const scoredCandidates = candidates.map(p => {
      const cleanName = cleanString(p.name);
      const cleanFullName = cleanString(p.fullName || '');

      // 1. Check exact match
      const isExactName = cleanName === query || cleanFullName === query;

      // 2. Check last-name + first-initial match
      // Extract first initial of first name and last name for query
      const qInitial = words[0] ? words[0][0] : '';
      
      // For p.name
      const pNameWords = cleanName.split(' ');
      const pNameLastName = pNameWords[pNameWords.length - 1];
      const pNameInitial = pNameWords[0] ? pNameWords[0][0] : '';
      const isPNameInitialMatch = qInitial && pNameLastName === surname && pNameInitial === qInitial;

      // For p.fullName
      const pFullNameWords = cleanFullName.split(' ');
      const pFullNameLastName = pFullNameWords[pFullNameWords.length - 1];
      const pFullNameInitial = pFullNameWords[0] ? pFullNameWords[0][0] : '';
      const isPFullNameInitialMatch = qInitial && pFullNameLastName === surname && pFullNameInitial === qInitial;

      const isInitialMatch = isPNameInitialMatch || isPFullNameInitialMatch;

      // 3. Compute token-based Jaro-Winkler similarity score
      const simName = getTokenSimilarity(query, cleanName);
      const simFullName = getTokenSimilarity(query, cleanFullName);
      const similarityScore = Math.max(simName, simFullName);

      return {
        player: p,
        isExactName,
        isInitialMatch,
        similarityScore,
      };
    });

    // Filter by match criteria: either initial match, exact name match, or similarity > 80
    const matched = scoredCandidates.filter(c => c.isExactName || c.isInitialMatch || c.similarityScore > 80);

    // Fetch career stats for matched players to compute runs/wickets and sort by popularity
    const playerIds = matched.map(c => c.player.id);
    const stats = await prisma.careerStat.findMany({
      where: { playerId: { in: playerIds } }
    });

    const statsByPlayer: Record<string, { runs: number; wickets: number; topFormat: string; maxMatches: number }> = {};
    stats.forEach(s => {
      const pId = s.playerId;
      if (!statsByPlayer[pId]) {
        statsByPlayer[pId] = { runs: 0, wickets: 0, topFormat: '', maxMatches: -1 };
      }
      statsByPlayer[pId].runs += s.runs || 0;
      statsByPlayer[pId].wickets += s.wickets || 0;
      if ((s.matches || 0) > statsByPlayer[pId].maxMatches) {
        statsByPlayer[pId].maxMatches = s.matches || 0;
        statsByPlayer[pId].topFormat = s.format;
      }
    });

    // Sort matched candidates
    matched.sort((a, b) => {
      // 1. Exact match has top priority
      if (a.isExactName && !b.isExactName) return -1;
      if (!a.isExactName && b.isExactName) return 1;

      // 2. Initial match has second priority
      if (a.isInitialMatch && !b.isInitialMatch) return -1;
      if (!a.isInitialMatch && b.isInitialMatch) return 1;

      // 3. Compare similarity score
      if (Math.abs(a.similarityScore - b.similarityScore) > 5) {
        return b.similarityScore - a.similarityScore;
      }

      // 4. Compare runs (popularity)
      const aRuns = statsByPlayer[a.player.id]?.runs || 0;
      const bRuns = statsByPlayer[b.player.id]?.runs || 0;
      return bRuns - aRuns;
    });

    const results = matched.slice(0, 5).map(c => {
      const p = c.player;
      const pStats = statsByPlayer[p.id] || { runs: 0, wickets: 0, topFormat: '' };
      return {
        id: p.id,
        name: p.name,
        displayName: getDisplayName(p),
        country: p.country,
        role: p.role,
        espnId: p.espnId,
        imageUrl: getPlayerImageUrl(p.imageUrl),
        topFormat: pStats.topFormat,
        runs: pStats.runs,
        wickets: pStats.wickets,
      };
    });

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error in player-search API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
