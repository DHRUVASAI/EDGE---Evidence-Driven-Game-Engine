import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CRICAPI_KEY = process.env.CRICAPI_KEY;
const CACHE_DIR = path.join(process.cwd(), "src", "data");
const CACHE_FILE = path.join(CACHE_DIR, "cached_matches.json");

function writeCache(data: any) {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Cache write error:", err);
  }
}

function readCache(): any | null {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const content = fs.readFileSync(CACHE_FILE, "utf8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Cache read error:", err);
  }
  return null;
}


// Known domestic league keywords to exclude
const DOMESTIC_KEYWORDS = [
  "IPL", "Maharaja Trophy", "TG20", "PSL", "Big Bash", "BBL",
  "CPL", "Vitality Blast", "Sheffield Shield", "Ranji", "Vijay Hazare",
  "Syed Mushtaq", "Duleep", "Deodhar", "NCA", "KSCA", "BCCI Domestic",
  "Super Smash", "Ram Slam", "Bangladesh Premier", "BPL", "Lanka Premier",
  "LPL", "Abu Dhabi T10", "T10 League", "The Hundred", "County Championship",
  "Royal London", "Vitality", "One-Day Cup", "Qualifier",
];

// ICC event keywords that are still international
const ICC_KEYWORDS = [
  "ICC", "World Cup", "Champions Trophy", "T20 World", "Asia Cup",
  "Tri-Series", "Bilateral", "ODI Series", "T20I Series", "Test Series",
  "tour of", "Tour of", "Afghanistan tour", "India tour", "Pakistan tour",
  "Australia tour", "England tour", "Sri Lanka tour", "Bangladesh tour",
  "New Zealand tour", "South Africa tour", "West Indies tour", "Zimbabwe tour"
];

function isInternational(matchName: string, teams: string[]): boolean {
  const name = matchName.toLowerCase();

  // Check ICC keywords first (these are definitely international)
  for (const kw of ICC_KEYWORDS) {
    if (name.includes(kw.toLowerCase())) return true;
  }

  // If it has a domestic keyword — exclude it
  for (const kw of DOMESTIC_KEYWORDS) {
    if (name.includes(kw.toLowerCase())) return false;
  }

  // If team names are known national teams — treat as international
  const nationalTeams = [
    "india", "pakistan", "australia", "england", "south africa",
    "new zealand", "sri lanka", "bangladesh", "west indies", "zimbabwe",
    "afghanistan", "ireland", "scotland", "netherlands", "uae", "oman",
    "namibia", "canada", "usa", "nepal", "kenya", "uganda",
    "bermuda", "brazil", "bahamas", "belize", "singapore", "thailand",
    "indonesia", "denmark", "switzerland", "serbia", "bulgaria",
  ];
  const teamNames = teams.join(" ").toLowerCase();
  const isNational = nationalTeams.some(t => teamNames.includes(t));
  return isNational;
}

function isWomens(name: string): boolean {
  return name.toLowerCase().includes("women");
}

function makeShortName(name: string): string {
  if (!name) return "???";
  if (name.toLowerCase().includes("women")) {
    const base = name.replace(/ women/gi, "").trim();
    const words = base.split(" ");
    const abbr = words.length === 1 ? base.slice(0, 3).toUpperCase() : words.map(w => w[0]).join("").toUpperCase().slice(0, 3);
    return abbr + "-W";
  }
  const words = name.trim().split(" ");
  if (words.length === 1) return name.slice(0, 3).toUpperCase();
  return words.map(w => w[0]).join("").toUpperCase().slice(0, 3);
}

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

function buildWinProbability(scores: any[]): { winProb1: number; winProb2: number } {
  if (!scores || scores.length < 2) return { winProb1: 50, winProb2: 50 };
  const batting = scores[0];
  const chasing = scores[1];
  if (!chasing) return { winProb1: 50, winProb2: 50 };
  const target = batting.r + 1;
  const chasingRuns = chasing.r;
  const wicketsLeft = 10 - (chasing.w || 0);
  const progress = chasingRuns / target;
  const chasingProb = Math.min(95, Math.max(5, progress * 100 * (wicketsLeft / 10)));
  return { winProb1: Math.round(100 - chasingProb), winProb2: Math.round(chasingProb) };
}

function parseMatch(m: any, idx: number): any {
  const t1Info = m.teamInfo?.[0];
  const t2Info = m.teamInfo?.[1];
  const t1Name = t1Info?.name || m.teams?.[0] || "Team 1";
  const t2Name = t2Info?.name || m.teams?.[1] || "Team 2";
  const t1Short = t1Info?.shortname || makeShortName(t1Name);
  const t2Short = t2Info?.shortname || makeShortName(t2Name);
  const t1Img = t1Info?.img && !t1Info.img.includes("icon512") ? t1Info.img : null;
  const t2Img = t2Info?.img && !t2Info.img.includes("icon512") ? t2Info.img : null;

  const score1 = m.score?.[0] ? `${m.score[0].r}/${m.score[0].w} (${m.score[0].o} Ov)` : "Yet to bat";
  const score2 = m.score?.[1] ? `${m.score[1].r}/${m.score[1].w} (${m.score[1].o} Ov)` : "Yet to bat";
  const { winProb1, winProb2 } = buildWinProbability(m.score || []);

  const isLive = m.matchStarted && !m.matchEnded;
  const isEnded = !!m.matchEnded;
  const isUpcoming = !m.matchStarted && !m.matchEnded;

  const matchLabel = (m.matchType || "INT'L").toUpperCase();

  let statusText = m.status || "";
  if (isLive) statusText = `LIVE • ${statusText}`;
  else if (isEnded) statusText = `RESULT: ${statusText}`;
  else if (isUpcoming) statusText = `UPCOMING • ${statusText}`;

  const gender = isWomens(m.name) ? "women" : "men";

  // Match date formatted nicely
  let dateStr = "";
  if (m.dateTimeGMT) {
    const d = new Date(m.dateTimeGMT);
    dateStr = d.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
    }) + " IST";
  }

  return {
    id: idx,
    matchId: m.id,
    name: m.name,
    gender,
    isLive,
    isEnded,
    isUpcoming,
    matchType: matchLabel,
    dateStr,
    teams: {
      t1: t1Short, t1Name, t1Logo: t1Img || getTeamColor(t1Name), t1IsImage: !!t1Img,
      t2: t2Short, t2Name, t2Logo: t2Img || getTeamColor(t2Name), t2IsImage: !!t2Img,
    },
    score1,
    score2,
    overs: m.score?.[1]?.o ? `${m.score[1].o} Ov` : m.score?.[0]?.o ? `${m.score[0].o} Ov` : "–",
    status: statusText,
    venue: m.venue || "International Cricket Venue",
    pitch: isLive
      ? "Live match data powered by CricAPI. Conditions updating in real-time."
      : isUpcoming
        ? "Match has not yet started. Pitch report to be confirmed closer to match day."
        : "Match completed. Final scorecard available.",
    winProb1,
    winProb2,
    liveBatsmen: [{ name: "–", runs: 0, balls: 0, fours: 0, sixes: 0, sr: 0 }],
    liveBowler: { name: "–", overs: "0.0", maidens: 0, runs: 0, wickets: 0, econ: 0.0 },
  };
}

export async function GET() {
  if (!CRICAPI_KEY) {
    return NextResponse.json({ source: "mock", matches: getMockData() });
  }

  try {
    // Fetch both current (includes recent+live) and upcoming
    const [resCurrent, resMatches] = await Promise.all([
      fetch(`https://api.cricapi.com/v1/currentMatches?apikey=${CRICAPI_KEY}&offset=0`, { next: { revalidate: 20 } }),
      fetch(`https://api.cricapi.com/v1/matches?apikey=${CRICAPI_KEY}&offset=0`, { next: { revalidate: 60 } }),
    ]);

    const [dataCurrent, dataMatches] = await Promise.all([
      resCurrent.ok ? resCurrent.json() : Promise.resolve({ data: [], status: "failure" }),
      resMatches.ok ? resMatches.json() : Promise.resolve({ data: [], status: "failure" }),
    ]);

    if (dataCurrent.status === "failure" || dataMatches.status === "failure") {
      throw new Error(dataCurrent.reason || dataMatches.reason || "CricAPI request limit or access error");
    }

    const allCurrent: any[] = dataCurrent.data || [];
    const allMatches: any[] = dataMatches.data || [];

    // Filter to international only
    const intlCurrent = allCurrent.filter(m => isInternational(m.name || "", m.teams || []));
    const intlUpcoming = allMatches.filter(m => !m.matchStarted && isInternational(m.name || "", m.teams || []));

    // Separate live, recent, upcoming by gender
    const liveMen = intlCurrent.filter(m => m.matchStarted && !m.matchEnded && !isWomens(m.name));
    const liveWomen = intlCurrent.filter(m => m.matchStarted && !m.matchEnded && isWomens(m.name));
    const recentMen = intlCurrent.filter(m => m.matchEnded && !isWomens(m.name));
    const recentWomen = intlCurrent.filter(m => m.matchEnded && isWomens(m.name));

    // Sort upcoming by date ascending (closest first)
    intlUpcoming.sort((a, b) => new Date(a.dateTimeGMT).getTime() - new Date(b.dateTimeGMT).getTime());
    const upcomingMen = intlUpcoming.filter(m => !isWomens(m.name));
    const upcomingWomen = intlUpcoming.filter(m => isWomens(m.name));

    // Build the final match list: live first, then recent, then upcoming — 1 men + 1 women
    const selectedMatches: any[] = [];

    if (liveMen.length > 0) selectedMatches.push(liveMen[0]);
    else if (recentMen.length > 0) selectedMatches.push(recentMen[0]);

    if (liveWomen.length > 0) selectedMatches.push(liveWomen[0]);
    else if (recentWomen.length > 0) selectedMatches.push(recentWomen[0]);

    // Always add upcoming if we have it
    const upMen = upcomingMen[0];
    const upWomen = upcomingWomen[0];
    if (upMen) selectedMatches.push(upMen);
    if (upWomen) selectedMatches.push(upWomen);

    // Deduplicate by match ID
    const seen = new Set<string>();
    const deduped = selectedMatches.filter(m => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });

    if (deduped.length === 0) {
      const cached = readCache();
      if (cached) {
        cached.source = "cached";
        return NextResponse.json(cached);
      }
      return NextResponse.json({ source: "mock", matches: getMockData() });
    }

    const parsed = deduped.slice(0, 4).map((m, idx) => parseMatch(m, idx + 1));
    const anyLive = parsed.some(m => m.isLive);

    const resultObj = {
      source: anyLive ? "live" : "real",
      liveCount: liveMen.length + liveWomen.length,
      matches: parsed,
    };

    // Save to cache
    writeCache(resultObj);

    return NextResponse.json(resultObj);
  } catch (err: any) {
    console.error("CricAPI fetch error, falling back to Groq:", err.message);
    
    // Attempt Groq LLM-powered live match simulation fallback using Llama 3
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (GROQ_API_KEY) {
      try {
        const currentDate = new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
        const prompt = `Generate a realistic JSON response for simulated live/recent international cricket matches happening today (${currentDate}). Include 4 matches: 2 completed (1 men, 1 women) and 2 upcoming (1 men, 1 women). 

        Follow this exact JSON structure:
        {
          "source": "live",
          "liveCount": 1,
          "matches": [
            {
              "id": 1,
              "name": "India vs South Africa - 1st T20I",
              "gender": "men",
              "isLive": false,
              "isEnded": true,
              "isUpcoming": false,
              "matchType": "T20I",
              "dateStr": "Completed",
              "teams": {
                "t1": "RSA",
                "t1Name": "South Africa",
                "t1Logo": "bg-green-700 text-white border-green-500",
                "t1IsImage": false,
                "t2": "IND",
                "t2Name": "India",
                "t2Logo": "bg-blue-600 text-white border-blue-400",
                "t2IsImage": false
              },
              "score1": "172/6 (20 Ov)",
              "score2": "175/4 (18.4 Ov)",
              "overs": "18.4 Ov",
              "status": "RESULT: India won by 6 wickets",
              "venue": "Kingsmead, Durban",
              "pitch": "Match completed. Final scorecard available.",
              "winProb1": 0,
              "winProb2": 100,
              "liveBatsmen": [
                { "name": "Suryakumar Yadav", "runs": 56, "balls": 34, "fours": 5, "sixes": 3, "sr": 164.7 },
                { "name": "Hardik Pandya", "runs": 31, "balls": 18, "fours": 2, "sixes": 1, "sr": 172.2 }
              ],
              "liveBowler": { "name": "Gerald Coetzee", "overs": "4.0", "maidens": 0, "runs": 32, "wickets": 1, "econ": 8.0 }
            }
          ]
        }

        Make the matchups and players realistic according to active teams and player rosters. One of the matches must be currently LIVE (isLive: true, isEnded: false) with active batsmen and bowlers. Respond ONLY with the valid JSON, no explanations, no markdown formatting.`;

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-specdec",
            max_tokens: 1500,
            temperature: 0.5,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          let jsonText = data?.choices?.[0]?.message?.content?.trim() || "";
          // Strip potential markdown JSON wraps
          if (jsonText.startsWith("```json")) {
            jsonText = jsonText.replace(/^```json/, "").replace(/```$/, "").trim();
          } else if (jsonText.startsWith("```")) {
            jsonText = jsonText.replace(/^```/, "").replace(/```$/, "").trim();
          }
          const parsedGroq = JSON.parse(jsonText);
          parsedGroq.source = "CricAPI (Groq-Simulated)";
          // Cache the Groq-simulated matches so we have stable results
          writeCache(parsedGroq);
          return NextResponse.json(parsedGroq);
        }
      } catch (groqErr: any) {
        console.error("Groq fallback error:", groqErr.message);
      }
    }

    const cached = readCache();
    if (cached) {
      cached.source = "CricAPI (Cached)";
      return NextResponse.json(cached);
    }
    return NextResponse.json({ source: "mock", matches: getMockData() });
  }
}

function getMockData() {
  return [
    {
      id: 1, gender: "men", isLive: false, isEnded: false, isUpcoming: false,
      matchType: "T20I", dateStr: "Upcoming",
      teams: {
        t1: "IND", t1Name: "India", t1Logo: "bg-blue-600 text-white border-blue-400", t1IsImage: false,
        t2: "PAK", t2Name: "Pakistan", t2Logo: "bg-emerald-800 text-emerald-200 border-emerald-600", t2IsImage: false,
      },
      score1: "168/7 (20 Ov)", score2: "148/3 (17.2 Ov)", overs: "17.2 Ov",
      status: "SIMULATED • India need 21 runs in 16 balls",
      venue: "Nassau County Cricket Stadium, New York",
      pitch: "Moderate grass cover. Good carry and bounce.",
      winProb1: 32, winProb2: 68,
      liveBatsmen: [
        { name: "Virat Kohli", runs: 58, balls: 41, fours: 5, sixes: 2, sr: 141.5 },
        { name: "Rishabh Pant", runs: 24, balls: 15, fours: 2, sixes: 0, sr: 160.0 }
      ],
      liveBowler: { name: "Shaheen Afridi", overs: "3.2", maidens: 0, runs: 28, wickets: 2, econ: 8.4 }
    }
  ];
}
