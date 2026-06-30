import { NextResponse } from "next/server";

const CRICAPI_KEY = process.env.CRICAPI_KEY;

// Team color themes used as fallback when no logo available
const TEAM_COLORS: Record<string, string> = {
  "India": "bg-blue-600 text-white border-blue-400",
  "Pakistan": "bg-emerald-800 text-emerald-200 border-emerald-600",
  "Australia": "bg-yellow-500 text-black border-yellow-400",
  "England": "bg-sky-700 text-white border-sky-500",
  "South Africa": "bg-green-700 text-white border-green-500",
  "New Zealand": "bg-zinc-800 text-white border-zinc-600",
  "Sri Lanka": "bg-blue-700 text-yellow-400 border-yellow-500",
  "Bangladesh": "bg-green-600 text-red-400 border-green-500",
  "West Indies": "bg-yellow-600 text-black border-yellow-500",
  "Afghanistan": "bg-sky-800 text-white border-sky-600",
  "Zimbabwe": "bg-red-700 text-yellow-400 border-red-600",
  "Ireland": "bg-green-600 text-white border-green-500",
  "default": "bg-zinc-800 text-zinc-200 border-zinc-700",
};

function getTeamColor(name: string): string {
  for (const [key, value] of Object.entries(TEAM_COLORS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return value;
  }
  return TEAM_COLORS.default;
}

function makeShortName(name: string): string {
  if (!name) return "???";
  // Handle Women teams
  if (name.toLowerCase().includes("women")) {
    const base = name.replace(/ women/gi, "").trim();
    const words = base.trim().split(" ");
    const abbr = words.length === 1 ? base.slice(0, 3).toUpperCase() : words.map(w => w[0]).join("").toUpperCase();
    return abbr + "-W";
  }
  const words = name.trim().split(" ");
  if (words.length === 1) return name.slice(0, 3).toUpperCase();
  // Use first letters of each word
  return words.map(w => w[0]).join("").toUpperCase().slice(0, 3);
}

function buildWinProbability(scores: any[], teams: string[]): { winProb1: number; winProb2: number } {
  // Very simple heuristic: if 2nd inning is in play, estimate based on runs left vs balls left
  if (!scores || scores.length < 2) return { winProb1: 50, winProb2: 50 };
  const batting = scores[0];
  const chasing = scores[1];
  if (!chasing) return { winProb1: 50, winProb2: 50 };
  
  const target = batting.r + 1;
  const chasingRuns = chasing.r;
  const wicketsLeft = 10 - (chasing.w || 0);
  const progress = chasingRuns / target;
  
  let chasingProb = Math.min(95, Math.max(5, progress * 100 * (wicketsLeft / 10)));
  return { winProb1: Math.round(100 - chasingProb), winProb2: Math.round(chasingProb) };
}

export async function GET() {
  if (!CRICAPI_KEY) {
    return NextResponse.json({ source: "mock", matches: getMockData() });
  }

  try {
    // Fetch current matches (live + recent) from CricAPI
    const res = await fetch(
      `https://api.cricapi.com/v1/currentMatches?apikey=${CRICAPI_KEY}&offset=0`,
      { next: { revalidate: 20 } } // revalidate every 20 seconds
    );

    if (!res.ok) throw new Error(`CricAPI returned ${res.status}`);

    const json = await res.json();
    if (json.status !== "success" || !json.data) {
      throw new Error("CricAPI returned non-success status");
    }

    // Prioritize live matches, then most recent ones
    const live = json.data.filter((m: any) => m.matchStarted && !m.matchEnded);
    const recent = json.data.filter((m: any) => m.matchEnded);

    // Combine: live first, then fallback to most recent completed
    const pool = live.length > 0 ? live : recent.slice(0, 3);

    if (pool.length === 0) {
      return NextResponse.json({ source: "mock", matches: getMockData() });
    }

    const parsed = pool.slice(0, 3).map((m: any, idx: number) => {
      const t1Info = m.teamInfo?.[0];
      const t2Info = m.teamInfo?.[1];
      const t1Name = t1Info?.name || m.teams[0] || "Team 1";
      const t2Name = t2Info?.name || m.teams[1] || "Team 2";
      const t1Short = t1Info?.shortname || makeShortName(t1Name);
      const t2Short = t2Info?.shortname || makeShortName(t2Name);
      const t1Img = t1Info?.img || null;
      const t2Img = t2Info?.img || null;

      const score1 = m.score?.[0]
        ? `${m.score[0].r}/${m.score[0].w} (${m.score[0].o} Ov)`
        : "Yet to bat";
      const score2 = m.score?.[1]
        ? `${m.score[1].r}/${m.score[1].w} (${m.score[1].o} Ov)`
        : "Yet to bat";

      const { winProb1, winProb2 } = buildWinProbability(m.score || [], m.teams || []);

      const matchLabel = m.matchType?.toUpperCase() || "INT'L";
      const matchStatus = m.matchEnded
        ? `RESULT: ${m.status}`
        : m.matchStarted
          ? `LIVE • ${m.status}`
          : `Upcoming • ${m.status}`;

      return {
        id: idx + 1,
        matchId: m.id,
        teams: {
          t1: t1Short,
          t1Name,
          t1Logo: t1Img || getTeamColor(t1Name),
          t1IsImage: !!t1Img,
          t2: t2Short,
          t2Name,
          t2Logo: t2Img || getTeamColor(t2Name),
          t2IsImage: !!t2Img,
        },
        score1,
        score2,
        overs: m.score?.[1]?.o ? `${m.score[1].o} Ov` : m.score?.[0]?.o ? `${m.score[0].o} Ov` : "–",
        status: matchStatus,
        venue: m.venue || "International Cricket Venue",
        pitch: "Live match data powered by CricAPI. Pitch conditions updated in real-time.",
        winProb1,
        winProb2,
        matchType: matchLabel,
        isLive: m.matchStarted && !m.matchEnded,
        isEnded: !!m.matchEnded,
        liveBatsmen: [
          { name: "Live Data", runs: 0, balls: 0, fours: 0, sixes: 0, sr: 0 },
        ],
        liveBowler: { name: "Live Data", overs: "0.0", maidens: 0, runs: 0, wickets: 0, econ: 0.0 },
      };
    });

    return NextResponse.json({
      source: live.length > 0 ? "live" : "recent",
      liveCount: live.length,
      matches: parsed,
    });
  } catch (err: any) {
    console.error("CricAPI fetch error:", err.message);
    return NextResponse.json({ source: "mock", matches: getMockData() });
  }
}

function getMockData() {
  return [
    {
      id: 1,
      teams: {
        t1: "PAK", t1Name: "Pakistan", t1Logo: "bg-emerald-800 text-emerald-200 border-emerald-600", t1IsImage: false,
        t2: "IND", t2Name: "India", t2Logo: "bg-blue-600 text-white border-blue-400", t2IsImage: false,
      },
      score1: "168/7 (20 Ov)", score2: "148/3 (17.2 Ov)", overs: "17.2 Ov",
      status: "SIMULATED • India need 21 runs in 16 balls",
      venue: "Nassau County Cricket Stadium, New York",
      pitch: "Moderate grass cover. Good carry and bounce. Pacers getting seam movement.",
      winProb1: 32, winProb2: 68, matchType: "T20I", isLive: false, isEnded: false,
      liveBatsmen: [
        { name: "Virat Kohli", runs: 58, balls: 41, fours: 5, sixes: 2, sr: 141.5 },
        { name: "Rishabh Pant", runs: 24, balls: 15, fours: 2, sixes: 0, sr: 160.0 }
      ],
      liveBowler: { name: "Shaheen Afridi", overs: "3.2", maidens: 0, runs: 28, wickets: 2, econ: 8.4 }
    }
  ];
}
