"use client";

import React, { useState, useEffect } from "react";
import { Activity, MapPin, Loader2, Calendar, Clock, Radio, CheckCircle2, Flame } from "lucide-react";

export interface LiveMatch {
  id: number;
  matchId?: string;
  name?: string;
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
  const code = shortName.replace(/-W$/i, "").trim().toUpperCase();
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

function MatchTabButton({
  match,
  isActive,
  onClick
}: {
  match: LiveMatch;
  isActive: boolean;
  onClick: () => void;
}) {
  const genderLabel = match.gender === "women" ? "W" : "M";
  const stateColor = match.isLive || match.windowState === "live"
    ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
    : match.isUpcoming || match.windowState === "upcoming"
    ? "bg-amber-400"
    : "bg-zinc-500";

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[11px] font-black tracking-wider uppercase transition-all border ${
        isActive
          ? "bg-lime-400 text-black border-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.2)]"
          : "bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
      }`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${stateColor} ${match.isLive ? "animate-ping" : ""}`} />
      <span className="font-extrabold">{match.teams.t1} vs {match.teams.t2}</span>
      <span className={`text-[8px] px-1 py-0.5 rounded border font-black ${
        match.gender === "women"
          ? "bg-pink-500/20 text-pink-400 border-pink-500/30"
          : "bg-sky-500/20 text-sky-400 border-sky-500/30"
      }`}>{genderLabel}</span>
    </button>
  );
}

const DEFAULT_MATCHES: LiveMatch[] = [
  {
    id: 1,
    matchId: "default-ind-eng-1",
    name: "India vs England, 3rd T20I (Series Decider)",
    gender: "men",
    isLive: true,
    isEnded: false,
    isUpcoming: false,
    matchType: "T20I",
    dateStr: "Live Now • Today",
    windowState: "live",
    teams: {
      t1: "IND", t1Name: "India", t1Logo: "bg-blue-600 text-white border-blue-400", t1IsImage: false,
      t2: "ENG", t2Name: "England", t2Logo: "bg-sky-700 text-white border-sky-500", t2IsImage: false,
    },
    score1: "194/4 (20 Ov)",
    score2: "152/4 (16.2 Ov)",
    overs: "16.2 Ov",
    status: "LIVE • England need 43 runs in 22 balls",
    venue: "Wankhede Stadium, Mumbai",
    pitch: "Flat batting deck with consistent carry. Dew factor settling in.",
    winProb1: 64,
    winProb2: 36,
    liveBatsmen: [
      { name: "Jos Buttler", runs: 68, balls: 41, fours: 6, sixes: 3, sr: 165.8 },
      { name: "Harry Brook", runs: 24, balls: 14, fours: 2, sixes: 1, sr: 171.4 }
    ],
    liveBowler: { name: "Jasprit Bumrah", overs: "3.2", maidens: 0, runs: 21, wickets: 2, econ: 6.3 }
  }
];

export default function LiveMatches() {
  const [matches, setMatches] = useState<LiveMatch[]>(DEFAULT_MATCHES);
  const [activeMatchIndex, setActiveMatchIndex] = useState<number>(0);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [loading, setLoading] = useState<boolean>(false);
  const [source, setSource] = useState<string>("cricapi-live");
  const [isStreamConnected, setIsStreamConnected] = useState<boolean>(false);

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
    setActiveMatchIndex((prev) => (prev === 0 ? filteredMatches.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveMatchIndex((prev) => (prev === filteredMatches.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="w-full flex flex-col gap-6 mb-12">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 flex-wrap gap-4">
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

      {/* Match Selector Buttons Strip */}
      {filteredMatches.length > 0 && (
        <div className="flex items-center justify-between gap-4 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-2 flex-wrap">
            {filteredMatches.map((m, idx) => (
              <MatchTabButton
                key={m.matchId || m.id || idx}
                match={m}
                isActive={idx === activeMatchIndex}
                onClick={() => setActiveMatchIndex(idx)}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2.5 py-1 bg-zinc-950/40 border border-zinc-900 rounded-lg">
              {activeMatchIndex + 1} / {filteredMatches.length}
            </span>
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg bg-zinc-950/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all"
              aria-label="Previous Match"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg bg-zinc-950/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all"
              aria-label="Next Match"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Main Scoreboard & Telemetry Card */}
      {!currentMatch ? (
        <div className="w-full flex flex-col items-center justify-center p-12 rounded-2xl border border-zinc-800/80 bg-zinc-950/40 gap-3 min-h-[220px]">
          <Clock className="text-zinc-600" size={28} />
          <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">No Matches in this Category</span>
          <span className="text-xs text-zinc-600">Select "All Active" or check back when new international fixtures begin.</span>
        </div>
      ) : (
        <div className="relative rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-6 overflow-hidden shadow-2xl backdrop-blur-md">
          <div className="absolute -top-12 -left-12 w-72 h-72 rounded-full blur-[140px] opacity-15 bg-lime-400 pointer-events-none" />

          {/* Top Metadata Badges */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {currentMatch.windowState === "live" && (
              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border bg-red-500/20 text-red-300 border-red-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                LIVE
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
              {currentMatch.matchType || "T20"}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10 pt-2">
            {/* Column 1: Match Scoreboard */}
            <div className="flex flex-col justify-between gap-6 lg:border-r lg:border-zinc-900/80 lg:pr-8">
              <div className="flex flex-col gap-5 mt-4">
                {/* Team 1 */}
                <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl bg-zinc-900/30 border border-zinc-800/40">
                  <div className="flex items-center gap-3">
                    <TeamLogo logo={currentMatch.teams.t1Logo} isImage={currentMatch.teams.t1IsImage} shortName={currentMatch.teams.t1} />
                    <div className="flex flex-col">
                      <span className="text-sm font-extrabold text-white leading-tight">{currentMatch.teams.t1Name}</span>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{currentMatch.teams.t1}</span>
                    </div>
                  </div>
                  <span className="text-base font-black text-white shrink-0 tracking-tight">{currentMatch.score1}</span>
                </div>

                {/* Team 2 */}
                <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl bg-zinc-900/30 border border-zinc-800/40">
                  <div className="flex items-center gap-3">
                    <TeamLogo logo={currentMatch.teams.t2Logo} isImage={currentMatch.teams.t2IsImage} shortName={currentMatch.teams.t2} />
                    <div className="flex flex-col">
                      <span className="text-sm font-extrabold text-white leading-tight">{currentMatch.teams.t2Name}</span>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{currentMatch.teams.t2}</span>
                    </div>
                  </div>
                  <span className={`text-base font-black shrink-0 tracking-tight ${
                    currentMatch.isUpcoming ? "text-zinc-500" : "text-lime-400"
                  }`}>
                    {currentMatch.score2}
                  </span>
                </div>
              </div>

              {/* Real-time Win Probability */}
              {currentMatch.isUpcoming ? (
                <div className="bg-[#0e0e16] border border-[#141420] rounded-xl p-4 flex flex-col items-center justify-center gap-1.5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Win Probability Matrix</span>
                  <span className="text-xs font-bold text-amber-400">Calibrating match telemetry prior to toss</span>
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
                  ? "bg-red-500/[0.06] border-red-500/30 text-red-300"
                  : currentMatch.windowState === "upcoming"
                  ? "bg-amber-500/[0.06] border-amber-500/30 text-amber-300"
                  : "bg-lime-500/[0.06] border-lime-500/30 text-lime-300"
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

            {/* Column 3: Live Crease Telemetry or Match Preview */}
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <Activity size={13} className="text-lime-400" />
                {currentMatch.isUpcoming ? "Scheduled Match Preview" : "Live Crease Telemetry"}
              </span>

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
              ) : (
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
