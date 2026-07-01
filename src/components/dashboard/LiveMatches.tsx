"use client";

import React, { useState, useEffect } from "react";
import { Activity, MapPin, Loader2, Calendar, Clock } from "lucide-react";

interface LiveMatch {
  id: number;
  name?: string;
  gender?: string;
  isLive?: boolean;
  isEnded?: boolean;
  isUpcoming?: boolean;
  matchType?: string;
  dateStr?: string;
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

function MatchTabButton({ match, isActive, onClick }: { match: LiveMatch; isActive: boolean; onClick: () => void }) {
  const genderLabel = match.gender === "women" ? "W" : "M";
  const stateColor = match.isLive ? "bg-red-500" : match.isUpcoming ? "bg-amber-400" : "bg-zinc-500";

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all border ${
        isActive
          ? "bg-lime-400 text-black border-lime-400"
          : "bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-zinc-200"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${stateColor} ${match.isLive ? "animate-pulse" : ""}`} />
      {match.teams.t1} vs {match.teams.t2}
      <span className={`text-[8px] px-1 py-0.5 rounded border font-black ${
        match.gender === "women"
          ? "bg-pink-500/20 text-pink-400 border-pink-500/30"
          : "bg-sky-500/20 text-sky-400 border-sky-500/30"
      }`}>{genderLabel}</span>
    </button>
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
    const interval = setInterval(fetchLiveMatches, 20000);
    return () => clearInterval(interval);
  }, []);

  if (loading && matches.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-8 rounded-2xl border border-zinc-800/80 bg-zinc-950/30 gap-3 min-h-[200px]">
        <Loader2 className="animate-spin text-lime-400" size={24} />
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Fetching International Matches...</span>
      </div>
    );
  }

  const match = matches[activeMatchIndex] || matches[0];
  if (!match) return null;

  return (
    <div className="w-full flex flex-col gap-6 mb-12">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex h-2.5 w-2.5 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${liveCount > 0 ? "bg-red-500" : "bg-amber-500"}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${liveCount > 0 ? "bg-red-600" : "bg-amber-500"}`}></span>
          </span>
          <h2 className="text-base font-bold text-white tracking-tight uppercase">International Match Center</h2>
          {liveCount > 0 && (
            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border bg-red-500/20 text-red-400 border-red-500/30">
              {liveCount} Live
            </span>
          )}
          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
            source === "live"
              ? "bg-lime-400/10 text-lime-400 border-lime-400/20"
              : source === "real"
              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
              : "bg-purple-500/10 text-purple-400 border-purple-500/20"
          }`}>
            {source === "live" ? "CricAPI Live" : source === "real" ? "CricAPI" : "Simulated"}
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {matches.map((m, idx) => (
            <MatchTabButton key={m.id} match={m} isActive={activeMatchIndex === idx} onClick={() => setActiveMatchIndex(idx)} />
          ))}
        </div>
      </div>

      {/* Match Card */}
      <div className="relative rounded-2xl border border-zinc-800/80 bg-zinc-950/30 p-6 overflow-hidden">
        <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full blur-[120px] opacity-10 bg-lime-400 pointer-events-none" />

        {/* Top-right badges */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {match.gender === "women" && (
            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border bg-pink-500/10 text-pink-400 border-pink-500/20">
              Women's
            </span>
          )}
          {match.gender === "men" && (
            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border bg-sky-500/10 text-sky-400 border-sky-500/20">
              Men's
            </span>
          )}
          {match.matchType && (
            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border bg-zinc-900 text-zinc-500 border-zinc-800">
              {match.matchType}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          {/* Column 1: Scoreboard */}
          <div className="flex flex-col justify-between gap-6 lg:border-r lg:border-zinc-900/80 lg:pr-8">
            <div className="flex flex-col gap-4 mt-6">
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
                <span className={`text-sm font-black shrink-0 ${match.isUpcoming ? "text-zinc-500" : "text-lime-400"}`}>
                  {match.score2}
                </span>
              </div>
            </div>

            {/* Win Probability or Upcoming Countdown */}
            {match.isUpcoming ? (
              <div className="bg-[#0e0e16] border border-zinc-900 rounded-xl p-4 flex items-center gap-3">
                <Calendar size={16} className="text-amber-400 shrink-0" />
                <div>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Scheduled</p>
                  <p className="text-xs font-black text-amber-400 mt-0.5">{match.dateStr || "Date TBC"}</p>
                </div>
              </div>
            ) : (
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
            )}
          </div>

          {/* Column 2: Venue & Status */}
          <div className="flex flex-col justify-between gap-4 lg:border-r lg:border-zinc-900/80 lg:pr-8">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <MapPin size={12} className="text-lime-400" /> Venue & Match Info
            </span>

            <div className="flex flex-col gap-4 my-auto">
              {match.name && (
                <div>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Match</span>
                  <span className="text-xs font-bold text-zinc-300 mt-1 block leading-snug">{match.name}</span>
                </div>
              )}
              <div>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Stadium / Venue</span>
                <span className="text-sm font-bold text-white mt-1 block leading-snug">{match.venue}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Pitch Report</span>
                <span className="text-xs text-zinc-400 leading-relaxed mt-1 block">{match.pitch}</span>
              </div>
            </div>

            {/* Status Banner */}
            <div className={`rounded-xl p-3 flex items-center gap-3 border ${
              match.isLive
                ? "bg-red-500/[0.04] border-red-500/20"
                : match.isUpcoming
                ? "bg-amber-500/[0.04] border-amber-500/20"
                : "bg-zinc-500/[0.04] border-zinc-700/30"
            }`}>
              {match.isLive && (
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
              {match.isUpcoming && <Clock size={10} className="text-amber-400 shrink-0" />}
              <p className={`text-[10px] font-bold leading-tight uppercase ${
                match.isLive ? "text-red-400" : match.isUpcoming ? "text-amber-400" : "text-zinc-400"
              }`}>
                {match.status}
              </p>
            </div>
          </div>

          {/* Column 3: Live Stats or Upcoming Info */}
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <Activity size={12} className="text-orange-500" />
              {match.isUpcoming ? "Match Preview" : "Match Stats"}
            </span>

            {match.isUpcoming ? (
              <div className="flex flex-col gap-3">
                <div className="bg-[#0a0a0f] border border-zinc-900 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <TeamLogo logo={match.teams.t1Logo} isImage={match.teams.t1IsImage} shortName={match.teams.t1} />
                    <span className="text-sm font-bold text-zinc-200">{match.teams.t1Name}</span>
                  </div>
                  <div className="flex items-center justify-center text-zinc-600 font-black text-xs">VS</div>
                  <div className="flex items-center gap-3">
                    <TeamLogo logo={match.teams.t2Logo} isImage={match.teams.t2IsImage} shortName={match.teams.t2} />
                    <span className="text-sm font-bold text-zinc-200">{match.teams.t2Name}</span>
                  </div>
                  {match.dateStr && (
                    <div className="mt-2 pt-2 border-t border-zinc-900 flex items-center gap-2">
                      <Calendar size={11} className="text-amber-400" />
                      <span className="text-[10px] font-bold text-amber-400">{match.dateStr}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">At the Crease</span>
                  {match.liveBatsmen.map((b, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-[#0a0a0f] border border-zinc-900 rounded-lg p-2.5">
                      <span className="text-xs font-bold text-white truncate max-w-[130px]">
                        {b.name} {idx === 0 && b.name !== "–" && <span className="text-lime-400">*</span>}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
