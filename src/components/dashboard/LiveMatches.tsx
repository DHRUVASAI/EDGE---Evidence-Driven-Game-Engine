"use client";

import React, { useState } from "react";
import { Activity, ShieldAlert, Users, Award, MapPin, Eye, Calendar, Sparkles } from "lucide-react";

interface LiveMatch {
  id: number;
  teams: {
    t1: string;
    t1Name: string;
    t1Logo: string; // Color border/bg
    t2: string;
    t2Name: string;
    t2Logo: string;
  };
  score1: string;
  score2: string;
  overs: string;
  status: string;
  venue: string;
  pitch: string;
  winProb1: number;
  winProb2: number;
  liveBatsmen: Array<{ name: string; runs: number; balls: number; fours: number; sixes: number; sr: number }>;
  liveBowler: { name: string; overs: string; maidens: number; runs: number; wickets: number; econ: number };
}

const LIVE_DATA: LiveMatch[] = [
  {
    id: 1,
    teams: {
      t1: "PAK",
      t1Name: "Pakistan",
      t1Logo: "bg-emerald-800 text-emerald-200 border-emerald-600",
      t2: "IND",
      t2Name: "India",
      t2Logo: "bg-blue-600 text-white border-blue-400"
    },
    score1: "168/7 (20 Ov)",
    score2: "148/3 (17.2 Ov)",
    overs: "17.2 / 20 Ov",
    status: "Live • India need 21 runs in 16 balls to win this high-voltage clash!",
    venue: "Nassau County Cricket Stadium, New York",
    pitch: "Moderate grass cover. Good carry and bounce. Pacers getting seam movement.",
    winProb1: 32,
    winProb2: 68,
    liveBatsmen: [
      { name: "Virat Kohli", runs: 58, balls: 41, fours: 5, sixes: 2, sr: 141.5 },
      { name: "Rishabh Pant", runs: 24, balls: 15, fours: 2, sixes: 0, sr: 160.0 }
    ],
    liveBowler: { name: "Shaheen Afridi", overs: "3.2", maidens: 0, runs: 28, wickets: 2, econ: 8.4 }
  },
  {
    id: 2,
    teams: {
      t1: "ENG-W",
      t1Name: "England Women",
      t1Logo: "bg-red-700 text-white border-red-500",
      t2: "IND-W",
      t2Name: "India Women",
      t2Logo: "bg-orange-500 text-white border-orange-400"
    },
    score1: "154/6 (20 Ov)",
    score2: "126/3 (15.4 Ov)",
    overs: "15.4 / 20 Ov",
    status: "Live • India Women need 29 runs in 26 balls (Bilateral Series - Game 3)",
    venue: "Lord's Cricket Ground, London",
    pitch: "Dry surface. Offering grip and turn. Spinners dominating in the second innings.",
    winProb1: 40,
    winProb2: 60,
    liveBatsmen: [
      { name: "Smriti Mandhana", runs: 68, balls: 44, fours: 7, sixes: 2, sr: 154.5 },
      { name: "Jemimah Rodrigues", runs: 18, balls: 12, fours: 1, sixes: 0, sr: 150.0 }
    ],
    liveBowler: { name: "Sophie Ecclestone", overs: "3.4", maidens: 0, runs: 21, wickets: 2, econ: 5.7 }
  }
];

export default function LiveMatches() {
  const [activeMatchIndex, setActiveMatchIndex] = useState<number>(0);
  const match = LIVE_DATA[activeMatchIndex];

  return (
    <div className="w-full flex flex-col gap-6 mb-12">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
          </span>
          <h2 className="text-base font-bold text-white tracking-tight uppercase">
            Live Match Analytics Center
          </h2>
        </div>
        <div className="flex gap-2">
          {LIVE_DATA.map((m, idx) => (
            <button
              key={m.id}
              onClick={() => setActiveMatchIndex(idx)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all ${
                activeMatchIndex === idx
                  ? "bg-lime-400 text-black border border-lime-400"
                  : "bg-zinc-950/40 border border-zinc-850 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {m.teams.t1} vs {m.teams.t2}
            </button>
          ))}
        </div>
      </div>

      {/* Live Match Board */}
      <div className="relative rounded-2xl border border-zinc-800/80 bg-zinc-950/30 p-6 overflow-hidden">
        {/* Glow backlight */}
        <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full blur-[120px] opacity-10 bg-lime-400 pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          {/* Column 1: Main Scoreboard & Win Probability */}
          <div className="flex flex-col justify-between gap-6 border-r border-zinc-900/80 pr-0 lg:pr-8">
            <div className="flex flex-col gap-3">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                {match.sub}
              </span>

              {/* Teams Display */}
              <div className="flex items-center justify-between gap-4 mt-2">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full border flex items-center justify-center font-black shrink-0 transition-all ${
                    match.teams.t1.length > 3 ? "text-[8px] tracking-tighter px-0.5" : "text-xs"
                  } ${match.teams.t1Logo}`}>
                    {match.teams.t1}
                  </div>
                  <span className="text-sm font-bold text-zinc-300">{match.teams.t1Name}</span>
                </div>
                <span className="text-sm font-black text-zinc-400">{match.score1}</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full border flex items-center justify-center font-black shrink-0 transition-all ${
                    match.teams.t2.length > 3 ? "text-[8px] tracking-tighter px-0.5" : "text-xs"
                  } ${match.teams.t2Logo}`}>
                    {match.teams.t2}
                  </div>
                  <span className="text-sm font-bold text-white">{match.teams.t2Name}</span>
                </div>
                <span className="text-sm font-black text-lime-400">{match.score2}</span>
              </div>
            </div>

            {/* Win Probability Bar */}
            <div className="bg-[#0e0e16] border border-zinc-900 rounded-xl p-4 mt-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-wider mb-2">
                <span className="text-zinc-400">{match.teams.t1} Win Rate</span>
                <span className="text-lime-400">{match.teams.t2} Win Rate</span>
              </div>
              <div className="flex justify-between items-center text-xs font-black mb-1.5">
                <span className="text-zinc-500">{match.winProb1}%</span>
                <span className="text-lime-400">{match.winProb2}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-zinc-650 transition-all duration-75"
                  style={{ width: `${match.winProb1}%` }}
                />
                <div
                  className="h-full bg-lime-400 transition-all duration-75"
                  style={{ width: `${match.winProb2}%` }}
                />
              </div>
            </div>
          </div>

          {/* Column 2: Ground & Pitch Intelligence */}
          <div className="flex flex-col justify-between gap-4 border-r border-zinc-900/80 pr-0 lg:pr-8">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <MapPin size={12} className="text-lime-400" /> Pitch & Venue Telemetry
            </span>

            <div className="flex flex-col gap-3.5 my-auto">
              <div>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Stadium / Venue
                </span>
                <span className="text-sm font-bold text-white mt-1 block">
                  {match.venue}
                </span>
              </div>

              <div>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Pitch & Condition Report
                </span>
                <span className="text-xs text-zinc-400 leading-relaxed mt-1 block">
                  {match.pitch}
                </span>
              </div>
            </div>

            {/* Glowing Live Banner */}
            <div className="bg-red-500/[0.04] border border-red-500/20 rounded-xl p-3 flex items-center gap-3">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <p className="text-[10px] font-bold text-red-400 leading-tight uppercase">
                {match.status}
              </p>
            </div>
          </div>

          {/* Column 3: Live Player Stats (Batter & Bowler at Crease) */}
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <Activity size={12} className="text-orange-500" /> Live Match Stats
            </span>

            <div className="flex flex-col gap-4">
              {/* Batter Cards */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                  Batters at the Crease
                </span>
                {match.liveBatsmen.map((b, idx) => (
                  <div key={b.name} className="flex justify-between items-center bg-[#0a0a0f] border border-zinc-900 rounded-lg p-2.5">
                    <span className="text-xs font-bold text-white truncate max-w-[120px]">
                      {b.name} {idx === 0 && <span className="text-lime-400">*</span>}
                    </span>
                    <div className="flex items-center gap-4 text-xs font-bold shrink-0">
                      <span className="text-white">
                        {b.runs} <span className="text-zinc-500 text-[10px]">({b.balls})</span>
                      </span>
                      <span className="text-[9px] text-zinc-500 w-12 text-right">
                        SR {b.sr}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bowler Card */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                  Active Bowler
                </span>
                <div className="flex justify-between items-center bg-[#0a0a0f] border border-zinc-900 rounded-lg p-2.5">
                  <span className="text-xs font-bold text-zinc-300 truncate max-w-[120px]">
                    {match.liveBowler.name}
                  </span>
                  <div className="flex items-center gap-4 text-xs font-bold shrink-0">
                    <span className="text-white">
                      {match.liveBowler.wickets}-{match.liveBowler.runs}{" "}
                      <span className="text-zinc-500 text-[10px]">({match.liveBowler.overs})</span>
                    </span>
                    <span className="text-[9px] text-zinc-500 w-12 text-right">
                      Econ {match.liveBowler.econ}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
