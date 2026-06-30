"use client";

import React, { useState, useEffect } from "react";
import { Flame, Shield, Award, Activity, Loader2, Trophy } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface TeamDetail {
  logo: string;
  name: string;
  gradient: string; // Active background gradient
  borderActive: string;
  textActive: string;
  borderInactive: string;
  textInactive: string;
  glow: string;
  colorName: string; // Theme label for charts
}

const TEAMS: Record<string, TeamDetail> = {
  CSK: { logo: "CSK", name: "Chennai Super Kings", gradient: "from-yellow-500 to-amber-500 text-black", borderActive: "border-yellow-400", textActive: "text-yellow-400", borderInactive: "border-yellow-500/20 hover:border-yellow-500/40", textInactive: "text-yellow-500/50 hover:text-yellow-400", glow: "rgba(234,179,8,0.25)", colorName: "#eab308" },
  MI: { logo: "MI", name: "Mumbai Indians", gradient: "from-blue-600 to-sky-500 text-white", borderActive: "border-blue-400", textActive: "text-blue-400", borderInactive: "border-blue-500/20 hover:border-blue-500/40", textInactive: "text-blue-500/50 hover:text-blue-400", glow: "rgba(59,130,246,0.25)", colorName: "#3b82f6" },
  RCB: { logo: "RCB", name: "Royal Challengers Bengaluru", gradient: "from-red-700 to-zinc-800 text-white", borderActive: "border-red-500", textActive: "text-red-500", borderInactive: "border-red-650/20 hover:border-red-650/40", textInactive: "text-red-650/50 hover:text-red-500", glow: "rgba(220,38,38,0.25)", colorName: "#dc2626" },
  KKR: { logo: "KKR", name: "Kolkata Knight Riders", gradient: "from-purple-700 to-indigo-650 text-white", borderActive: "border-purple-400", textActive: "text-purple-400", borderInactive: "border-purple-650/20 hover:border-purple-650/40", textInactive: "text-purple-650/50 hover:text-purple-400", glow: "rgba(147,51,234,0.25)", colorName: "#a855f7" },
  RR: { logo: "RR", name: "Rajasthan Royals", gradient: "from-pink-600 to-blue-600 text-white", borderActive: "border-pink-400", textActive: "text-pink-400", borderInactive: "border-pink-500/20 hover:border-pink-500/40", textInactive: "text-pink-500/50 hover:text-pink-400", glow: "rgba(236,72,153,0.25)", colorName: "#ec4899" },
  SRH: { logo: "SRH", name: "Sunrisers Hyderabad", gradient: "from-orange-500 to-red-500 text-white", borderActive: "border-orange-400", textActive: "text-orange-400", borderInactive: "border-orange-500/20 hover:border-orange-500/40", textInactive: "text-orange-500/50 hover:text-orange-400", glow: "rgba(249,115,22,0.25)", colorName: "#f97316" },
  DC: { logo: "DC", name: "Delhi Capitals", gradient: "from-sky-600 to-blue-800 text-white", borderActive: "border-sky-400", textActive: "text-sky-400", borderInactive: "border-sky-500/20 hover:border-sky-500/40", textInactive: "text-sky-500/50 hover:text-sky-400", glow: "rgba(56,189,248,0.25)", colorName: "#38bdf8" },
  PBKS: { logo: "PBKS", name: "Punjab Kings", gradient: "from-red-650 to-zinc-400 text-white", borderActive: "border-red-400", textActive: "text-red-400", borderInactive: "border-red-500/20 hover:border-red-500/40", textInactive: "text-red-500/50 hover:text-red-400", glow: "rgba(239,68,68,0.25)", colorName: "#ef4444" },
  GT: { logo: "GT", name: "Gujarat Titans", gradient: "from-slate-700 to-zinc-800 text-white", borderActive: "border-slate-400", textActive: "text-slate-400", borderInactive: "border-slate-500/20 hover:border-slate-500/40", textInactive: "text-slate-500/50 hover:text-slate-400", glow: "rgba(100,116,139,0.25)", colorName: "#64748b" },
  LSG: { logo: "LSG", name: "Lucknow Super Giants", gradient: "from-cyan-600 to-indigo-950 text-white", borderActive: "border-cyan-400", textActive: "text-cyan-400", borderInactive: "border-cyan-500/20 hover:border-cyan-500/40", textInactive: "text-cyan-500/50 hover:text-cyan-400", glow: "rgba(6,182,212,0.25)", colorName: "#06b6d4" }
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

function PlayerAvatar({ imageUrl, name, colorTheme }: { imageUrl: string | null; name: string; colorTheme: string }) {
  const [error, setError] = useState(false);
  const initials = getInitials(name);

  useEffect(() => {
    setError(false);
  }, [imageUrl]);

  if (!imageUrl || error) {
    return (
      <div
        style={{ color: colorTheme, borderColor: `${colorTheme}15`, backgroundColor: `${colorTheme}05` }}
        className="flex items-center justify-center font-black text-xs border rounded-full w-full h-full"
      >
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

  // Circular progress ring parameters
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (winRate / 100) * circumference;

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

      {/* Team Selection Badges Carousel (Redesigned) */}
      <div className="flex gap-3 overflow-x-auto py-2 pb-3 scrollbar-thin scrollbar-thumb-zinc-800/80">
        {Object.entries(TEAMS).map(([key, team]) => {
          const isActive = activeTeam === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTeam(key)}
              style={{
                boxShadow: isActive ? `0 0 15px ${team.glow}` : undefined
              }}
              className={`px-4 py-2.5 rounded-xl border text-xs font-black tracking-widest shrink-0 transition-all hover:scale-[1.03] ${
                isActive
                  ? `bg-gradient-to-r ${team.gradient} ${team.borderActive} scale-[1.05]`
                  : `${team.borderInactive} ${team.textInactive} bg-zinc-950/40`
              }`}
            >
              {team.logo}
            </button>
          );
        })}
      </div>

      {/* Main Content Workspace */}
      <div className="min-h-[350px] relative rounded-2xl border border-zinc-800/80 bg-zinc-950/30 p-6 overflow-hidden">
        {/* Glow backdrop behind details */}
        <div
          className="absolute -top-12 -right-12 w-64 h-64 rounded-full blur-[100px] opacity-[0.12] pointer-events-none transition-all duration-500"
          style={{ backgroundColor: teamMeta.glow }}
        />

        {/* Watermark of team name */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none opacity-[0.015] z-0">
          <span className="text-[12rem] font-black tracking-tighter uppercase whitespace-nowrap">
            {teamMeta.logo}
          </span>
        </div>

        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0f]/60 backdrop-blur-[2px] z-20 transition-all">
            <div className="flex flex-col items-center gap-2 text-zinc-400">
              <Loader2 size={24} className="animate-spin text-lime-400" />
              <span className="text-[10px] font-bold tracking-wider uppercase">Loading Squad Roster...</span>
            </div>
          </div>
        ) : null}

        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            {/* Column 1: Performance KPIs & Circular Dial */}
            <div className="flex flex-col justify-between gap-6">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                  Selected Franchise
                </span>
                <h3
                  className="text-xl font-black leading-none tracking-tight uppercase transition-colors"
                  style={{ color: teamMeta.colorName }}
                >
                  {teamMeta.name}
                </h3>
              </div>

              {/* KPI Cards (High Tech Grid) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0e0e16] border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-700 transition-colors">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity size={12} className="text-zinc-500" /> Played
                  </span>
                  <span className="text-2xl font-black text-white mt-3">
                    {data.matchesPlayed}
                  </span>
                </div>
                <div className="bg-[#0e0e16] border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-700 transition-colors">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield size={12} className="text-zinc-500" /> Wins
                  </span>
                  <span className="text-2xl font-black text-white mt-3">
                    {data.wins}
                  </span>
                </div>
              </div>

              {/* Circular Gauge Box */}
              <div className="bg-[#0e0e16] border border-zinc-800/80 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Calculated Win Rate
                  </span>
                  <span className="text-xs text-zinc-400 font-semibold mt-1 block">
                    Franchise History
                  </span>
                </div>
                <div className="relative flex items-center justify-center shrink-0">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r={radius}
                      className="stroke-zinc-900"
                      strokeWidth="5"
                      fill="transparent"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r={radius}
                      stroke={teamMeta.colorName}
                      strokeWidth="5"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-700"
                    />
                  </svg>
                  <span className="absolute text-xs font-black text-white">
                    {winRate}%
                  </span>
                </div>
              </div>
            </div>

            {/* Column 2: Seasonal Match Volume Chart */}
            <div className="flex flex-col gap-4 justify-between">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Seasonal Match Volume
              </span>
              <div className="w-full h-[180px] bg-zinc-950/40 rounded-xl border border-zinc-900/85 p-3 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.seasonTrends} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`teamGlowGrad-${activeTeam}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={teamMeta.colorName} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={teamMeta.colorName} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#12121a" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="season" stroke="#52525b" fontSize={8} tickLine={false} axisLine={false} />
                    <YAxis stroke="#52525b" fontSize={8} tickLine={false} axisLine={false} />
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
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke={teamMeta.colorName}
                      strokeWidth={2}
                      fill={`url(#teamGlowGrad-${activeTeam})`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Column 3: Team Roster MVP Hologram Cards */}
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Squad MVP Performers
              </span>

              <div className="grid grid-cols-2 gap-4 h-full">
                {/* Top Batter Card */}
                {data.topBatter && (
                  <div
                    style={{
                      borderColor: `${teamMeta.colorName}25`,
                      boxShadow: `0 4px 20px rgba(0,0,0,0.4)`
                    }}
                    className="relative overflow-hidden rounded-xl border bg-gradient-to-b from-[#12121a] to-[#08080c] p-4 flex flex-col justify-between group/mvp transition-all hover:scale-[1.02]"
                  >
                    {/* Glowing role badge */}
                    <div className="absolute top-2 right-2 text-[8px] font-bold text-orange-400 bg-orange-400/[0.06] border border-orange-400/20 px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                      <Flame size={8} /> BAT
                    </div>
                    {/* Glowing frame */}
                    <div
                      style={{ borderColor: `${teamMeta.colorName}30` }}
                      className="w-14 h-14 rounded-full border bg-zinc-950/80 overflow-hidden shrink-0 flex items-center justify-center mx-auto mt-3 shadow-md"
                    >
                      <PlayerAvatar imageUrl={data.topBatter.imageUrl} name={data.topBatter.name} colorTheme={teamMeta.colorName} />
                    </div>
                    <div className="text-center mt-3">
                      <span className="block text-xs font-black text-white truncate">
                        {data.topBatter.name}
                      </span>
                      <span className="block text-[8px] text-zinc-500 font-semibold uppercase mt-0.5 tracking-wider">
                        Runs MVP
                      </span>
                    </div>
                    <div className="mt-4 pt-2 border-t border-zinc-900/60 text-center">
                      <span className="text-base font-black text-orange-400 tracking-tight">
                        {data.topBatter.runs}
                      </span>
                      <span className="block text-[8px] uppercase tracking-wider text-zinc-500 font-bold">
                        Runs
                      </span>
                    </div>
                  </div>
                )}

                {/* Top Bowler Card */}
                {data.topBowler && (
                  <div
                    style={{
                      borderColor: `${teamMeta.colorName}25`,
                      boxShadow: `0 4px 20px rgba(0,0,0,0.4)`
                    }}
                    className="relative overflow-hidden rounded-xl border bg-gradient-to-b from-[#12121a] to-[#08080c] p-4 flex flex-col justify-between group/mvp transition-all hover:scale-[1.02]"
                  >
                    {/* Glowing role badge */}
                    <div className="absolute top-2 right-2 text-[8px] font-bold text-purple-400 bg-purple-400/[0.06] border border-purple-400/20 px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                      <Trophy size={8} /> BOWL
                    </div>
                    {/* Glowing frame */}
                    <div
                      style={{ borderColor: `${teamMeta.colorName}30` }}
                      className="w-14 h-14 rounded-full border bg-zinc-950/80 overflow-hidden shrink-0 flex items-center justify-center mx-auto mt-3 shadow-md"
                    >
                      <PlayerAvatar imageUrl={data.topBowler.imageUrl} name={data.topBowler.name} colorTheme={teamMeta.colorName} />
                    </div>
                    <div className="text-center mt-3">
                      <span className="block text-xs font-black text-white truncate">
                        {data.topBowler.name}
                      </span>
                      <span className="block text-[8px] text-zinc-500 font-semibold uppercase mt-0.5 tracking-wider">
                        Wkts MVP
                      </span>
                    </div>
                    <div className="mt-4 pt-2 border-t border-zinc-900/60 text-center">
                      <span className="text-base font-black text-purple-400 tracking-tight">
                        {data.topBowler.wickets}
                      </span>
                      <span className="block text-[8px] uppercase tracking-wider text-zinc-500 font-bold">
                        Wickets
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
