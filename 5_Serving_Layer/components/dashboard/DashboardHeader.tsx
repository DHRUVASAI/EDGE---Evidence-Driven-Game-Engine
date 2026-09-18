"use client";

import React from "react";
import { Play, Activity, Database, Users, Calendar } from "lucide-react";

interface FormatCount {
  format: string;
  count: number;
}

interface DashboardHeaderProps {
  totalDeliveries: number;
  totalPlayers: number;
  matchesPerFormat: FormatCount[];
}

export default function DashboardHeader({
  totalDeliveries,
  totalPlayers,
  matchesPerFormat,
}: DashboardHeaderProps) {
  const totalMatches = matchesPerFormat.reduce((acc, curr) => acc + curr.count, 0);

  const getFormatPercentage = (format: string) => {
    if (totalMatches === 0) return "0%";
    const found = matchesPerFormat.find((m) => m.format === format);
    if (!found) return "0%";
    return `${Math.round((found.count / totalMatches) * 100)}%`;
  };

  const replayIntro = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("play_intro"));
    }
  };

  return (
    <div className="w-full flex flex-col gap-8 mb-8">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-[0.25em] text-lime-400 uppercase">
            System Console
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mt-1">
            EDGE ANALYTICS STUDIO
          </h1>
        </div>
        <button
          onClick={replayIntro}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 rounded-[8px] transition-all hover:scale-[1.02] shrink-0"
        >
          <Play size={14} className="fill-current text-lime-400" />
          Replay Intro Sequence
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Matches Card */}
        <div className="relative overflow-hidden rounded-xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900/60 to-zinc-950/40 p-6 transition-all duration-300 hover:scale-[1.02] hover:border-lime-500/30 hover:shadow-[0_0_30px_rgba(163,230,53,0.08)] group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-lime-400/[0.02] rounded-full blur-2xl translate-x-6 -translate-y-6 group-hover:bg-lime-400/[0.06] transition-all duration-500" />
          <div className="relative flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={14} className="text-zinc-600 group-hover:text-lime-500/70 transition-colors" />
                Matches Analyzed
              </span>
              <span className="block text-3xl font-extrabold text-white mt-3 tracking-tight group-hover:text-lime-50 transition-colors">
                {totalMatches.toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 group-hover:border-zinc-700 group-hover:bg-zinc-800/80 transition-all">
              <Database size={18} />
            </div>
          </div>
          <div className="relative mt-6 pt-4 border-t border-zinc-850 flex items-center justify-between gap-2 text-[10px] font-semibold text-zinc-500">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-400 group-hover:shadow-[0_0_6px_rgba(163,230,53,0.6)] transition-shadow" />
              T20: {getFormatPercentage("T20")}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 group-hover:shadow-[0_0_6px_rgba(96,165,250,0.6)] transition-shadow" />
              ODI: {getFormatPercentage("ODI")}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 group-hover:shadow-[0_0_6px_rgba(251,146,60,0.6)] transition-shadow" />
              TEST: {getFormatPercentage("TEST")}
            </span>
          </div>
        </div>

        {/* Total Deliveries Card */}
        <div className="relative overflow-hidden rounded-xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900/60 to-zinc-950/40 p-6 transition-all duration-300 hover:scale-[1.02] hover:border-lime-500/30 hover:shadow-[0_0_30px_rgba(163,230,53,0.08)] group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-lime-400/[0.02] rounded-full blur-2xl translate-x-6 -translate-y-6 group-hover:bg-lime-400/[0.06] transition-all duration-500" />
          <div className="relative flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Activity size={14} className="text-zinc-600 group-hover:text-lime-500/70 transition-colors" />
                Ball-By-Ball Events
              </span>
              <span className="block text-3xl font-extrabold text-white mt-3 tracking-tight group-hover:text-lime-50 transition-colors">
                {totalDeliveries.toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 group-hover:border-zinc-700 group-hover:bg-zinc-800/80 transition-all">
              <Activity size={18} />
            </div>
          </div>
          <div className="relative mt-6 pt-4 border-t border-zinc-850 flex items-center justify-between text-[10px] font-semibold text-zinc-500">
            <span>Granular delivery database</span>
            <span className="text-lime-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-ping" />
              Realtime Index
            </span>
          </div>
        </div>

        {/* Total Players Card */}
        <div className="relative overflow-hidden rounded-xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900/60 to-zinc-950/40 p-6 transition-all duration-300 hover:scale-[1.02] hover:border-lime-500/30 hover:shadow-[0_0_30px_rgba(163,230,53,0.08)] group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-lime-400/[0.02] rounded-full blur-2xl translate-x-6 -translate-y-6 group-hover:bg-lime-400/[0.06] transition-all duration-500" />
          <div className="relative flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Users size={14} className="text-zinc-600 group-hover:text-lime-500/70 transition-colors" />
                Player Profiles
              </span>
              <span className="block text-3xl font-extrabold text-white mt-3 tracking-tight group-hover:text-lime-50 transition-colors">
                {totalPlayers.toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 group-hover:border-zinc-700 group-hover:bg-zinc-800/80 transition-all">
              <Users size={18} />
            </div>
          </div>
          <div className="relative mt-6 pt-4 border-t border-zinc-850 flex items-center justify-between text-[10px] font-semibold text-zinc-500">
            <span>Career history aggregated</span>
            <span className="text-zinc-400 group-hover:text-lime-400/60 transition-colors">Enhanced with Cricinfo API</span>
          </div>
        </div>
      </div>
    </div>
  );
}
