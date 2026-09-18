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
  titles: number;
}

const TEAMS: Record<string, TeamDetail> = {
  CSK: { logo: "CSK", name: "Chennai Super Kings", gradient: "from-yellow-500 to-amber-500 text-black", borderActive: "border-yellow-400", textActive: "text-yellow-400", borderInactive: "border-yellow-500/20 hover:border-yellow-500/40", textInactive: "text-yellow-500/50 hover:text-yellow-400", glow: "rgba(234,179,8,0.25)", colorName: "#eab308", titles: 5 },
  MI: { logo: "MI", name: "Mumbai Indians", gradient: "from-blue-600 to-sky-500 text-white", borderActive: "border-blue-400", textActive: "text-blue-400", borderInactive: "border-blue-500/20 hover:border-blue-500/40", textInactive: "text-blue-500/50 hover:text-blue-400", glow: "rgba(59,130,246,0.25)", colorName: "#3b82f6", titles: 5 },
  RCB: { logo: "RCB", name: "Royal Challengers Bengaluru", gradient: "from-red-700 to-zinc-800 text-white", borderActive: "border-red-500", textActive: "text-red-500", borderInactive: "border-red-700/20 hover:border-red-700/40", textInactive: "text-red-700/50 hover:text-red-500", glow: "rgba(220,38,38,0.25)", colorName: "#dc2626", titles: 2 },
  KKR: { logo: "KKR", name: "Kolkata Knight Riders", gradient: "from-purple-700 to-indigo-650 text-white", borderActive: "border-purple-400", textActive: "text-purple-400", borderInactive: "border-purple-700/20 hover:border-purple-700/40", textInactive: "text-purple-700/50 hover:text-purple-400", glow: "rgba(147,51,234,0.25)", colorName: "#a855f7", titles: 3 },
  RR: { logo: "RR", name: "Rajasthan Royals", gradient: "from-pink-600 to-blue-600 text-white", borderActive: "border-pink-400", textActive: "text-pink-400", borderInactive: "border-pink-500/20 hover:border-pink-500/40", textInactive: "text-pink-500/50 hover:text-pink-400", glow: "rgba(236,72,153,0.25)", colorName: "#ec4899", titles: 1 },
  SRH: { logo: "SRH", name: "Sunrisers Hyderabad", gradient: "from-orange-500 to-red-500 text-white", borderActive: "border-orange-400", textActive: "text-orange-400", borderInactive: "border-orange-500/20 hover:border-orange-500/40", textInactive: "text-orange-500/50 hover:text-orange-400", glow: "rgba(249,115,22,0.25)", colorName: "#f97316", titles: 2 },
  DC: { logo: "DC", name: "Delhi Capitals", gradient: "from-sky-600 to-blue-800 text-white", borderActive: "border-sky-400", textActive: "text-sky-400", borderInactive: "border-sky-500/20 hover:border-sky-500/40", textInactive: "text-sky-500/50 hover:text-sky-400", glow: "rgba(56,189,248,0.25)", colorName: "#38bdf8", titles: 0 },
  PBKS: { logo: "PBKS", name: "Punjab Kings", gradient: "from-red-650 to-zinc-400 text-white", borderActive: "border-red-400", textActive: "text-red-400", borderInactive: "border-red-500/20 hover:border-red-500/40", textInactive: "text-red-500/50 hover:text-red-400", glow: "rgba(239,68,68,0.25)", colorName: "#ef4444", titles: 0 },
  GT: { logo: "GT", name: "Gujarat Titans", gradient: "from-slate-700 to-zinc-800 text-white", borderActive: "border-slate-400", textActive: "text-slate-400", borderInactive: "border-slate-500/20 hover:border-slate-500/40", textInactive: "text-slate-500/50 hover:text-slate-400", glow: "rgba(100,116,139,0.25)", colorName: "#64748b", titles: 1 },
  LSG: { logo: "LSG", name: "Lucknow Super Giants", gradient: "from-cyan-600 to-indigo-950 text-white", borderActive: "border-cyan-400", textActive: "text-cyan-400", borderInactive: "border-cyan-500/20 hover:border-cyan-500/40", textInactive: "text-cyan-500/50 hover:text-cyan-400", glow: "rgba(6,182,212,0.25)", colorName: "#06b6d4", titles: 0 }
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
  recentMatches: Array<{
    id: string;
    date: string;
    team1: string;
    team2: string;
    winner: string | null;
    venue: string | null;
  }>;
}

function getOpponentShortName(fullTeamName: string): string {
  if (!fullTeamName) return "Opponent";
  if (fullTeamName.includes("Chennai") || fullTeamName.includes("CSK")) return "CSK";
  if (fullTeamName.includes("Mumbai") || fullTeamName.includes("MI")) return "MI";
  if (fullTeamName.includes("Bangalore") || fullTeamName.includes("Bengaluru") || fullTeamName.includes("RCB")) return "RCB";
  if (fullTeamName.includes("Kolkata") || fullTeamName.includes("KKR")) return "KKR";
  if (fullTeamName.includes("Rajasthan") || fullTeamName.includes("RR")) return "RR";
  if (fullTeamName.includes("Hyderabad") || fullTeamName.includes("Deccan") || fullTeamName.includes("SRH")) return "SRH";
  if (fullTeamName.includes("Delhi") || fullTeamName.includes("DC")) return "DC";
  if (fullTeamName.includes("Punjab") || fullTeamName.includes("Kings XI") || fullTeamName.includes("PBKS")) return "PBKS";
  if (fullTeamName.includes("Gujarat") || fullTeamName.includes("GT")) return "GT";
  if (fullTeamName.includes("Lucknow") || fullTeamName.includes("LSG")) return "LSG";
  return fullTeamName.split(" ")[0] || "OPP";
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
    <div id="ipl-console" className="w-full flex flex-col gap-6 mb-12">
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
      <div className="flex gap-3 overflow-x-auto px-4 py-2 pb-3 scrollbar-thin scrollbar-thumb-zinc-800/80">
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
                {teamMeta.titles > 0 ? (
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] font-black text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-0.5 rounded-full w-fit">
                    <Trophy size={11} className="fill-current text-yellow-500" />
                    {teamMeta.titles} {teamMeta.titles === 1 ? 'IPL Cup' : 'IPL Cups'}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-zinc-500 bg-zinc-900/60 border border-zinc-800/80 px-2.5 py-0.5 rounded-full w-fit">
                    <Trophy size={11} className="text-zinc-650" />
                    0 IPL Cups
                  </div>
                )}
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

            {/* Column 2: Franchise Form Guide & Recent Matches */}
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Recent Franchise Form Guide
              </span>
              <div className="flex flex-col gap-2.5 mt-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                {data.recentMatches && data.recentMatches.map((m) => {
                  const isWinner = m.winner && (
                    m.winner.includes(activeTeam) || 
                    m.winner.includes(teamMeta.name.split(" ")[0]) ||
                    (activeTeam === "RCB" && m.winner.includes("Bangalore")) ||
                    (activeTeam === "PBKS" && m.winner.includes("Punjab")) ||
                    (activeTeam === "DC" && m.winner.includes("Delhi"))
                  );
                  const oppName = m.team1 === teamMeta.name || m.team1.includes(teamMeta.name.split(" ")[0]) ? m.team2 : m.team1;
                  const oppShort = getOpponentShortName(oppName);
                  const oppMeta = TEAMS[oppShort];
                  const matchDate = m.date ? new Date(m.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
                  
                  return (
                    <div key={m.id} className="flex items-center justify-between bg-[#0e0e16] border border-zinc-900 rounded-xl p-3 hover:border-zinc-800/80 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-7 h-7 rounded-full border flex items-center justify-center font-black text-[9px] shrink-0 transition-all ${
                          oppMeta 
                            ? `${oppMeta.borderActive} ${oppMeta.textActive} bg-zinc-950/60` 
                            : "border-zinc-800 text-zinc-400 bg-zinc-950/60"
                        }`}>
                          {oppShort}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="block text-xs font-bold text-white truncate max-w-[100px] sm:max-w-[130px]">
                              {oppMeta ? oppMeta.name : oppName}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest uppercase shrink-0 ${
                              isWinner 
                                ? "bg-lime-500/10 text-lime-400 border border-lime-500/20" 
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}>
                              {isWinner ? "WIN" : "LOSS"}
                            </span>
                          </div>
                          <span className="block text-[8px] text-zinc-500 mt-1 font-semibold truncate max-w-[150px]">
                            {m.venue}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-zinc-400 shrink-0">
                        {matchDate}
                      </span>
                    </div>
                  );
                })}
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

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(82, 82, 91, 0.4);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(161, 161, 170, 0.6);
        }
      `}</style>
    </div>
  );
}
