import fs from "fs";
import path from "path";
import os from "os";

const CRICKETDATA_KEY = process.env.CRICKETDATA_API_KEY || process.env.CRICAPI_KEY;
const CACHE_DIR = os.tmpdir();
const CACHE_FILE = path.join(CACHE_DIR, "edge_cached_matches.json");

// In-memory cache to prevent burning CricAPI 100 hit/day quota
let inMemoryCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes: two provider endpoints stay near a 100-hit/day allowance

function writeCache(data: any) {
  try {
    inMemoryCache = { data, timestamp: Date.now() };
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Cache write error:", err);
  }
}

function readCache(): any | null {
  if (inMemoryCache && (Date.now() - inMemoryCache.timestamp < CACHE_TTL_MS)) {
    return inMemoryCache.data;
  }
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const stat = fs.statSync(CACHE_FILE);
      if (Date.now() - stat.mtimeMs < CACHE_TTL_MS) {
        const content = fs.readFileSync(CACHE_FILE, "utf8");
        const parsed = JSON.parse(content);
        inMemoryCache = { data: parsed, timestamp: stat.mtimeMs };
        return parsed;
      }
    }
  } catch (err) {
    console.error("Cache read error:", err);
  }
  return null;
}

// Known domestic league keywords to exclude from international feed
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
  "New Zealand tour", "South Africa tour", "West Indies tour", "Zimbabwe tour",
  "Unofficial Test"
];

const MARQUEE_TEAMS = [
  "india", "australia", "england", "pakistan", "south africa",
  "new zealand", "west indies", "sri lanka", "afghanistan", "bangladesh"
];

export type MatchWindowState = "live" | "upcoming" | "completed" | "stale";

function parseProviderTimestamp(value: string | Date, treatNaiveAsUTC = false): Date | null {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : null;
  if (typeof value !== "string" || !value.trim()) return null;

  // CricAPI dateTimeGMT values may omit the trailing Z. Interpret them as UTC.
  const normalized = treatNaiveAsUTC &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(value)
    ? `${value}Z`
    : value;
  const date = new Date(normalized);
  return Number.isFinite(date.getTime()) ? date : null;
}

function getISTDateKey(value: string | Date, treatNaiveAsUTC = false): string | null {
  const date = parseProviderTimestamp(value, treatNaiveAsUTC);
  if (!date) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getISTDateOffset(offsetDays: number): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value);
  const utcNoon = new Date(Date.UTC(get("year"), get("month") - 1, get("day") + offsetDays, 12));
  return utcNoon.toISOString().slice(0, 10);
}

export function getTodayIST(): string { return getISTDateOffset(0); }
export function getYesterdayIST(): string { return getISTDateOffset(-1); }
export function getTomorrowIST(): string { return getISTDateOffset(1); }

function getISTDateOffset(offsetDays: number): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value);
  // Start from the current IST calendar day at UTC noon to avoid local-time/DST drift.
  const utcNoon = new Date(Date.UTC(get("year"), get("month") - 1, get("day") + offsetDays, 12));
  return utcNoon.toISOString().slice(0, 10);
}

export function isMatchInThreeDayWindow(m: any): boolean {
  const state = classifyMatchWindow(m);
  if (state === "live" && m.matchEnded !== true && m.isEnded !== true) return true;

  const rawTimestamp = m.dateTimeGMT || m.startTime || m.date;
  if (!rawTimestamp) return false;
  const matchDate = getISTDateKey(rawTimestamp, Boolean(m.dateTimeGMT));
  if (!matchDate) return false;

  return new Set([getISTDateOffset(-1), getISTDateOffset(0), getISTDateOffset(1)]).has(matchDate);
}

export function hasContradictoryMatchState(m: any): boolean {
  const status = String(m.status || "").toLowerCase();
  const explicitlyEnded = m.matchEnded === true || m.isEnded === true;
  const completedByStatus =
    /\b(won by|lost by|drawn|tied|no result|abandoned|cancelled|match complete|match completed)\b|result:/i.test(status);
  const liveByStatus =
    /\b(in progress|live|innings break|tea break|lunch break|stumps|need \d+ runs?|trail by|lead by|day \d+|session)\b/i.test(status);
  return explicitlyEnded && liveByStatus && !completedByStatus;
}

export function classifyMatchWindow(m: any): MatchWindowState {
  const status = String(m.status || "").toLowerCase();
  const explicitlyEnded = m.matchEnded === true || m.isEnded === true;
  const explicitlyStarted = m.matchStarted === true || m.isLive === true;

  const completedByStatus =
    /\b(won by|lost by|drawn|tied|no result|abandoned|cancelled|match complete|match completed)\b|result:/i.test(status);
  const liveByStatus =
    /\b(in progress|live|innings break|tea break|lunch break|stumps|need \d+ runs?|trail by|lead by|day \d+|session)\b/i.test(status);

  if (hasContradictoryMatchState(m)) return "stale";
  if (explicitlyEnded || completedByStatus) return "completed";
  if (explicitlyStarted || liveByStatus) return "live";

  const rawTimestamp = m.dateTimeGMT || m.startTime || m.date;
  const parsedStart = rawTimestamp
    ? parseProviderTimestamp(rawTimestamp, Boolean(m.dateTimeGMT))
    : null;
  if (parsedStart && parsedStart.getTime() > Date.now()) return "upcoming";
  if (!parsedStart && (m.isUpcoming === true || /\b(upcoming|scheduled|starts at|toss at)\b/i.test(status))) {
    return "upcoming";
  }
  return "stale";
}
function isInternational(matchName: string, teams: string[]): boolean {
  const name = matchName.toLowerCase();
  for (const kw of ICC_KEYWORDS) {
    if (name.includes(kw.toLowerCase())) return true;
  }
  for (const kw of DOMESTIC_KEYWORDS) {
    if (name.includes(kw.toLowerCase())) return false;
  }
  const nationalTeams = [
    "india", "pakistan", "australia", "england", "south africa",
    "new zealand", "sri lanka", "bangladesh", "west indies", "zimbabwe",
    "afghanistan", "ireland", "scotland", "netherlands", "uae", "oman",
    "namibia", "canada", "usa", "nepal", "kenya", "uganda",
    "bermuda", "brazil", "bahamas", "belize", "singapore", "thailand",
    "indonesia", "denmark", "switzerland", "serbia", "bulgaria",
  ];
  const teamNames = teams.join(" ").toLowerCase();
  return nationalTeams.some(t => teamNames.includes(t));
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

export function extractMatchSubtitle(matchName: string, matchType?: string): string {
  if (!matchName) return matchType || "Match";
  const parts = matchName.split(",").map(p => p.trim());
  if (parts.length >= 2) {
    const candidate = parts[1];
    if (/\b(\d+(st|nd|rd|th)\s+(T20I|ODI|Test|Match)|Final|Semi-Final|Qualifier|Playoff)\b/i.test(candidate)) {
      return candidate.replace(/Unofficial\s+/i, "");
    }
    if (candidate.length <= 24) {
      return candidate;
    }
  }
  return matchType || "Match";
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

function buildWinProbability(
  scores: any[],
  statusText: string = "",
  isEnded: boolean = false,
  t1Name: string = "",
  t2Name: string = "",
  t1Short: string = "",
  t2Short: string = ""
): { winProb1: number; winProb2: number } {
  const statusLower = (statusText || "").toLowerCase();

  // If match has concluded with an explicit winner:
  if (isEnded || statusLower.includes("won by") || statusLower.includes("won the")) {
    const t1N = t1Name.toLowerCase();
    const t2N = t2Name.toLowerCase();
    const t1S = t1Short.toLowerCase();
    const t2S = t2Short.toLowerCase();

    // Check if Team 1 won
    if (statusLower.includes(t1N) || (t1S.length > 1 && statusLower.includes(t1S))) {
      return { winProb1: 100, winProb2: 0 };
    }
    // Check if Team 2 won
    if (statusLower.includes(t2N) || (t2S.length > 1 && statusLower.includes(t2S))) {
      return { winProb1: 0, winProb2: 100 };
    }
    // Tied or No result
    if (statusLower.includes("tied") || statusLower.includes("no result") || statusLower.includes("drawn")) {
      return { winProb1: 50, winProb2: 50 };
    }
  }

  // Session-only summaries do not contain enough state to estimate a live chase.
  // Test-specific missing innings is handled in parseMatch below.
  if (statusLower.includes("session")) {
    return { winProb1: 50, winProb2: 50 };
  }

  if (!scores || scores.length < 2) return { winProb1: 50, winProb2: 50 };
  const batting = scores[0];
  const chasing = scores[1];
  if (!chasing || typeof chasing.r !== "number" || typeof batting.r !== "number") {
    return { winProb1: 50, winProb2: 50 };
  }
  const target = batting.r + 1;
  const chasingRuns = chasing.r;
  const wicketsLeft = 10 - (chasing.w || 0);
  const progress = chasingRuns / target;
  const chasingProb = Math.min(95, Math.max(5, progress * 100 * (wicketsLeft / 10)));
  return { winProb1: Math.round(100 - chasingProb), winProb2: Math.round(chasingProb) };
}

function getMatchPriorityScore(m: any): number {
  let score = 0;
  // 1. Live matches have highest priority
  if (m.isLive || m.windowState === "live") {
    score += 10000;
  }
  // 2. Upcoming matches
  if (m.isUpcoming || m.windowState === "upcoming") {
    score += 3000;
  }
  // 3. Marquee teams
  const nameLower = (m.name || "").toLowerCase();
  for (const team of MARQUEE_TEAMS) {
    if (nameLower.includes(team)) {
      score += 4000;
      break;
    }
  }
  // 4. Tournament Finals
  if (nameLower.includes("final")) {
    score += 1500;
  }
  return score;
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

  let statusText = m.status || "";
  const windowState = classifyMatchWindow(m);
  const isLive = windowState === "live";
  const isEnded = windowState === "completed";
  const isUpcoming = windowState === "upcoming";

  if (windowState === "stale") {
    statusText = "STATUS UNVERIFIED • Provider fields conflict or match state is ambiguous";
  }

  if (isLive && !statusText.toLowerCase().includes("live")) {
    statusText = `LIVE • ${statusText}`;
  } else if (isEnded && !statusText.toLowerCase().includes("result")) {
    statusText = `RESULT: ${statusText}`;
  } else if (isUpcoming && !statusText.toLowerCase().includes("upcoming")) {
    statusText = `UPCOMING • ${statusText}`;
  }

  const matchLabel = (m.matchType || "INT'L").toUpperCase();
  const statusLowerForProbability = statusText.toLowerCase();
  const missingTestChaseData =
    matchLabel === "TEST" &&
    /session|need \d+ runs?|day \d+/i.test(statusLowerForProbability) &&
    (!Array.isArray(m.score) || m.score.length < 3);
  const probability = buildWinProbability(m.score || [], statusText, isEnded, t1Name, t2Name, t1Short, t2Short);
  const winProb1 = missingTestChaseData ? 50 : probability.winProb1;
  const winProb2 = missingTestChaseData ? 50 : probability.winProb2;
  const winProbLabel = missingTestChaseData
    ? "Unavailable — provider summary lacks current innings data"
    : "EDGE heuristic estimate (not an official provider metric)";
  const subtitle = extractMatchSubtitle(m.name, matchLabel);
  const gender = isWomens(m.name) ? "women" : "men";

  let dateStr = "";
  if (m.dateTimeGMT) {
    const d = parseProviderTimestamp(m.dateTimeGMT, true) || new Date(m.dateTimeGMT);
    dateStr = d.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
    }) + " IST";
  }

  const hasLiveCrease = Array.isArray(m.liveBatsmen) && m.liveBatsmen.length > 0 && m.liveBatsmen[0]?.name && m.liveBatsmen[0]?.name !== "–";

  const rawMatch = {
    id: idx,
    matchId: m.id || m.matchId,
    name: m.name,
    subtitle,
    gender,
    isLive,
    isEnded,
    isUpcoming,
    windowState,
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
      ? "Match in progress. Pitch conditions are not included in the current summary feed."
      : isUpcoming
        ? "Scheduled fixture. Playing XIs and pitch details require provider confirmation."
        : "Match concluded. Use the linked scorecard for detailed statistical records.",
    winProb1,
    winProb2,
    winProbLabel,
    hasLiveCreaseData: hasLiveCrease,
    liveBatsmen: hasLiveCrease ? m.liveBatsmen : [],
    liveBowler: hasLiveCrease ? m.liveBowler : null,
    scorecardNotice: isLive && !hasLiveCrease
      ? "Summary feed active. Individual ball-by-ball crease scorecard pending provider sync."
      : undefined,
  };

  return rawMatch;
}

export function formatToIST(isoOrUtcString: string): string {
  try {
    const d = new Date(isoOrUtcString);
    return d.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }) + " IST";
  } catch {
    return isoOrUtcString;
  }
}

export async function fetchLiveMatchesInternal(): Promise<any> {
  // 0. Serve the last provider snapshot while its 30-minute cache is fresh.
  const cached = readCache();
  if (cached && Array.isArray(cached.matches)) {
    return cached;
  }

  const nowIST = formatToIST(new Date().toISOString());

  // 1. Check CricAPI if key has remaining quota
  // Keep credentials in server environment variables only. Rotate keys previously
  // committed to source control before deployment.
  const CRICAPI_KEYS = [
    CRICKETDATA_KEY,
    process.env.CRICKETDATA_API_KEY_2,
    process.env.CRICKETDATA_API_KEY_3,
  ].filter((value): value is string => Boolean(value && value.trim()));

  for (const key of CRICAPI_KEYS) {
    try {
      const [resCurrent, resMatches] = await Promise.all([
        fetch(`https://api.cricapi.com/v1/currentMatches?apikey=${key}&offset=0`, { next: { revalidate: 1800 } }),
        fetch(`https://api.cricapi.com/v1/matches?apikey=${key}&offset=0`, { next: { revalidate: 1800 } }),
      ]);

      const [dataCurrent, dataMatches] = await Promise.all([
        resCurrent.ok ? resCurrent.json() : Promise.resolve({ data: [], status: "failure" }),
        resMatches.ok ? resMatches.json() : Promise.resolve({ data: [], status: "failure" }),
      ]);

      if (dataCurrent.status !== "failure" || dataMatches.status !== "failure") {
        const allRaw = [...(dataCurrent.data || []), ...(dataMatches.data || [])];
        const seen = new Set<string>();
        const deduped = allRaw.filter(m => {
          if (!m.id || seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });

        const internationalMatches = deduped
          .filter(m => isInternational(m.name || "", m.teams || []));
        const dataQualityWarnings = internationalMatches
          .filter(hasContradictoryMatchState)
          .map(m => ({
            matchId: m.id || m.matchId || null,
            name: m.name || "Unknown fixture",
            reason: "Provider marks match ended while status text indicates active play",
            providerStatus: m.status || null,
          }));
        const validMatches = internationalMatches
          .filter(m => isMatchInThreeDayWindow(m))
          .filter(m => classifyMatchWindow(m) !== "stale");

        const parsed = validMatches.map((m, idx) => parseMatch(m, idx + 1));

        parsed.sort((a, b) => getMatchPriorityScore(b) - getMatchPriorityScore(a));
        parsed.forEach((m, idx) => { m.id = idx + 1; });

        const liveCount = parsed.filter(m => m.windowState === "live").length;
        const upcomingCount = parsed.filter(m => m.windowState === "upcoming").length;
        const completedCount = parsed.filter(m => m.windowState === "completed").length;

        const resultObj = {
          source: "CricAPI",
          feedStatus: dataQualityWarnings.length > 0 ? "warning" : "fresh",
          lastSyncedAt: new Date().toISOString(),
          lastSyncedAtIST: nowIST,
          winProbAttribution: "EDGE heuristic estimate (not an official provider metric)",
          dataQualityWarnings,
          showingDate: "yesterday-today-tomorrow",
          liveCount,
          upcomingCount,
          completedCount,
          matches: parsed
        };
        writeCache(resultObj);
        return resultObj;
      }
    } catch (err: any) {
      console.warn(`[LiveMatches] CricAPI Key (${key.substring(0, 8)}...) failed: ${err.message}`);
    }
  }

  // Never substitute hardcoded historical/demo fixtures for a current provider feed.
  // Cache failures too, otherwise every open SSE connection could retry a quota-exhausted
  // provider every 15 seconds and make the outage worse.
  const unavailableResult = {
    source: "CricAPI",
    feedStatus: CRICAPI_KEYS.length === 0 ? "missing_api_key" : "provider_unavailable",
    lastSyncedAt: null,
    lastSyncedAtIST: null,
    winProbAttribution: "EDGE heuristic estimate (not an official provider metric)",
    dataQualityWarnings: [],
    showingDate: "yesterday-today-tomorrow",
    liveCount: 0,
    upcomingCount: 0,
    completedCount: 0,
    matches: [],
  };
  writeCache(unavailableResult);
  return unavailableResult;
}
