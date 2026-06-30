"use client";

import React, { useState, useEffect } from "react";
import { Trophy, Award } from "lucide-react";

interface LeaderboardPlayer {
  id: string;
  name: string;
  fullName: string | null;
  imageUrl: string | null;
  country: string | null;
  role: string | null;
  totalRuns?: number;
  totalWickets?: number;
}

interface LeaderboardTablesProps {
  battingLeaderboard: LeaderboardPlayer[];
  bowlingLeaderboard: LeaderboardPlayer[];
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
      <div className="flex items-center justify-center bg-lime-400/[0.06] text-lime-400 font-bold text-xs border border-lime-400/10 rounded-full w-full h-full">
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

export default function LeaderboardTables({
  battingLeaderboard,
  bowlingLeaderboard,
}: LeaderboardTablesProps) {
  const getRankBadgeColor = (index: number) => {
    switch (index) {
      case 0:
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case 1:
        return "bg-zinc-400/10 text-zinc-300 border-zinc-400/20";
      case 2:
        return "bg-amber-600/10 text-amber-500 border-amber-600/20";
      default:
        return "bg-zinc-800/40 text-zinc-500 border-zinc-800/60";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* Batting Leaderboard */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-yellow-500" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Batting Leaderboard (All Formats)
            </h2>
          </div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            Total Runs
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {battingLeaderboard.map((p, idx) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-3 rounded-lg border border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Rank */}
                <span
                  className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border ${getRankBadgeColor(
                    idx
                  )}`}
                >
                  {idx + 1}
                </span>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full overflow-hidden border border-zinc-800 shrink-0 flex items-center justify-center">
                  <PlayerAvatar imageUrl={p.imageUrl} name={p.name} />
                </div>

                {/* Name & Country */}
                <div className="min-w-0">
                  <span className="block text-sm font-bold text-zinc-200 truncate group-hover:text-white transition-colors">
                    {p.fullName || p.name}
                  </span>
                  <span className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mt-0.5">
                    {p.country || "International"} • {p.role || "Batsman"}
                  </span>
                </div>
              </div>

              {/* Value */}
              <span className="text-sm font-extrabold text-white bg-zinc-900 border border-zinc-800/80 px-3 py-1.5 rounded-[6px]">
                {p.totalRuns?.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bowling Leaderboard */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Award size={16} className="text-lime-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Bowling Leaderboard (All Formats)
            </h2>
          </div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            Total Wickets
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {bowlingLeaderboard.map((p, idx) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-3 rounded-lg border border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Rank */}
                <span
                  className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border ${getRankBadgeColor(
                    idx
                  )}`}
                >
                  {idx + 1}
                </span>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full overflow-hidden border border-zinc-800 shrink-0 flex items-center justify-center">
                  <PlayerAvatar imageUrl={p.imageUrl} name={p.name} />
                </div>

                {/* Name & Country */}
                <div className="min-w-0">
                  <span className="block text-sm font-bold text-zinc-200 truncate group-hover:text-white transition-colors">
                    {p.fullName || p.name}
                  </span>
                  <span className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mt-0.5">
                    {p.country || "International"} • {p.role || "Bowler"}
                  </span>
                </div>
              </div>

              {/* Value */}
              <span className="text-sm font-extrabold text-white bg-zinc-900 border border-zinc-800/80 px-3 py-1.5 rounded-[6px]">
                {p.totalWickets?.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
