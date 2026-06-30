"use client";

import React from "react";
import Link from "next/link";
import { PlayCircle, Search, ArrowRight, Zap, Users } from "lucide-react";

export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
      {/* Simulation engine action card */}
      <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900/40 via-zinc-900/10 to-transparent p-8 hover:border-lime-500/30 transition-all duration-300 group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-lime-400/[0.01] rounded-full blur-2xl group-hover:bg-lime-400/[0.03] transition-all" />
        
        <div className="flex items-start gap-4">
          <div className="p-3 bg-lime-400/[0.06] text-lime-400 border border-lime-400/10 rounded-lg">
            <Zap size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Match Simulator Engine
            </h3>
            <p className="text-sm text-zinc-400 mt-2 leading-relaxed max-w-md">
              Run predictive simulations on custom game situations. Input targets, wickets, and overs to calculate instant win probabilities and receive optimal batting/bowling combinations.
            </p>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-lime-400 hover:bg-lime-300 text-[#0a0a0f] font-semibold text-xs rounded-lg transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(163,230,53,0.15)]"
            >
              Launch Simulator
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Player Search action card */}
      <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900/40 via-zinc-900/10 to-transparent p-8 hover:border-lime-500/30 transition-all duration-300 group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-lime-400/[0.01] rounded-full blur-2xl group-hover:bg-lime-400/[0.03] transition-all" />
        
        <div className="flex items-start gap-4">
          <div className="p-3 bg-lime-400/[0.06] text-lime-400 border border-lime-400/10 rounded-lg">
            <Users size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Player Performance Index
            </h3>
            <p className="text-sm text-zinc-400 mt-2 leading-relaxed max-w-md">
              Access comprehensive career data for over 11,000 players. Compare stats across T20, ODI, TEST, and IPL formats, and run side-by-side head-to-head performance evaluations.
            </p>
            <Link
              href="/players"
              className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 border border-zinc-700 hover:border-zinc-500 text-zinc-200 hover:text-white bg-zinc-900/20 font-semibold text-xs rounded-lg transition-all hover:scale-[1.02]"
            >
              Search & Compare
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
