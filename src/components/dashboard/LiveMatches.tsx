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
      t1: "AUS-W",
      t1Name: "Australia Women",
      t1Logo: "bg-yellow-500 text-black border-yellow-400",
      t2: "IND-W",
      t2Name: "India Women",
      t2Logo: "bg-orange-500 text-white border-orange-400"
    },
    score1: "172/5 (20 Ov)",
    score2: "148/3 (16.4 Ov)",
    overs: "16.4 / 20 Ov",
    status: "India Women need 25 runs in 20 balls to win the WT20 World Cup!",
    venue: "Melbourne Cricket Ground, Melbourne",
    pitch: "Dry & dusty surface. Assisting spinners. Slower ball variations are key.",
    winProb1: 42,
    winProb2: 58,
    liveBatsmen: [
      { name: "Smriti Mandhana", runs: 72, balls: 48, fours: 8, sixes: 2, sr: 150.0 },
      { name: "Harmanpreet Kaur", runs: 32, balls: 19, fours: 3, sixes: 1, sr: 168.4 }
    ],
    liveBowler: { name: "Ellyse Perry", overs: "3.4", maidens: 0, runs: 32, wickets: 1, econ: 8.7 }
  },
  {
    id: 2,
    teams: {
      t1: "MI",
      t1Name: "Mumbai Indians",
      t1Logo: "bg-blue-600 text-white border-blue-400",
      t2: "CSK",
      t2Name: "Chennai Super Kings",
      t2Logo: "bg-yellow-400 text-black border-yellow-500"
    },
    score1: "195/6 (20 Ov)",
    score2: "178/5 (18.3 Ov)",
    overs: "18.3 / 20 Ov",
    status: "CSK need 18 runs in 9 balls. High-tension IPL Rivalry Week!",
    venue: "Wankhede Stadium, Mumbai",
    pitch: "Flat batting deck with short boundaries. Heavy dew expected to help batters.",
    winProb1: 65,
    winProb2: 35,
    liveBatsmen: [
      { name: "MS Dhoni", runs: 28, balls: 11, fours: 2, sixes: 2, sr: 254.5 },
      { name: "Ravindra Jadeja", runs: 14, balls: 8, fours: 1, sixes: 0, sr: 175.0 }
    ],
    liveBowler: { name: "Jasprit Bumrah", overs: "3.3", maidens: 0, runs: 24, wickets: 2, econ: 6.8 }
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
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-black text-xs shrink-0 ${match.teams.t1Logo}`}>
                    {match.teams.t1}
                  </div>
                  <span className="text-sm font-bold text-zinc-300">{match.teams.t1Name}</span>
                </div>
                <span className="text-sm font-black text-zinc-400">{match.score1}</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-black text-xs shrink-0 ${match.teams.t2Logo}`}>
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
