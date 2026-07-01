"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Target, Search, Loader2 } from "lucide-react";

export default function MicroBattleAnalysis() {
  const [searchInput, setSearchInput] = useState("");
  const [currentMatchup, setCurrentMatchup] = useState("Virat Kohli vs Left-Arm Spin");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Default loaded state
  const [stats, setStats] = useState({
    avg: 32.5,
    sr: 115.4,
    dismissals: 14,
    ballsFaced: 340,
    dotPercentage: 42,
    insight: "Historically struggles to rotate strike early in the innings against left-arm orthodox. Vulnerable to arm balls skidding on."
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    setIsLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/microbattle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchup: searchInput })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch matchup");
      
      setStats(data);
      setCurrentMatchup(searchInput);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="micro-battle" className="w-full bg-[#0a0a0f] border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden mb-12 bg-gradient-to-br from-[#0e0e16] via-[#0b0b12] to-[#16120b]">
      {/* Accent strip */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-orange-500 via-rose-500 to-transparent" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/[0.06] text-orange-400 border border-orange-500/10 rounded-lg shadow-[0_0_15px_rgba(249,115,22,0.15)]">
            <Swords size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Micro-Battle Analysis</h2>
            <p className="text-[10px] text-zinc-500 mt-0.5">Deep-dive into specific player-vs-player tactical matchups</p>
          </div>
        </div>
        
        <form onSubmit={handleSearch} className="flex w-full lg:w-1/2 gap-2 relative z-10">
          <input 
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="e.g. Sachin Tendulkar vs Shane Warne"
            className="flex-1 bg-[#0d0d15] border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all placeholder:text-zinc-600"
          />
          <button 
            type="submit"
            disabled={isLoading || !searchInput.trim()}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white p-2 rounded-lg transition-all flex items-center justify-center min-w-[40px]"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          </button>
        </form>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg text-center">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {!isLoading && (
          <motion.div
            key={currentMatchup}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-6"
          >
            {/* Stats Grid */}
            <div className="md:col-span-7 grid grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="bg-[#0d0d15] border border-zinc-800/50 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1 block">Batting Avg</span>
                <span className={`text-2xl font-black ${stats.avg < 25 ? 'text-rose-400' : 'text-white'}`}>{stats.avg}</span>
              </div>
              <div className="bg-[#0d0d15] border border-zinc-800/50 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1 block">Strike Rate</span>
                <span className={`text-2xl font-black ${stats.sr < 110 ? 'text-rose-400' : 'text-emerald-400'}`}>{stats.sr}</span>
              </div>
              <div className="bg-[#0d0d15] border border-zinc-800/50 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1 block">Dismissals</span>
                <span className="text-2xl font-black text-orange-400">{stats.dismissals}</span>
              </div>
              <div className="bg-[#0d0d15] border border-zinc-800/50 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1 block">Balls Faced</span>
                <span className="text-2xl font-black text-white">{stats.ballsFaced}</span>
              </div>
              <div className="bg-[#0d0d15] border border-zinc-800/50 p-4 rounded-xl flex flex-col items-center justify-center text-center col-span-2 lg:col-span-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1 block">Dot Ball %</span>
                <span className="text-2xl font-black text-white">{stats.dotPercentage}%</span>
              </div>
            </div>

            {/* AI Insight */}
            <div className="md:col-span-5 bg-orange-500/[0.02] border border-orange-500/10 p-5 rounded-xl flex flex-col justify-center">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-orange-400" />
                  <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Tactical Vulnerability</span>
                </div>
                <span className="text-[8px] bg-zinc-900 text-zinc-500 px-1.5 py-0.5 rounded uppercase border border-zinc-800">
                  AI Estimated
                </span>
              </div>
              
              <h3 className="text-sm font-bold text-white mb-2">{currentMatchup}</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {stats.insight}
              </p>
              
              {/* Visual indicator bar */}
              <div className="mt-6">
                <div className="flex justify-between text-[9px] font-bold uppercase text-zinc-500 mb-1.5">
                  <span>Bowler Dominance</span>
                  <span>Batter Dominance</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-rose-500 transition-all duration-1000" 
                    style={{ width: `${stats.dotPercentage}%` }}
                  />
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-1000" 
                    style={{ width: `${100 - stats.dotPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
