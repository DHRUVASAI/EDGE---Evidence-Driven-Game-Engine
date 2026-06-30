"use client";

import React, { useState, useEffect } from "react";
import { Zap, Flame, Award } from "lucide-react";

interface IPLPlayer {
  id: string;
  name: string;
  fullName: string | null;
  imageUrl: string | null;
  country: string | null;
  role: string | null;
  totalRuns?: number;
  totalWickets?: number;
}

interface IPLConsoleProps {
  orangeCap: IPLPlayer[];
  purpleCap: IPLPlayer[];
  mostSixesIPL: {
    playerName: string;
    totalSixes: number;
    imageUrl: string | null;
  } | null;
}

function getInitials(name: string): string {
  if (!name) return "";
  const words = name.trim().split(/\s+/);
  return words
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);
}

function PlayerAvatar({ imageUrl, name }: { imageUrl: string | null; name: string }) {
  const [error, setError] = useState(false);
  const initials = getInitials(name);

  useEffect(() => {
    setError(false);
  }, [imageUrl]);

  if (!imageUrl || error) {
    return (
      <div className="flex items-center justify-center bg-orange-400/[0.06] text-orange-400 font-bold text-xs border border-orange-400/10 rounded-full w-full h-full">
        {initials}
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      onError={() => setError(true)}
      className="w-full h-full object-cover"
    />
  );
}

export default function IPLConsole({ orangeCap, purpleCap, mostSixesIPL }: IPLConsoleProps) {
  return (
    <div className="w-full flex flex-col gap-6 mb-8">
      {/* Title block */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
        <Flame size={18} className="text-orange-500" />
        <h2 className="text-base font-bold text-white tracking-tight uppercase">
          IPL Analytics Dashboard
        </h2>
      </div>

      {/* Grid containing Caps and Record */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orange Cap (Most Runs) */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/10 p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-zinc-800/50 pb-3">
            <div className="flex items-center gap-2">
              <Award size={15} className="text-orange-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400">
                Orange Cap Leaderboard
              </h3>
            </div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Runs</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {orangeCap.map((p, idx) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-800/30 bg-zinc-900/20 hover:border-orange-500/20 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[10px] font-extrabold text-zinc-500 shrink-0">#{idx + 1}</span>
                  <div className="w-7 h-7 rounded-full overflow-hidden border border-zinc-850 shrink-0 flex items-center justify-center">
                    <PlayerAvatar imageUrl={p.imageUrl} name={p.name} />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-zinc-200 group-hover:text-white truncate transition-colors">
                      {p.fullName || p.name}
                    </span>
                    <span className="block text-[8px] font-semibold text-zinc-650 tracking-wider">
                      {p.role || "Batsman"}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold text-orange-400 bg-orange-400/[0.04] border border-orange-400/10 px-2 py-1 rounded">
                  {p.totalRuns?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Purple Cap (Most Wickets) */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/10 p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-zinc-800/50 pb-3">
            <div className="flex items-center gap-2">
              <Award size={15} className="text-purple-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Purple Cap Leaderboard
              </h3>
            </div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Wickets</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {purpleCap.map((p, idx) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-800/30 bg-zinc-900/20 hover:border-purple-500/20 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[10px] font-extrabold text-zinc-500 shrink-0">#{idx + 1}</span>
                  <div className="w-7 h-7 rounded-full overflow-hidden border border-zinc-850 shrink-0 flex items-center justify-center">
                    <PlayerAvatar imageUrl={p.imageUrl} name={p.name} />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-zinc-200 group-hover:text-white truncate transition-colors">
                      {p.fullName || p.name}
                    </span>
                    <span className="block text-[8px] font-semibold text-zinc-650 tracking-wider">
                      {p.role || "Bowler"}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold text-purple-400 bg-purple-400/[0.04] border border-purple-400/10 px-2 py-1 rounded">
                  {p.totalWickets?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* IPL Sixes Record Card */}
        {mostSixesIPL && (
          <div className="relative overflow-hidden rounded-xl border border-orange-500/15 bg-gradient-to-br from-orange-500/[0.03] to-purple-500/[0.01] p-6 flex flex-col justify-between group">
            {/* Glow circle overlay */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/[0.02] rounded-full blur-2xl group-hover:bg-orange-400/[0.04] transition-all" />

            <div>
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                <Zap size={12} />
                IPL Records
              </span>
              <h3 className="text-base font-extrabold text-white leading-tight">
                Most Sixes in IPL History
              </h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Database aggregate of sixes hit by batsmen in IPL matches.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-orange-500/20 shrink-0 flex items-center justify-center bg-zinc-900">
                <PlayerAvatar imageUrl={mostSixesIPL.imageUrl} name={mostSixesIPL.playerName} />
              </div>
              <div>
                <span className="block text-sm font-extrabold text-white">
                  {mostSixesIPL.playerName}
                </span>
                <span className="block text-[10px] text-zinc-500 font-semibold tracking-wide mt-0.5">
                  Record Holder
                </span>
              </div>
              <div className="ml-auto flex flex-col items-end">
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                  {mostSixesIPL.totalSixes}
                </span>
                <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500">
                  Sixes
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
