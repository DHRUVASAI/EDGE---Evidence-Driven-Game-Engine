"use client";

import React, { useState } from "react";
import { Award, Shield, User, Globe } from "lucide-react";

interface RankingPlayer {
  rank: number;
  name: string;
  country: string;
  rating: number;
}

interface FormatRankings {
  batting: RankingPlayer[];
  bowling: RankingPlayer[];
  allRounder: RankingPlayer[];
}

const RANKINGS_DATA: Record<string, FormatRankings> = {
  T20: {
    batting: [
      { rank: 1, name: "Suryakumar Yadav", country: "IND", rating: 861 },
      { rank: 2, name: "Phil Salt", country: "ENG", rating: 802 },
      { rank: 3, name: "Travis Head", country: "AUS", rating: 785 },
      { rank: 4, name: "Babar Azam", country: "PAK", rating: 763 },
      { rank: 5, name: "Mohammad Rizwan", country: "PAK", rating: 752 },
    ],
    bowling: [
      { rank: 1, name: "Adil Rashid", country: "ENG", rating: 726 },
      { rank: 2, name: "Akeal Hosein", country: "WI", rating: 687 },
      { rank: 3, name: "Rashid Khan", country: "AFG", rating: 679 },
      { rank: 4, name: "Wanindu Hasaranga", country: "SL", rating: 662 },
      { rank: 5, name: "Jasprit Bumrah", country: "IND", rating: 658 },
    ],
    allRounder: [
      { rank: 1, name: "Hardik Pandya", country: "IND", rating: 240 },
      { rank: 2, name: "Marcus Stoinis", country: "AUS", rating: 231 },
      { rank: 3, name: "Sikandar Raza", country: "ZIM", rating: 224 },
      { rank: 4, name: "Shakib Al Hasan", country: "BAN", rating: 218 },
      { rank: 5, name: "Liam Livingstone", country: "ENG", rating: 205 },
    ],
  },
  ODI: {
    batting: [
      { rank: 1, name: "Shubman Gill", country: "IND", rating: 826 },
      { rank: 2, name: "Babar Azam", country: "PAK", rating: 824 },
      { rank: 3, name: "Virat Kohli", country: "IND", rating: 791 },
      { rank: 4, name: "Rohit Sharma", country: "IND", rating: 769 },
      { rank: 5, name: "David Warner", country: "AUS", rating: 745 },
    ],
    bowling: [
      { rank: 1, name: "Keshav Maharaj", country: "SA", rating: 716 },
      { rank: 2, name: "Josh Hazlewood", country: "AUS", rating: 688 },
      { rank: 3, name: "Adam Zampa", country: "AUS", rating: 675 },
      { rank: 4, name: "Mohammed Siraj", country: "IND", rating: 661 },
      { rank: 5, name: "Jasprit Bumrah", country: "IND", rating: 654 },
    ],
    allRounder: [
      { rank: 1, name: "Mohammad Nabi", country: "AFG", rating: 320 },
      { rank: 2, name: "Shakib Al Hasan", country: "BAN", rating: 310 },
      { rank: 3, name: "Sikandar Raza", country: "ZIM", rating: 288 },
      { rank: 4, name: "Rashid Khan", country: "AFG", rating: 265 },
      { rank: 5, name: "Glenn Maxwell", country: "AUS", rating: 250 },
    ],
  },
  Test: {
    batting: [
      { rank: 1, name: "Kane Williamson", country: "NZ", rating: 859 },
      { rank: 2, name: "Joe Root", country: "ENG", rating: 824 },
      { rank: 3, name: "Daryl Mitchell", country: "NZ", rating: 768 },
      { rank: 4, name: "Steve Smith", country: "AUS", rating: 757 },
      { rank: 5, name: "Yashasvi Jaiswal", country: "IND", rating: 740 },
    ],
    bowling: [
      { rank: 1, name: "Jasprit Bumrah", country: "IND", rating: 870 },
      { rank: 2, name: "Ravichandran Ashwin", country: "IND", rating: 840 },
      { rank: 3, name: "Josh Hazlewood", country: "AUS", rating: 822 },
      { rank: 4, name: "Pat Cummins", country: "AUS", rating: 811 },
      { rank: 5, name: "Kagiso Rabada", country: "SA", rating: 785 },
    ],
    allRounder: [
      { rank: 1, name: "Ravindra Jadeja", country: "IND", rating: 455 },
      { rank: 2, name: "Ravichandran Ashwin", country: "IND", rating: 340 },
      { rank: 3, name: "Shakib Al Hasan", country: "BAN", rating: 310 },
      { rank: 4, name: "Axar Patel", country: "IND", rating: 285 },
      { rank: 5, name: "Jason Holder", country: "WI", rating: 264 },
    ],
  },
};

export default function ICCRankings() {
  const [format, setFormat] = useState<string>("T20");
  const data = RANKINGS_DATA[format];

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case 2:
        return "bg-zinc-400/10 text-zinc-300 border-zinc-400/20";
      case 3:
        return "bg-amber-600/10 text-amber-500 border-amber-600/20";
      default:
        return "bg-zinc-800/40 text-zinc-500 border-zinc-800/50";
    }
  };

  const renderColumn = (title: string, icon: React.ReactNode, list: RankingPlayer[]) => (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/10 p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2 border-b border-zinc-800/50 pb-3">
        {icon}
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">{title}</h3>
      </div>
      <div className="flex flex-col gap-2.5">
        {list.map((p) => (
          <div
            key={p.rank}
            className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-800/30 bg-zinc-900/20 hover:border-zinc-800/80 transition-all group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`w-5.5 h-5.5 rounded flex items-center justify-center text-[10px] font-extrabold border shrink-0 ${getRankColor(
                  p.rank
                )}`}
              >
                {p.rank}
              </span>
              <div className="min-w-0">
                <span className="block text-xs font-bold text-zinc-100 group-hover:text-white truncate transition-colors">
                  {p.name}
                </span>
                <span className="block text-[9px] font-semibold text-zinc-500 mt-0.5 tracking-wider">
                  {p.country}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-extrabold text-lime-400 bg-lime-400/[0.03] border border-lime-400/10 px-2 py-1 rounded">
              {p.rating} pts
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full flex flex-col gap-6 mb-8">
      {/* Title & Format Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          <Globe size={18} className="text-lime-400" />
          <h2 className="text-base font-bold text-white tracking-tight uppercase">
            Official ICC Player Rankings
          </h2>
        </div>
        <div className="flex bg-zinc-900/60 p-1 border border-zinc-800 rounded-lg self-start sm:self-auto">
          {["T20", "ODI", "Test"].map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`px-3 py-1 rounded-[6px] text-xs font-semibold uppercase tracking-wider transition-all ${
                format === f
                  ? "bg-lime-400 text-black font-bold shadow-[0_0_15px_rgba(163,230,53,0.15)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderColumn(
          "Top Batsmen",
          <User size={14} className="text-yellow-500" />,
          data.batting
        )}
        {renderColumn(
          "Top Bowlers",
          <Award size={14} className="text-lime-400" />,
          data.bowling
        )}
        {renderColumn(
          "Top All-Rounders",
          <Shield size={14} className="text-blue-400" />,
          data.allRounder
        )}
      </div>
    </div>
  );
}
