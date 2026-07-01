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
        <div className="relative overflow-hidden rounded-xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900/60 to-zinc-950/40 p-6 transition-all hover:scale-[1.01] hover:border-lime-500/20 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-lime-400/[0.02] rounded-full blur-xl translate-x-4 -translate-y-4 group-hover:bg-lime-400/[0.04] transition-all" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={14} className="text-zinc-600" />
                Matches Analyzed
              </span>
              <span className="block text-3xl font-extrabold text-white mt-3 tracking-tight">
                {totalMatches.toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400">
              <Database size={18} />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-zinc-850 flex items-center justify-between gap-2 text-[10px] font-semibold text-zinc-500">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />
              T20: {getFormatPercentage("T20")}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              ODI: {getFormatPercentage("ODI")}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              TEST: {getFormatPercentage("TEST")}
            </span>
          </div>
        </div>

        {/* Total Deliveries Card */}
        <div className="relative overflow-hidden rounded-xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900/60 to-zinc-950/40 p-6 transition-all hover:scale-[1.01] hover:border-lime-500/20 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-lime-400/[0.02] rounded-full blur-xl translate-x-4 -translate-y-4 group-hover:bg-lime-400/[0.04] transition-all" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Activity size={14} className="text-zinc-600" />
                Ball-By-Ball Events
              </span>
              <span className="block text-3xl font-extrabold text-white mt-3 tracking-tight">
                {totalDeliveries.toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400">
              <Activity size={18} />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-zinc-850 flex items-center justify-between text-[10px] font-semibold text-zinc-500">
            <span>Granular delivery database</span>
            <span className="text-lime-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-ping" />
              Realtime Index
            </span>
          </div>
        </div>

        {/* Total Players Card */}
        <div className="relative overflow-hidden rounded-xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900/60 to-zinc-950/40 p-6 transition-all hover:scale-[1.01] hover:border-lime-500/20 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-lime-400/[0.02] rounded-full blur-xl translate-x-4 -translate-y-4 group-hover:bg-lime-400/[0.04] transition-all" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Users size={14} className="text-zinc-600" />
                Player Profiles
              </span>
              <span className="block text-3xl font-extrabold text-white mt-3 tracking-tight">
                {totalPlayers.toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-zinc-850 flex items-center justify-between text-[10px] font-semibold text-zinc-500">
            <span>Career history aggregated</span>
            <span className="text-zinc-400">4,104 photos mapped</span>
          </div>
        </div>
      </div>
    </div>
  );
}
