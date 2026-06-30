"use client";

import React, { useState, useEffect } from "react";
import { Activity, MapPin, Loader2 } from "lucide-react";

interface LiveMatch {
  id: number;
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
  matchType?: string;
  isLive?: boolean;
  isEnded?: boolean;
  liveBatsmen: Array<{ name: string; runs: number; balls: number; fours: number; sixes: number; sr: number }>;
  liveBowler: { name: string; overs: string; maidens: number; runs: number; wickets: number; econ: number };
}

function TeamLogo({ logo, isImage, shortName }: { logo: string; isImage: boolean; shortName: string }) {
  const [imgError, setImgError] = useState(false);

  if (isImage && logo && !imgError) {
    return (
      <img
        src={logo}
        alt={shortName}
        onError={() => setImgError(true)}
        className="w-10 h-10 rounded-full object-cover border border-zinc-800 bg-zinc-900 shrink-0"
      />
    );
  }

  return (
    <div className={`w-10 h-10 rounded-full border flex items-center justify-center font-black shrink-0 ${
      shortName.length > 3 ? "text-[8px] tracking-tighter px-0.5" : "text-xs"
    } ${isImage ? "bg-zinc-800 text-zinc-200 border-zinc-700" : logo}`}>
      {shortName}
    </div>
  );
}

export default function LiveMatches() {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [activeMatchIndex, setActiveMatchIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [source, setSource] = useState<string>("mock");
  const [liveCount, setLiveCount] = useState<number>(0);

  const fetchLiveMatches = async () => {
    try {
      const res = await fetch("/api/dashboard/live-matches");
      if (res.ok) {
        const data = await res.json();
        if (data.matches && data.matches.length > 0) {
          setMatches(data.matches);
          setSource(data.source || "mock");
          setLiveCount(data.liveCount ?? 0);
        }
      }
    } catch (err) {
      console.error("Error fetching live matches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveMatches();
    const interval = setInterval(fetchLiveMatches, 20000); // every 20s
    return () => clearInterval(interval);
  }, []);

  if (loading && matches.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-8 rounded-2xl border border-zinc-800/80 bg-zinc-950/30 gap-3 min-h-[200px]">
        <Loader2 className="animate-spin text-lime-400" size={24} />
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
          Establishing Real-Time Stream via CricAPI...
        </span>
      </div>
    );
  }

  const match = matches[activeMatchIndex] || matches[0];
  if (!match) return null;

  const sourceLabel =
    source === "live" ? "LIVE NOW" :
    source === "recent" ? "Recent Matches" :
    "Simulated";

  const sourceBadgeClass =
    source === "live"
      ? "bg-red-500/20 text-red-400 border-red-500/30"
      : source === "recent"
      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
      : "bg-purple-500/10 text-purple-400 border-purple-500/20";

  return (
    <div className="w-full flex flex-col gap-6 mb-12">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${source === "live" ? "bg-red-500" : "bg-amber-500"}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${source === "live" ? "bg-red-600" : "bg-amber-500"}`}></span>
          </span>
          <h2 className="text-base font-bold text-white tracking-tight uppercase">
            Live Match Analytics Center
          </h2>
          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ml-1 ${sourceBadgeClass}`}>
            {sourceLabel}
          </span>
          {source === "live" && liveCount > 0 && (
            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border bg-lime-400/10 text-lime-400 border-lime-400/20">
              {liveCount} Match{liveCount > 1 ? "es" : ""} Live
            </span>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {matches.map((m, idx) => (
            <button
              key={m.id}
              onClick={() => setActiveMatchIndex(idx)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all ${
                activeMatchIndex === idx
                  ? "bg-lime-400 text-black border border-lime-400"
                  : "bg-zinc-950/40 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {m.teams.t1} vs {m.teams.t2}
            </button>
          ))}
        </div>
      </div>

      {/* Live Match Board */}
      <div className="relative rounded-2xl border border-zinc-800/80 bg-zinc-950/30 p-6 overflow-hidden">
        <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full blur-[120px] opacity-10 bg-lime-400 pointer-events-none" />

        {/* Match Type Badge */}
        {match.matchType && (
          <div className="absolute top-3 right-3 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border bg-zinc-900 text-zinc-500 border-zinc-800">
            {match.matchType}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          {/* Column 1: Scoreboard & Win Probability */}
          <div className="flex flex-col justify-between gap-6 lg:border-r lg:border-zinc-900/80 lg:pr-8">
            <div className="flex flex-col gap-4">
              {/* Team 1 */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <TeamLogo logo={match.teams.t1Logo} isImage={match.teams.t1IsImage} shortName={match.teams.t1} />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-zinc-300 leading-tight">{match.teams.t1Name}</span>
                    <span className="text-[9px] text-zinc-600 uppercase tracking-wider">{match.teams.t1}</span>
                  </div>
                </div>
                <span className="text-sm font-black text-zinc-400 shrink-0">{match.score1}</span>
              </div>
              {/* Team 2 */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <TeamLogo logo={match.teams.t2Logo} isImage={match.teams.t2IsImage} shortName={match.teams.t2} />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white leading-tight">{match.teams.t2Name}</span>
                    <span className="text-[9px] text-zinc-600 uppercase tracking-wider">{match.teams.t2}</span>
                  </div>
                </div>
                <span className="text-sm font-black text-lime-400 shrink-0">{match.score2}</span>
              </div>
            </div>

            {/* Win Probability Bar */}
            <div className="bg-[#0e0e16] border border-zinc-900 rounded-xl p-4">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-wider mb-2">
                <span className="text-zinc-400">{match.teams.t1} Win%</span>
                <span className="text-lime-400">{match.teams.t2} Win%</span>
              </div>
              <div className="flex justify-between items-center text-xs font-black mb-1.5">
                <span className="text-zinc-500">{match.winProb1}%</span>
                <span className="text-lime-400">{match.winProb2}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden flex">
                <div className="h-full bg-zinc-600 transition-all duration-700" style={{ width: `${match.winProb1}%` }} />
                <div className="h-full bg-lime-400 transition-all duration-700" style={{ width: `${match.winProb2}%` }} />
              </div>
            </div>
          </div>

          {/* Column 2: Venue & Pitch */}
          <div className="flex flex-col justify-between gap-4 lg:border-r lg:border-zinc-900/80 lg:pr-8">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <MapPin size={12} className="text-lime-400" /> Pitch & Venue Telemetry
            </span>

            <div className="flex flex-col gap-4 my-auto">
              <div>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Stadium / Venue</span>
                <span className="text-sm font-bold text-white mt-1 block leading-snug">{match.venue}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Pitch & Condition Report</span>
                <span className="text-xs text-zinc-400 leading-relaxed mt-1 block">{match.pitch}</span>
              </div>
            </div>

            {/* Status Banner */}
            <div className={`rounded-xl p-3 flex items-center gap-3 border ${
              match.isEnded
                ? "bg-zinc-500/[0.04] border-zinc-500/20"
                : "bg-red-500/[0.04] border-red-500/20"
            }`}>
              {!match.isEnded && (
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
              <p className={`text-[10px] font-bold leading-tight uppercase ${match.isEnded ? "text-zinc-400" : "text-red-400"}`}>
                {match.status}
              </p>
            </div>
          </div>

          {/* Column 3: Live Stats */}
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <Activity size={12} className="text-orange-500" /> Match Stats
            </span>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">At the Crease</span>
                {match.liveBatsmen.map((b, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-[#0a0a0f] border border-zinc-900 rounded-lg p-2.5">
                    <span className="text-xs font-bold text-white truncate max-w-[130px]">
                      {b.name} {idx === 0 && <span className="text-lime-400">*</span>}
                    </span>
                    {b.runs > 0 && (
                      <div className="flex items-center gap-3 text-xs font-bold shrink-0">
                        <span className="text-white">{b.runs} <span className="text-zinc-500 text-[10px]">({b.balls})</span></span>
                        <span className="text-[9px] text-zinc-500">SR {b.sr}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Active Bowler</span>
                <div className="flex justify-between items-center bg-[#0a0a0f] border border-zinc-900 rounded-lg p-2.5">
                  <span className="text-xs font-bold text-zinc-300 truncate max-w-[130px]">{match.liveBowler.name}</span>
                  {match.liveBowler.runs > 0 && (
                    <div className="flex items-center gap-3 text-xs font-bold shrink-0">
                      <span className="text-white">{match.liveBowler.wickets}-{match.liveBowler.runs} <span className="text-zinc-500 text-[10px]">({match.liveBowler.overs})</span></span>
                      <span className="text-[9px] text-zinc-500">Econ {match.liveBowler.econ}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
