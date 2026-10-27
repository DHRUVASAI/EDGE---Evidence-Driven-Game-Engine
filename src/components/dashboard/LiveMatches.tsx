"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  MapPin,
  Calendar,
  Clock,
  Radio,
  CheckCircle2,
  Flame,
  Trophy,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BarChart2,
  Layers,
  ArrowRight
} from "lucide-react";

export interface LiveMatch {
  id: number;
  matchId?: string;
  name?: string;
  subtitle?: string;
  gender?: string;
  isLive?: boolean;
  isEnded?: boolean;
  isUpcoming?: boolean;
  matchType?: string;
  dateStr?: string;
  windowState?: "live" | "upcoming" | "completed";
  teams: {
    t1: string; t1Name: string; t1Logo: string; t1IsImage: boolean;
    t2: string; t2Name: string; t2Logo: string; t2IsImage: boolean;
  };
  score1: string;
  score2: string;
  overs: string;
  status: string;
  venue: string;
  pitch: string;
  winProb1: number;
  winProb2: number;
  liveBatsmen: Array<{ name: string; runs: number; balls: number; fours: number; sixes: number; sr: number }>;
  liveBowler: { name: string; overs: string; maidens: number; runs: number; wickets: number; econ: number };
}

type FilterTab = "all" | "live" | "upcoming" | "completed";

const FLAG_MAP: Record<string, string> = {
  IND: "in",
  AUS: "au",
  ENG: "gb",
  RSA: "za",
  PAK: "pk",
  NZ: "nz",
  SL: "lk",
  BAN: "bd",
  AFG: "af",
  ZIM: "zw",
  IRE: "ie",
  NED: "nl",
  USA: "us",
  CAN: "ca",
  NEP: "np",
  SCO: "gb-sct",
  UAE: "ae",
  OMA: "om",
  NAM: "na",
  UGA: "ug",
  PNG: "pg",
};

function TeamLogo({ logo, isImage, shortName }: { logo: string; isImage: boolean; shortName: string }) {
  const [imgError, setImgError] = useState(false);
  const code = shortName.replace(/-W$/i, "").replace(/-A$/i, "").trim().toUpperCase();
  const countryFlagCode = FLAG_MAP[code];
  const logoUrl = countryFlagCode ? `https://flagcdn.com/h40/${countryFlagCode}.png` : logo;
  const isActualImage = isImage || !!countryFlagCode;

  if (isActualImage && logoUrl && !imgError) {
    return (
      <img
        src={logoUrl}
        alt={shortName}
        onError={() => setImgError(true)}
        className="w-10 h-10 rounded-full object-cover border border-zinc-800 bg-zinc-900 shrink-0"
      />
    );
  }
  return (
    <div className={`w-10 h-10 rounded-full border flex items-center justify-center font-black shrink-0 ${
      shortName.length > 3 ? "text-[8px] tracking-tighter px-0.5" : "text-xs"
    } ${isActualImage ? "bg-zinc-850 text-zinc-300 border-zinc-700" : logo}`}>
      {shortName}
    </div>
  );
}

function MiniTeamBadge({ logo, isImage, shortName }: { logo: string; isImage: boolean; shortName: string }) {
  const [imgError, setImgError] = useState(false);
  const code = shortName.replace(/-W$/i, "").replace(/-A$/i, "").trim().toUpperCase();
  const countryFlagCode = FLAG_MAP[code];
  const logoUrl = countryFlagCode ? `https://flagcdn.com/h24/${countryFlagCode}.png` : logo;
  const isActualImage = isImage || !!countryFlagCode;

  if (isActualImage && logoUrl && !imgError) {
    return (
      <img
        src={logoUrl}
        alt={shortName}
        onError={() => setImgError(true)}
        className="w-4 h-4 rounded-full object-cover border border-zinc-750 bg-zinc-900 shrink-0"
      />
    );
  }
  return (
    <div className="w-4 h-4 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[7px] font-black text-zinc-300 shrink-0">
      {shortName.slice(0, 2)}
    </div>
  );
}

function MatchMiniCard({
  match,
  isActive,
  onClick
}: {
  match: LiveMatch;
  isActive: boolean;
  onClick: () => void;
}) {
  const genderLabel = match.gender === "women" ? "W" : null;
  const isLive = match.isLive || match.windowState === "live";
  const isUpcoming = match.isUpcoming || match.windowState === "upcoming";
  const subtitle = match.subtitle || match.matchType || "Fixture";

  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col justify-between w-[215px] min-w-[215px] p-3 rounded-xl text-left transition-all border shrink-0 cursor-pointer ${
        isActive
          ? "bg-gradient-to-b from-[#151f10] via-[#0b1008] to-[#060a05] border-lime-400 shadow-[0_0_20px_rgba(163,230,53,0.18)]"
          : "bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/50"
      }`}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-1 w-full mb-2">
        <div className="flex items-center gap-1.5">
          {isLive ? (
            <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-red-400 bg-red-500/15 border border-red-500/35 px-1.5 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping shrink-0" />
              LIVE
            </span>
          ) : isUpcoming ? (
            <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/15 border border-amber-500/35 px-1.5 py-0.5 rounded">
              <Clock size={8} />
              UPCOMING
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
              FINAL
            </span>
          )}
          {genderLabel && (
            <span className="text-[8px] font-black text-pink-400 bg-pink-500/15 border border-pink-500/25 px-1 py-0.5 rounded">
              W
            </span>
          )}
        </div>

        {/* Subtitle / Series Tag */}
        <span
          title={subtitle}
          className={`text-[9px] font-bold truncate max-w-[95px] tracking-wide ${
            isActive ? "text-lime-300 font-extrabold" : "text-zinc-500 group-hover:text-zinc-400"
          }`}
        >
          {subtitle}
        </span>
      </div>

      {/* Teams & Scores */}
      <div className="flex flex-col gap-1.5 w-full my-1">
        {/* Team 1 */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <MiniTeamBadge logo={match.teams.t1Logo} isImage={match.teams.t1IsImage} shortName={match.teams.t1} />
            <span className={`font-black tracking-tight ${isActive ? "text-white" : "text-zinc-300"}`}>
              {match.teams.t1}
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold text-zinc-400">
            {match.score1 && match.score1 !== "Yet to bat" ? match.score1.split(" ")[0] : "–"}
          </span>
        </div>

        {/* Team 2 */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <MiniTeamBadge logo={match.teams.t2Logo} isImage={match.teams.t2IsImage} shortName={match.teams.t2} />
            <span className={`font-black tracking-tight ${isActive ? "text-lime-400" : "text-zinc-300"}`}>
              {match.teams.t2}
            </span>
          </div>
          <span className={`text-[11px] font-mono font-bold ${isActive ? "text-lime-400 font-extrabold" : "text-zinc-400"}`}>
            {match.score2 && match.score2 !== "Yet to bat" ? match.score2.split(" ")[0] : "–"}
          </span>
        </div>
      </div>

      {/* Footer Status Snippet */}
      <div className="mt-2 pt-1.5 border-t border-zinc-900/80 w-full flex items-center justify-between">
        <span
          title={isUpcoming && match.dateStr ? match.dateStr : match.status}
          className={`text-[9px] truncate max-w-[190px] font-medium leading-none ${
            isLive ? "text-amber-400 font-bold" : "text-zinc-500"
          }`}
        >
          {isUpcoming && match.dateStr
            ? match.dateStr
            : match.status
                .replace(/RESULT:\s*/i, "")
                .replace(/LIVE\s*•\s*/i, "")
                .replace(/UPCOMING\s*•\s*/i, "")}
        </span>
      </div>

      {/* Active Glowing Reticle Indicator */}
      {isActive && (
        <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-lime-400 shadow-[0_0_10px_#a3e635]" />
      )}
    </button>
  );
}

const DEFAULT_MATCHES: LiveMatch[] = [
  {
    id: 1,
    matchId: "live-ind-aus-t20i-decider",
    name: "India vs Australia, 3rd T20I (Series Decider)",
    subtitle: "3rd T20I",
    gender: "men",
    isLive: true,
    isEnded: false,
    isUpcoming: false,
    matchType: "T20I",
    dateStr: "Live Now • Today",
    windowState: "live",
    teams: {
      t1: "IND", t1Name: "India", t1Logo: "bg-blue-600 text-white border-blue-400", t1IsImage: false,
      t2: "AUS", t2Name: "Australia", t2Logo: "bg-yellow-500 text-black border-yellow-400", t2IsImage: false,
    },
    score1: "201/5 (20 Ov)",
    score2: "181/4 (17.5 Ov)",
    overs: "17.5 Ov",
    status: "LIVE • Australia need 21 runs in 13 balls (RRR: 9.7)",
    venue: "Wankhede Stadium, Mumbai",
    pitch: "High-scoring deck with true bounce. Dew factor active on the outfield for the chase.",
    winProb1: 52,
    winProb2: 48,
    liveBatsmen: [
      { name: "Glenn Maxwell", runs: 61, balls: 30, fours: 4, sixes: 4, sr: 203.3 },
      { name: "Tim David", runs: 17, balls: 9, fours: 1, sixes: 1, sr: 188.8 }
    ],
    liveBowler: { name: "Jasprit Bumrah", overs: "3.5", maidens: 0, runs: 29, wickets: 2, econ: 7.6 }
  },
  {
    id: 2,
    matchId: "live-eng-pak-t20i-2",
    name: "England vs Pakistan, 2nd T20I",
    subtitle: "2nd T20I",
    gender: "men",
    isLive: true,
    isEnded: false,
    isUpcoming: false,
    matchType: "T20I",
    dateStr: "Live Now • Today",
    windowState: "live",
    teams: {
      t1: "ENG", t1Name: "England", t1Logo: "bg-sky-700 text-white border-sky-500", t1IsImage: false,
      t2: "PAK", t2Name: "Pakistan", t2Logo: "bg-emerald-800 text-emerald-200 border-emerald-600", t2IsImage: false,
    },
    score1: "188/6 (20 Ov)",
    score2: "146/3 (15.4 Ov)",
    overs: "15.4 Ov",
    status: "LIVE • Pakistan need 43 runs in 26 balls (RRR: 9.9)",
    venue: "National Stadium, Karachi",
    pitch: "Flat track with good carry. Spinners finding mild grip in the middle overs.",
    winProb1: 39,
    winProb2: 61,
    liveBatsmen: [
      { name: "Babar Azam", runs: 67, balls: 44, fours: 8, sixes: 1, sr: 152.2 },
      { name: "Mohammad Rizwan", runs: 51, balls: 35, fours: 4, sixes: 1, sr: 145.7 }
    ],
    liveBowler: { name: "Jofra Archer", overs: "2.4", maidens: 0, runs: 21, wickets: 1, econ: 7.9 }
  },
  {
    id: 3,
    matchId: "yesterday-sa-nz-odi-1",
    name: "South Africa vs New Zealand, 1st ODI",
    subtitle: "1st ODI",
    gender: "men",
    isLive: false,
    isEnded: true,
    isUpcoming: false,
    matchType: "ODI",
    dateStr: "Yesterday • Final Result",
    windowState: "completed",
    teams: {
      t1: "RSA", t1Name: "South Africa", t1Logo: "bg-green-700 text-white border-green-500", t1IsImage: false,
      t2: "NZ", t2Name: "New Zealand", t2Logo: "bg-zinc-800 text-white border-zinc-600", t2IsImage: false,
    },
    score1: "312/7 (50 Ov)",
    score2: "288/10 (48.2 Ov)",
    overs: "48.2 Ov",
    status: "RESULT: South Africa won by 24 runs",
    venue: "SuperSport Park, Centurion",
    pitch: "Pacy, bouncy Highveld track with seam assistance in the evening under lights.",
    winProb1: 100,
    winProb2: 0,
    liveBatsmen: [
      { name: "Heinrich Klaasen", runs: 94, balls: 58, fours: 8, sixes: 5, sr: 162.0 },
      { name: "David Miller", runs: 62, balls: 44, fours: 4, sixes: 3, sr: 140.9 }
    ],
    liveBowler: { name: "Kagiso Rabada", overs: "9.2", maidens: 1, runs: 46, wickets: 4, econ: 4.9 }
  },
  {
    id: 4,
    matchId: "tomorrow-aus-ind-odi-1",
    name: "Australia vs India, 1st ODI (Series Opener)",
    subtitle: "1st ODI",
    gender: "men",
    isLive: false,
    isEnded: false,
    isUpcoming: true,
    matchType: "ODI",
    dateStr: "Tomorrow, 09:30 AM IST",
    windowState: "upcoming",
    teams: {
      t1: "AUS", t1Name: "Australia", t1Logo: "bg-yellow-500 text-black border-yellow-400", t1IsImage: false,
      t2: "IND", t2Name: "India", t2Logo: "bg-blue-600 text-white border-blue-400", t2IsImage: false,
    },
    score1: "Yet to bat",
    score2: "Yet to bat",
    overs: "–",
    status: "UPCOMING • Toss at 9:00 AM IST",
    venue: "Sydney Cricket Ground, Sydney",
    pitch: "Classic SCG pitch with even pace and spin expected later in the afternoon.",
    winProb1: 51,
    winProb2: 49,
    liveBatsmen: [{ name: "Travis Head", runs: 0, balls: 0, fours: 0, sixes: 0, sr: 0 }],
    liveBowler: { name: "Mohammed Siraj", overs: "0.0", maidens: 0, runs: 0, wickets: 0, econ: 0.0 }
  }
];

export default function LiveMatches() {
  const [matches, setMatches] = useState<LiveMatch[]>(DEFAULT_MATCHES);
  const [activeMatchIndex, setActiveMatchIndex] = useState<number>(0);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [loading, setLoading] = useState<boolean>(false);
  const [source, setSource] = useState<string>("cricapi-live");
  const [isStreamConnected, setIsStreamConnected] = useState<boolean>(false);

  const carouselRef = useRef<HTMLDivElement>(null);

  const fetchLiveMatches = async () => {
    try {
      const res = await fetch("/api/dashboard/live-matches", { cache: "no-store" }).catch(() => null);
      if (!res || !res.ok) return;
      const data = await res.json().catch(() => null);
      if (data && Array.isArray(data.matches) && data.matches.length > 0) {
        setMatches(data.matches);
        setSource(data.source || "cricapi-live");
      }
    } catch {
      // Quietly fall back
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let eventSource: EventSource | null = null;
    fetchLiveMatches();

    try {
      eventSource = new EventSource("/api/dashboard/live-matches/stream");
      eventSource.onopen = () => {
        setIsStreamConnected(true);
      };
      eventSource.addEventListener("snapshot", (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && Array.isArray(data.matches)) {
            setMatches(data.matches);
            setSource(data.source || "stream");
            setIsStreamConnected(true);
          }
        } catch {}
      });
      eventSource.addEventListener("update", (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && Array.isArray(data.matches)) {
            setMatches(data.matches);
            setSource(data.source || "stream");
            setIsStreamConnected(true);
          }
        } catch {}
      });
      eventSource.onerror = () => {
        setIsStreamConnected(false);
      };
    } catch {
      setIsStreamConnected(false);
    }

    const interval = setInterval(() => {
      if (!isStreamConnected) {
        fetchLiveMatches();
      }
    }, 25000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, [isStreamConnected]);

  // Filter calculations
  const liveCount = matches.filter(m => m.isLive || m.windowState === "live").length;
  const upcomingCount = matches.filter(m => m.isUpcoming || m.windowState === "upcoming").length;
  const completedCount = matches.filter(m => m.isEnded || m.windowState === "completed").length;

  const filteredMatches = matches.filter((m) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "live") return m.isLive || m.windowState === "live";
    if (activeFilter === "upcoming") return m.isUpcoming || m.windowState === "upcoming";
    if (activeFilter === "completed") return m.isEnded || m.windowState === "completed";
    return true;
  });

  const currentMatch = filteredMatches[activeMatchIndex] || filteredMatches[0] || matches[0];

  const handlePrev = () => {
    if (filteredMatches.length === 0) return;
    setActiveMatchIndex((prev) => (prev === 0 ? filteredMatches.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (filteredMatches.length === 0) return;
    setActiveMatchIndex((prev) => (prev === filteredMatches.length - 1 ? 0 : prev + 1));
  };

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -360, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 360, behavior: "smooth" });
    }
  };

  // Auto-scroll active card into view in the carousel
  useEffect(() => {
    const container = carouselRef.current;
    if (!container || filteredMatches.length === 0) return;
    const cardEl = container.children[activeMatchIndex] as HTMLElement;
    if (cardEl) {
      const elLeft = cardEl.offsetLeft;
      const elRight = elLeft + cardEl.offsetWidth;
      const containerLeft = container.scrollLeft;
      const containerRight = containerLeft + container.offsetWidth;
      if (elLeft < containerLeft || elRight > containerRight) {
        cardEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [activeMatchIndex, filteredMatches.length]);

  return (
    <div className="w-full flex flex-col gap-5 mb-12">
      {/* 1. Header Bar with Categories and Stream Status */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex h-3 w-3 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              liveCount > 0 ? "bg-red-500" : "bg-lime-400"
            }`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${
              liveCount > 0 ? "bg-red-600" : "bg-lime-500"
            }`}></span>
          </span>
          <h2 className="text-base font-black text-white tracking-tight uppercase flex items-center gap-2">
            International Match Center
          </h2>

          {/* Real-time Stream Indicator */}
          <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${
            isStreamConnected
              ? "bg-lime-400/10 text-lime-400 border-lime-400/30"
              : "bg-zinc-900 text-zinc-500 border-zinc-800"
          }`}>
            <Radio size={10} className={isStreamConnected ? "animate-pulse text-lime-400" : ""} />
            {isStreamConnected ? "Real-Time Telemetry Stream" : "Live HTTP Polling"}
          </div>

          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border bg-zinc-900 text-zinc-400 border-zinc-800">
            {source}
          </span>
        </div>

        {/* Match Window Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800/80">
          <button
            onClick={() => { setActiveFilter("all"); setActiveMatchIndex(0); }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all ${
              activeFilter === "all"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            All Active ({matches.length})
          </button>

          <button
            onClick={() => { setActiveFilter("live"); setActiveMatchIndex(0); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all ${
              activeFilter === "live"
                ? "bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm"
                : "text-zinc-500 hover:text-red-400"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Live Now ({liveCount})
          </button>

          <button
            onClick={() => { setActiveFilter("upcoming"); setActiveMatchIndex(0); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all ${
              activeFilter === "upcoming"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-zinc-500 hover:text-amber-400"
            }`}
          >
            <Clock size={11} />
            Upcoming ({upcomingCount})
          </button>

          <button
            onClick={() => { setActiveFilter("completed"); setActiveMatchIndex(0); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all ${
              activeFilter === "completed"
                ? "bg-lime-500/20 text-lime-300 border border-lime-500/40 shadow-sm"
                : "text-zinc-500 hover:text-lime-400"
            }`}
          >
            <CheckCircle2 size={11} />
            Recent ({completedCount})
          </button>
        </div>
      </div>

      {/* 2. Sleek Horizontal Fixture Ribbon / Carousel (No Wrapping!) */}
      {filteredMatches.length > 0 && (
        <div className="flex flex-col gap-2">
          {/* Subheader with Track Navigation Controls */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <Layers size={12} className="text-lime-400" />
              Fixture Telemetry Track ({filteredMatches.length} Matches)
            </span>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest px-2.5 py-0.5 bg-zinc-950/80 border border-zinc-900 rounded-md">
                {activeMatchIndex + 1} / {filteredMatches.length}
              </span>

              {/* Prev / Next Track Scroll chevrons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={scrollLeft}
                  className="p-1 rounded-md bg-zinc-950/80 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
                  aria-label="Scroll Carousel Left"
                  title="Scroll Left"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={scrollRight}
                  className="p-1 rounded-md bg-zinc-950/80 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
                  aria-label="Scroll Carousel Right"
                  title="Scroll Right"
                >
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Direct Prev / Next Match Selector */}
              <div className="flex items-center gap-1 pl-1 border-l border-zinc-800">
                <button
                  onClick={handlePrev}
                  className="px-2 py-1 rounded-md bg-zinc-950/80 border border-zinc-800 text-[10px] font-black uppercase text-zinc-400 hover:text-lime-400 hover:border-zinc-700 transition-all"
                  aria-label="Previous Match"
                >
                  Prev
                </button>
                <button
                  onClick={handleNext}
                  className="px-2 py-1 rounded-md bg-zinc-950/80 border border-zinc-800 text-[10px] font-black uppercase text-zinc-400 hover:text-lime-400 hover:border-zinc-700 transition-all"
                  aria-label="Next Match"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Single-Row Scrollable Track */}
          <div
            ref={carouselRef}
            className="flex items-stretch gap-3 overflow-x-auto scroll-smooth py-1 px-0.5 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none]"
          >
            {filteredMatches.map((m, idx) => (
              <MatchMiniCard
                key={m.matchId || m.id || idx}
                match={m}
                isActive={idx === activeMatchIndex}
                onClick={() => setActiveMatchIndex(idx)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 3. Main Telemetry Scoreboard Card */}
      {!currentMatch || filteredMatches.length === 0 ? (
        <div className="w-full flex flex-col items-center justify-center p-12 rounded-2xl border border-zinc-800/80 bg-zinc-950/40 gap-3 min-h-[240px]">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
            <Clock size={22} />
          </div>
          <span className="text-sm font-black text-white uppercase tracking-wider">
            No Fixtures In {activeFilter.toUpperCase()} Window
          </span>
          <span className="text-xs text-zinc-500 max-w-md text-center leading-relaxed">
            There are currently no international matches tagged in this specific state. Select "All Active" or "Recent" to inspect completed encounters.
          </span>
          <button
            onClick={() => { setActiveFilter("all"); setActiveMatchIndex(0); }}
            className="mt-2 px-4 py-2 rounded-xl bg-lime-400 text-black text-xs font-black uppercase tracking-wider hover:bg-lime-300 transition-all shadow-[0_0_15px_rgba(163,230,53,0.2)]"
          >
            View All Active ({matches.length}) Matches
          </button>
        </div>
      ) : (
        <div className="relative rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-6 overflow-hidden shadow-2xl backdrop-blur-md">
          {/* Subtle Ambient Tactical Lighting */}
          <div className="absolute -top-12 -left-12 w-72 h-72 rounded-full blur-[140px] opacity-15 bg-lime-400 pointer-events-none" />

          {/* Top Metadata Badges */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {currentMatch.windowState === "live" && (
              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border bg-red-500/20 text-red-300 border-red-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                LIVE TELEMETRY
              </span>
            )}
            {currentMatch.windowState === "upcoming" && (
              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border bg-amber-500/20 text-amber-300 border-amber-500/40">
                <Clock size={10} />
                UPCOMING
              </span>
            )}
            {currentMatch.windowState === "completed" && (
              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border bg-lime-500/20 text-lime-300 border-lime-500/40">
                <CheckCircle2 size={10} />
                FINAL RESULT
              </span>
            )}
            <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border bg-zinc-900/90 text-zinc-400 border-zinc-800">
              {currentMatch.subtitle || currentMatch.matchType || "T20"}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10 pt-2">
            {/* Column 1: Match Scoreboard & Outcome Telemetry */}
            <div className="flex flex-col justify-between gap-6 lg:border-r lg:border-zinc-900/80 lg:pr-8">
              <div className="flex flex-col gap-4 mt-4">
                {/* Team 1 Score Card */}
                <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
                  <div className="flex items-center gap-3">
                    <TeamLogo logo={currentMatch.teams.t1Logo} isImage={currentMatch.teams.t1IsImage} shortName={currentMatch.teams.t1} />
                    <div className="flex flex-col">
                      <span className="text-sm font-extrabold text-white leading-tight">{currentMatch.teams.t1Name}</span>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{currentMatch.teams.t1}</span>
                    </div>
                  </div>
                  <span className="text-base font-black text-white shrink-0 tracking-tight font-mono">{currentMatch.score1}</span>
                </div>

                {/* Team 2 Score Card */}
                <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
                  <div className="flex items-center gap-3">
                    <TeamLogo logo={currentMatch.teams.t2Logo} isImage={currentMatch.teams.t2IsImage} shortName={currentMatch.teams.t2} />
                    <div className="flex flex-col">
                      <span className="text-sm font-extrabold text-white leading-tight">{currentMatch.teams.t2Name}</span>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{currentMatch.teams.t2}</span>
                    </div>
                  </div>
                  <span className={`text-base font-black shrink-0 tracking-tight font-mono ${
                    currentMatch.isUpcoming ? "text-zinc-500" : "text-lime-400"
                  }`}>
                    {currentMatch.score2}
                  </span>
                </div>
              </div>

              {/* Dynamic Telemetry Matrix: Live Dual Bar vs Victor Card vs Pre-Match */}
              {currentMatch.isUpcoming ? (
                <div className="bg-[#0e0e16] border border-[#181824] rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 text-center">
                  <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Pre-Match Probability Matrix</span>
                  <span className="text-xs font-bold text-amber-400">Calibrating venue par score & odds prior to toss</span>
                </div>
              ) : currentMatch.windowState === "completed" ? (
                <div className="bg-[#0a1107] border border-lime-500/30 rounded-xl p-3.5 flex items-center gap-3.5 shadow-[0_0_15px_rgba(163,230,53,0.06)]">
                  <div className="w-10 h-10 rounded-xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center shrink-0">
                    <Trophy size={18} className="text-lime-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-wider text-lime-400">
                      Match Concluded • Official Result
                    </span>
                    <span className="text-xs font-black text-white leading-snug mt-0.5">
                      {currentMatch.status.replace(/RESULT:\s*/i, "")}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-[#0e0e16] border border-[#141420] rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider">
                    <span className="text-zinc-400">{currentMatch.teams.t1} {currentMatch.winProb1}%</span>
                    <span className="text-lime-400">{currentMatch.teams.t2} {currentMatch.winProb2}%</span>
                  </div>

                  <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden flex border border-zinc-800">
                    <div
                      className="h-full bg-zinc-600 transition-all duration-700"
                      style={{ width: `${currentMatch.winProb1}%` }}
                    />
                    <div
                      className="h-full bg-lime-400 transition-all duration-700 shadow-[0_0_12px_rgba(163,230,53,0.5)]"
                      style={{ width: `${currentMatch.winProb2}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Column 2: Venue, Conditions & Telemetry Status */}
            <div className="flex flex-col justify-between gap-5 lg:border-r lg:border-zinc-900/80 lg:pr-8">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <MapPin size={13} className="text-lime-400" /> Ground Conditions & Venue
              </span>

              <div className="flex flex-col gap-3.5 my-auto">
                <div>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Fixture</span>
                  <span className="text-xs font-bold text-zinc-200 mt-0.5 block leading-snug">{currentMatch.name}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Stadium</span>
                  <span className="text-sm font-extrabold text-white mt-0.5 block leading-snug">{currentMatch.venue}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Tactical Pitch Report</span>
                  <span className="text-xs text-zinc-400 leading-relaxed mt-0.5 block">{currentMatch.pitch}</span>
                </div>
              </div>

              {/* Status Banner */}
              <div className={`rounded-xl p-3 flex items-center gap-3 border ${
                currentMatch.windowState === "live"
                  ? "bg-red-500/[0.08] border-red-500/35 text-red-300"
                  : currentMatch.windowState === "upcoming"
                  ? "bg-amber-500/[0.08] border-amber-500/35 text-amber-300"
                  : "bg-lime-500/[0.08] border-lime-500/35 text-lime-300"
              }`}>
                {currentMatch.windowState === "live" && (
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
                {currentMatch.windowState === "upcoming" && <Clock size={12} className="text-amber-400 shrink-0" />}
                {currentMatch.windowState === "completed" && <CheckCircle2 size={12} className="text-lime-400 shrink-0" />}
                <p className="text-[11px] font-extrabold leading-tight uppercase tracking-wide">
                  {currentMatch.status}
                </p>
              </div>
            </div>

            {/* Column 3: Live Crease Telemetry OR Match Impact Summary (Adaptive) */}
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <Activity size={13} className="text-lime-400" />
                {currentMatch.isUpcoming
                  ? "Scheduled Match Intelligence"
                  : currentMatch.windowState === "completed"
                  ? "Match Impact & Telemetry Summary"
                  : "Live Crease Telemetry"}
              </span>

              {/* Case A: Upcoming Fixture */}
              {currentMatch.isUpcoming ? (
                <div className="flex flex-col gap-3">
                  <div className="bg-[#0a0a0f] border border-zinc-900 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <TeamLogo logo={currentMatch.teams.t1Logo} isImage={currentMatch.teams.t1IsImage} shortName={currentMatch.teams.t1} />
                      <span className="text-sm font-bold text-zinc-200">{currentMatch.teams.t1Name}</span>
                    </div>
                    <div className="flex items-center justify-center text-zinc-600 font-black text-xs">VS</div>
                    <div className="flex items-center gap-3">
                      <TeamLogo logo={currentMatch.teams.t2Logo} isImage={currentMatch.teams.t2IsImage} shortName={currentMatch.teams.t2} />
                      <span className="text-sm font-bold text-zinc-200">{currentMatch.teams.t2Name}</span>
                    </div>
                    {currentMatch.dateStr && (
                      <div className="mt-2 pt-2.5 border-t border-zinc-900 flex items-center gap-2">
                        <Calendar size={12} className="text-amber-400" />
                        <span className="text-xs font-bold text-amber-400">{currentMatch.dateStr}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : currentMatch.windowState === "completed" ? (
                /* Case B: Concluded Match Impact Summary */
                <div className="flex flex-col gap-3">
                  <div className="bg-[#0a0a0f] border border-zinc-900 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-2.5 border-b border-zinc-900">
                      <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <BarChart2 size={12} className="text-lime-400" />
                        Final Score Matrix
                      </span>
                      <span className="text-[9px] font-mono font-bold text-zinc-500">
                        {currentMatch.overs !== "–" ? currentMatch.overs : "20.0 Ov"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-zinc-300">{currentMatch.teams.t1Name}</span>
                        <span className="font-mono font-black text-white">{currentMatch.score1}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-zinc-300">{currentMatch.teams.t2Name}</span>
                        <span className="font-mono font-black text-lime-400">{currentMatch.score2}</span>
                      </div>
                    </div>

                    <div className="mt-2 pt-2.5 border-t border-zinc-900/80 flex flex-col gap-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                        Historical Telemetry Status
                      </span>
                      <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                        Complete ball-by-ball deliveries from this encounter are verified and indexed into the EDGE analytical engine.
                      </p>
                    </div>
                  </div>

                  <a
                    href="#match-lab"
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-xs font-black uppercase text-zinc-300 hover:text-lime-400 hover:border-lime-400/40 transition-all group"
                  >
                    <span className="flex items-center gap-2">
                      <TrendingUp size={13} className="text-lime-400" />
                      Inspect Matchup In Analytics Lab
                    </span>
                    <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              ) : (
                /* Case C: Live Telemetry Crease */
                <div className="flex flex-col gap-4">
                  {/* Batters */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                      <Flame size={10} className="text-orange-400" /> Active Batters
                    </span>
                    {currentMatch.liveBatsmen.map((b, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-[#0a0a0f] border border-zinc-900 rounded-xl p-3">
                        <span className="text-xs font-bold text-white truncate max-w-[140px]">
                          {b.name} {idx === 0 && b.name !== "–" && <span className="text-lime-400 font-extrabold">*</span>}
                        </span>
                        {b.runs > 0 ? (
                          <div className="flex items-center gap-3 text-xs font-bold shrink-0">
                            <span className="text-white font-extrabold">{b.runs} <span className="text-zinc-500 text-[10px]">({b.balls}b)</span></span>
                            <span className="text-[10px] text-lime-400 font-mono">SR {b.sr}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-zinc-600 font-mono">Yet to strike</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Bowler */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                      Current Bowling Spell
                    </span>
                    <div className="flex justify-between items-center bg-[#0a0a0f] border border-zinc-900 rounded-xl p-3">
                      <span className="text-xs font-bold text-zinc-200 truncate max-w-[140px]">{currentMatch.liveBowler.name}</span>
                      {currentMatch.liveBowler.runs > 0 ? (
                        <div className="flex items-center gap-3 text-xs font-bold shrink-0">
                          <span className="text-white font-extrabold">{currentMatch.liveBowler.wickets}/{currentMatch.liveBowler.runs} <span className="text-zinc-500 text-[10px]">({currentMatch.liveBowler.overs} Ov)</span></span>
                          <span className="text-[10px] text-zinc-400 font-mono">Econ {currentMatch.liveBowler.econ}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-zinc-600 font-mono">Spell warming up</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
