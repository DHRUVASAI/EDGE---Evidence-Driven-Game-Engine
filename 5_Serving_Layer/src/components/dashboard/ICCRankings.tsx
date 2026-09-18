"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { Award, Shield, Globe } from "lucide-react";

interface RankingPlayer {
  rank: number;
  name: string;
  country: string;
  rating: number;
  imageUrl?: string;
}

interface FormatRankings {
  batting: RankingPlayer[];
  bowling: RankingPlayer[];
  allRounder: RankingPlayer[];
  source?: string;
  updatedAt?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const RANKINGS_DATA: Record<string, FormatRankings> = {
  T20: {
    batting: [
      { rank: 1, name: "Suryakumar Yadav", country: "IND", rating: 861, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/446507.png" },
      { rank: 2, name: "Phil Salt", country: "ENG", rating: 802, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/685977.png" },
      { rank: 3, name: "Travis Head", country: "AUS", rating: 785, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/530011.png" },
      { rank: 4, name: "Babar Azam", country: "PAK", rating: 763, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/348144.png" },
      { rank: 5, name: "Mohammad Rizwan", country: "PAK", rating: 752, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/453670.png" },
    ],
    bowling: [
      { rank: 1, name: "Adil Rashid", country: "ENG", rating: 726, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/30176.png" },
      { rank: 2, name: "Akeal Hosein", country: "WI", rating: 687, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/850057.png" },
      { rank: 3, name: "Rashid Khan", country: "AFG", rating: 679, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/793463.png" },
      { rank: 4, name: "Wanindu Hasaranga", country: "SL", rating: 662, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/768661.png" },
      { rank: 5, name: "Jasprit Bumrah", country: "IND", rating: 658, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/625383.png" },
    ],
    allRounder: [
      { rank: 1, name: "Hardik Pandya", country: "IND", rating: 240, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/625371.png" },
      { rank: 2, name: "Marcus Stoinis", country: "AUS", rating: 231, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/311520.png" },
      { rank: 3, name: "Sikandar Raza", country: "ZIM", rating: 224, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/299572.png" },
      { rank: 4, name: "Shakib Al Hasan", country: "BAN", rating: 218, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/56143.png" },
      { rank: 5, name: "Liam Livingstone", country: "ENG", rating: 205, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/460042.png" },
    ],
  },
  ODI: {
    batting: [
      { rank: 1, name: "Shubman Gill", country: "IND", rating: 826, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/1216676.png" },
      { rank: 2, name: "Babar Azam", country: "PAK", rating: 824, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/348144.png" },
      { rank: 3, name: "Virat Kohli", country: "IND", rating: 791, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/253802.png" },
      { rank: 4, name: "Rohit Sharma", country: "IND", rating: 769, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/34102.png" },
      { rank: 5, name: "David Warner", country: "AUS", rating: 745, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/219889.png" },
    ],
    bowling: [
      { rank: 1, name: "Keshav Maharaj", country: "SA", rating: 716, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/370146.png" },
      { rank: 2, name: "Josh Hazlewood", country: "AUS", rating: 688, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/288284.png" },
      { rank: 3, name: "Adam Zampa", country: "AUS", rating: 675, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/296113.png" },
      { rank: 4, name: "Mohammed Siraj", country: "IND", rating: 661, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/940973.png" },
      { rank: 5, name: "Jasprit Bumrah", country: "IND", rating: 654, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/625383.png" },
    ],
    allRounder: [
      { rank: 1, name: "Mohammad Nabi", country: "AFG", rating: 320, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/311427.png" },
      { rank: 2, name: "Shakib Al Hasan", country: "BAN", rating: 310, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/56143.png" },
      { rank: 3, name: "Sikandar Raza", country: "ZIM", rating: 288, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/299572.png" },
      { rank: 4, name: "Rashid Khan", country: "AFG", rating: 265, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/793463.png" },
      { rank: 5, name: "Glenn Maxwell", country: "AUS", rating: 250, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/325026.png" },
    ],
  },
  Test: {
    batting: [
      { rank: 1, name: "Kane Williamson", country: "NZ", rating: 859, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/277906.png" },
      { rank: 2, name: "Joe Root", country: "ENG", rating: 824, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/303669.png" },
      { rank: 3, name: "Daryl Mitchell", country: "NZ", rating: 768, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/388802.png" },
      { rank: 4, name: "Steve Smith", country: "AUS", rating: 757, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/267192.png" },
      { rank: 5, name: "Yashasvi Jaiswal", country: "IND", rating: 740, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/1070108.png" },
    ],
    bowling: [
      { rank: 1, name: "Jasprit Bumrah", country: "IND", rating: 870, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/625383.png" },
      { rank: 2, name: "Ravichandran Ashwin", country: "IND", rating: 840, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/26421.png" },
      { rank: 3, name: "Josh Hazlewood", country: "AUS", rating: 822, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/288284.png" },
      { rank: 4, name: "Pat Cummins", country: "AUS", rating: 811, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/272450.png" },
      { rank: 5, name: "Kagiso Rabada", country: "SA", rating: 785, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/388727.png" },
    ],
    allRounder: [
      { rank: 1, name: "Ravindra Jadeja", country: "IND", rating: 455, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/234675.png" },
      { rank: 2, name: "Ravichandran Ashwin", country: "IND", rating: 340, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/26421.png" },
      { rank: 3, name: "Shakib Al Hasan", country: "BAN", rating: 310, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/56143.png" },
      { rank: 4, name: "Axar Patel", country: "IND", rating: 285, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/554691.png" },
      { rank: 5, name: "Jason Holder", country: "WI", rating: 264, imageUrl: "https://a.espncdn.com/i/headshots/cricket/players/full/227750.png" },
    ],
  },
};

function PlayerAvatar({ name, imageUrl }: { name: string; imageUrl?: string }) {
  const imgSrc = imageUrl || `/api/player-image?name=${encodeURIComponent(name)}`;
  return (
    <img
      src={imgSrc}
      alt={name}
      className="w-8 h-8 rounded-full object-cover border border-zinc-800/60 shrink-0 bg-zinc-800"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = `/api/player-image?name=${encodeURIComponent(name)}`;
      }}
    />
  );
}

export default function ICCRankings() {
  const [format, setFormat] = useState<string>("T20");
  const { data: liveData, isLoading } = useSWR<FormatRankings>(
    `/api/icc-rankings?format=${format}`,
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 30 * 60 * 1000,
    }
  );
  const data = liveData || RANKINGS_DATA[format];

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
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/10 p-5 flex flex-col gap-4 hover:border-zinc-700/80 transition-all duration-300">
      <div className="flex items-center gap-2 border-b border-zinc-800/50 pb-3">
        {icon}
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">{title}</h3>
      </div>
      <div className="flex flex-col gap-2.5">
        {list.map((p) => (
          <div
            key={p.rank}
            className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-800/30 bg-zinc-900/20 hover:border-zinc-700/60 hover:bg-zinc-900/40 transition-all group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`w-5.5 h-5.5 rounded flex items-center justify-center text-[10px] font-extrabold border shrink-0 ${getRankColor(
                  p.rank
                )}`}
              >
                {p.rank}
              </span>
              <PlayerAvatar name={p.name} imageUrl={p.imageUrl} />
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
    <div className="w-full flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          <Globe size={18} className="text-lime-400" />
          <div>
            <h2 className="text-base font-bold text-white tracking-tight uppercase">
              Official ICC Player Rankings
            </h2>
            {data?.updatedAt && (
              <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wider">
                {data.source === "icc-live" ? (
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse" />
                    Live ICC feed
                  </span>
                ) : (
                  "Fallback rankings"
                )} · Updated {new Date(data.updatedAt).toLocaleString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            )}
          </div>
        </div>
        <div className="flex bg-zinc-900/60 p-1 border border-zinc-800 rounded-lg self-start sm:self-auto">
          {["T20", "ODI", "Test"].map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              disabled={isLoading}
              className={`px-3 py-1 rounded-[6px] text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 ${
                format === f
                  ? "bg-lime-400 text-black font-bold shadow-[0_0_15px_rgba(163,230,53,0.15)]"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 rounded-xl border border-zinc-800/80 bg-zinc-900/10 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderColumn(
            "Top Batsmen",
            <Shield size={14} className="text-yellow-500" />,
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
      )}
    </div>
  );
}
