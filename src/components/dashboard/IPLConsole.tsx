"use client";

import React, { useState, useEffect } from "react";
import { Flame, Shield, Award, Users, Activity, Loader2 } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface TeamDetail {
  logo: string;
  name: string;
  color: string; // Tailwind border/text color class
  accent: string; // Tailwind background hover class
  glow: string; // Hex glow color
}

const TEAMS: Record<string, TeamDetail> = {
  CSK: { logo: "CSK", name: "Chennai Super Kings", color: "border-yellow-500 text-yellow-400", accent: "hover:bg-yellow-500/[0.04] bg-yellow-500/[0.02]", glow: "rgba(234,179,8,0.15)" },
  MI: { logo: "MI", name: "Mumbai Indians", color: "border-blue-500 text-blue-400", accent: "hover:bg-blue-500/[0.04] bg-blue-500/[0.02]", glow: "rgba(59,130,246,0.15)" },
  RCB: { logo: "RCB", name: "Royal Challengers Bengaluru", color: "border-red-600 text-red-500", accent: "hover:bg-red-600/[0.04] bg-red-600/[0.02]", glow: "rgba(220,38,38,0.15)" },
  KKR: { logo: "KKR", name: "Kolkata Knight Riders", color: "border-purple-600 text-purple-400", accent: "hover:bg-purple-600/[0.04] bg-purple-600/[0.02]", glow: "rgba(147,51,234,0.15)" },
  RR: { logo: "RR", name: "Rajasthan Royals", color: "border-pink-500 text-pink-400", accent: "hover:bg-pink-500/[0.04] bg-pink-500/[0.02]", glow: "rgba(236,72,153,0.15)" },
  SRH: { logo: "SRH", name: "Sunrisers Hyderabad", color: "border-orange-500 text-orange-400", accent: "hover:bg-orange-500/[0.04] bg-orange-500/[0.02]", glow: "rgba(249,115,22,0.15)" },
  DC: { logo: "DC", name: "Delhi Capitals", color: "border-sky-500 text-sky-400", accent: "hover:bg-sky-500/[0.04] bg-sky-500/[0.02]", glow: "rgba(56,189,248,0.15)" },
  PBKS: { logo: "PBKS", name: "Punjab Kings", color: "border-red-500 text-red-400", accent: "hover:bg-red-500/[0.04] bg-red-500/[0.02]", glow: "rgba(239,68,68,0.15)" },
  GT: { logo: "GT", name: "Gujarat Titans", color: "border-slate-500 text-slate-400", accent: "hover:bg-slate-500/[0.04] bg-slate-500/[0.02]", glow: "rgba(100,116,139,0.15)" },
  LSG: { logo: "LSG", name: "Lucknow Super Giants", color: "border-cyan-500 text-cyan-400", accent: "hover:bg-cyan-500/[0.04] bg-cyan-500/[0.02]", glow: "rgba(6,182,212,0.15)" }
};

interface TeamData {
  matchesPlayed: number;
  wins: number;
  topBatter: {
    player_id: string;
    name: string;
    fullName: string | null;
    imageUrl: string | null;
    runs: number;
  } | null;
  topBowler: {
    player_id: string;
    name: string;
    fullName: string | null;
    imageUrl: string | null;
    wickets: number;
  } | null;
  seasonTrends: Array<{ season: string; count: number }>;
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
      <div className="flex items-center justify-center bg-zinc-900 text-lime-400 font-bold text-xs border border-zinc-800 rounded-full w-full h-full">
        {initials}
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      onError={() => setError(true)}
      className="w-full h-full object-cover animate-fade-in"
    />
  );
}

export default function IPLConsole() {
  const [activeTeam, setActiveTeam] = useState<string>("CSK");
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/ipl-team?teamKey=${activeTeam}`)
      .then((r) => r.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [activeTeam]);

  const teamMeta = TEAMS[activeTeam];
  const winRate = data && data.matchesPlayed > 0 ? Math.round((data.wins / data.matchesPlayed) * 100) : 0;

  return (
    <div className="w-full flex flex-col gap-6 mb-12">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          <Flame size={18} className="text-orange-500 animate-pulse" />
          <h2 className="text-base font-bold text-white tracking-tight uppercase">
            IPL Franchise Intelligence Hub
          </h2>
        </div>
        <span className="text-[10px] font-bold text-zinc-500 tracking-[0.1em] uppercase">
          Dynamic Team Profiles
        </span>
      </div>

      {/* Team Selection Badges Carousel */}
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-zinc-800">
        {Object.entries(TEAMS).map(([key, team]) => {
          const isActive = activeTeam === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTeam(key)}
              style={{
                boxShadow: isActive ? `0 0 15px ${team.glow}` : undefined
              }}
              className={`px-4 py-3 rounded-xl border font-bold text-xs tracking-wider shrink-0 transition-all ${
                isActive
                  ? `${team.color} bg-zinc-950 border-current scale-[1.02]`
                  : `border-zinc-800/80 text-zinc-500 bg-zinc-900/10 hover:text-zinc-300 hover:border-zinc-700`
              }`}
            >
              {team.logo}
            </button>
          );
        })}
      </div>

      {/* Main Content Workspace */}
      <div className="min-h-[350px] relative rounded-2xl border border-zinc-800/80 bg-zinc-900/10 p-6 overflow-hidden">
        {/* Glow backdrop behind details */}
        <div
          className="absolute -top-12 -right-12 w-64 h-64 rounded-full blur-[100px] opacity-10 pointer-events-none transition-all duration-500"
          style={{ backgroundColor: teamMeta.glow }}
        />

        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px] z-20">
            <div className="flex flex-col items-center gap-2 text-zinc-400">
              <Loader2 size={24} className="animate-spin text-lime-400" />
              <span className="text-xs font-semibold tracking-wider uppercase">Loading Squad Roster...</span>
            </div>
          </div>
        ) : null}

        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Column 1: Performance KPIs & Dial */}
            <div className="flex flex-col gap-6">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                  Selected Franchise
                </span>
                <h3 className="text-xl font-black text-white leading-none tracking-tight uppercase">
                  {teamMeta.name}
                </h3>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity size={10} /> Played
                  </span>
                  <span className="text-2xl font-black text-white mt-2">
                    {data.matchesPlayed}
                  </span>
                </div>
                <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield size={10} /> Wins
                  </span>
                  <span className="text-2xl font-black text-white mt-2">
                    {data.wins}
                  </span>
                </div>
              </div>

              {/* Win Rate Progress Bar */}
              <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider mb-2">
                  <span className="text-zinc-500">Calculated Win Rate</span>
                  <span className="text-lime-400">{winRate}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-lime-400 rounded-full transition-all duration-500"
                    style={{ width: `${winRate}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Column 2: Seasonal Match Volume Chart */}
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Seasonal Match Volume
              </span>
              <div className="w-full h-[200px] mt-2 bg-zinc-950/20 rounded-xl border border-zinc-900/60 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.seasonTrends} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="teamGlowGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a3e635" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#a3e635" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#181824" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="season" stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg text-[10px] shadow-2xl">
                              <p className="font-bold text-white mb-0.5">IPL {payload[0].payload.season}</p>
                              <p className="text-lime-400 font-semibold">{payload[0].value} Matches</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#a3e635" strokeWidth={1.5} fill="url(#teamGlowGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Column 3: Team Roster MVP Cricket Cards */}
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Squad MVP Performers
              </span>

              <div className="grid grid-cols-2 gap-4 h-full">
                {/* Top Batter mini-card */}
                {data.topBatter && (
                  <div className="relative overflow-hidden rounded-xl border border-zinc-800/80 bg-gradient-to-b from-[#181824] to-[#08080c] p-4 flex flex-col justify-between shadow-lg group/mvp">
                    <div className="absolute top-1 right-2 text-[8px] font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1">
                      <Flame size={8} /> BAT
                    </div>
                    <div className="w-14 h-14 rounded-full border border-zinc-850 bg-zinc-900 overflow-hidden shrink-0 flex items-center justify-center mx-auto mt-2">
                      <PlayerAvatar imageUrl={data.topBatter.imageUrl} name={data.topBatter.name} />
                    </div>
                    <div className="text-center mt-3">
                      <span className="block text-xs font-black text-white truncate">
                        {data.topBatter.name}
                      </span>
                      <span className="block text-[8px] text-zinc-500 font-semibold uppercase mt-0.5 tracking-wider">
                        Runs Leader
                      </span>
                    </div>
                    <div className="mt-4 pt-2 border-t border-zinc-900 text-center">
                      <span className="text-base font-black text-orange-400">
                        {data.topBatter.runs}
                      </span>
                      <span className="block text-[8px] uppercase tracking-wider text-zinc-500 font-bold">
                        Runs
                      </span>
                    </div>
                  </div>
                )}

                {/* Top Bowler mini-card */}
                {data.topBowler && (
                  <div className="relative overflow-hidden rounded-xl border border-zinc-800/80 bg-gradient-to-b from-[#181824] to-[#08080c] p-4 flex flex-col justify-between shadow-lg group/mvp">
                    <div className="absolute top-1 right-2 text-[8px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                      <Award size={8} /> BOWL
                    </div>
                    <div className="w-14 h-14 rounded-full border border-zinc-850 bg-zinc-900 overflow-hidden shrink-0 flex items-center justify-center mx-auto mt-2">
                      <PlayerAvatar imageUrl={data.topBowler.imageUrl} name={data.topBowler.name} />
                    </div>
                    <div className="text-center mt-3">
                      <span className="block text-xs font-black text-white truncate">
                        {data.topBowler.name}
                      </span>
                      <span className="block text-[8px] text-zinc-500 font-semibold uppercase mt-0.5 tracking-wider">
                        Wkts Leader
                      </span>
                    </div>
                    <div className="mt-4 pt-2 border-t border-zinc-900 text-center">
                      <span className="text-base font-black text-purple-400">
                        {data.topBowler.wickets}
                      </span>
                      <span className="block text-[8px] uppercase tracking-wider text-zinc-500 font-bold">
                        Wkts
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
