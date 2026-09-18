"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy, Flame, Shield, TrendingUp, Search, Loader2 } from "lucide-react";

export default function FantasyCommandCenter() {
  const [activeTab, setActiveTab] = useState<"picks" | "sleepers" | "analysis">("picks");
  const [searchInput, setSearchInput] = useState("");
  const [currentMatch, setCurrentMatch] = useState("India vs Australia");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Default loaded state
  const [data, setData] = useState({
    topPicks: [
      { id: 1, name: "Virat Kohli", role: "Batter", type: "Captain", pts: "145.5", desc: "Exceptional record at this venue. Match-up against current spinners is highly favorable." },
      { id: 2, name: "Jasprit Bumrah", role: "Bowler", type: "Vice Captain", pts: "120.0", desc: "Lethal in the death overs. Pitch conditions suggest high seam movement early on." },
      { id: 3, name: "Hardik Pandya", role: "All-Rounder", type: "Key Player", pts: "115.5", desc: "Expected to bowl 4 full overs and bat at #5. High ceiling for fantasy points." },
    ],
    sleepers: [
      { id: 4, name: "Rinku Singh", role: "Batter", pts: "85.0", desc: "Low ownership but extremely high strike rate in the final 5 overs." },
      { id: 5, name: "Kuldeep Yadav", role: "Bowler", pts: "95.5", desc: "Opposing team struggles historically against left-arm wrist spin." },
    ],
    analysis: "The Decision Engine recommends drafting heavily from the spin department today. Historical data indicates a 40% drop in pace bowler effectiveness in the second innings at this specific venue."
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    setIsLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/fantasy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match: searchInput })
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to fetch fantasy picks");
      
      setData(result);
      setCurrentMatch(searchInput);
      setActiveTab("picks");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="fantasy-command" className="w-full bg-[#0a0a0f] border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden mb-12 bg-gradient-to-br from-[#0e0e16] via-[#0b0b12] to-[#13111c]">
      {/* Accent strip */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-transparent" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/[0.06] text-purple-400 border border-purple-500/10 rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <Trophy size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Fantasy Sports Command Center</h2>
            <p className="text-[10px] text-zinc-500 mt-0.5">AI-driven predictive team building and player recommendations</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex w-full lg:w-1/2 gap-2 relative z-10">
          <input 
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="e.g. Chennai Super Kings vs Mumbai Indians"
            className="flex-1 bg-[#0d0d15] border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-zinc-600"
          />
          <button 
            type="submit"
            disabled={isLoading || !searchInput.trim()}
            className="bg-purple-500 hover:bg-purple-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white p-2 rounded-lg transition-all flex items-center justify-center min-w-[40px]"
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

      {/* Tabs */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          {[
            { id: "picks", label: "Top AI Picks", icon: Flame },
            { id: "sleepers", label: "Hidden Gems", icon: Sparkles },
            { id: "analysis", label: "Matchup Analysis", icon: Shield }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id 
                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" 
                  : "bg-zinc-900/50 text-zinc-400 border border-zinc-800/50 hover:bg-zinc-800"
              }`}
            >
              <tab.icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
        <span className="text-[8px] bg-zinc-900 text-zinc-500 px-1.5 py-0.5 rounded uppercase border border-zinc-800 hidden sm:block">
          {currentMatch} (AI Estimated)
        </span>
      </div>

      <AnimatePresence mode="wait">
        {!isLoading && activeTab === "picks" && (
          <motion.div
            key="picks"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {data.topPicks?.map((pick, idx) => (
              <div key={pick.id || idx} className="bg-[#0d0d15] border border-zinc-800/80 p-4 rounded-xl relative group hover:border-purple-500/30 transition-all">
                <div className="absolute top-4 right-4 text-purple-400/20 group-hover:text-purple-400/40 transition-all">
                  <Flame size={24} />
                </div>
                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase border mb-3 ${
                  idx === 0 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-zinc-800 text-zinc-400 border-zinc-700"
                }`}>
                  {pick.type}
                </span>
                <h3 className="text-lg font-bold text-white leading-none">{pick.name}</h3>
                <span className="text-[10px] text-zinc-500 block mt-1">{pick.role}</span>
                
                <div className="mt-4 mb-4 flex items-end gap-2">
                  <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 leading-none">
                    {pick.pts}
                  </span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Proj. Pts</span>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed border-t border-zinc-800/50 pt-3">
                  {pick.desc}
                </p>
              </div>
            ))}
          </motion.div>
        )}

        {!isLoading && activeTab === "sleepers" && (
          <motion.div
            key="sleepers"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {data.sleepers?.map((sleeper, idx) => (
              <div key={sleeper.id || idx} className="bg-[#0d0d15] border border-zinc-800/80 p-4 rounded-xl flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                <div>
                  <h3 className="text-base font-bold text-white">{sleeper.name}</h3>
                  <span className="text-[10px] text-zinc-500 block">{sleeper.role}</span>
                  <p className="text-[11px] text-zinc-400 mt-2 max-w-[80%]">{sleeper.desc}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xl font-black text-emerald-400">{sleeper.pts}</span>
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Proj. Pts</span>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {!isLoading && activeTab === "analysis" && (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#0d0d15] border border-zinc-800/80 p-6 rounded-xl flex flex-col items-center justify-center text-center min-h-[200px]"
          >
            <TrendingUp className="text-purple-400 mb-4" size={32} />
            <h3 className="text-sm font-bold text-white mb-2">AI Venue & Pitch Analysis Active</h3>
            <p className="text-xs text-zinc-300 max-w-lg leading-relaxed">
              {data.analysis}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
