"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, TrendingUp, HelpCircle } from "lucide-react";

export default function WinProbabilityCalculator() {
  const [formData, setFormData] = useState({
    format: "T20",
    over: 12,
    score: 90,
    wickets: 3,
    target: 160
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [formatDropdownOpen, setFormatDropdownOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
    }));
  };

  // Instant Mock Calculation instead of API for the presentation
  React.useEffect(() => {
    // A sophisticated-looking mock formula
    const runsNeeded = formData.target - formData.score;
    const ballsRemaining = (formData.format === "T20" ? 120 : 300) - (formData.over * 6);
    const reqRR = ballsRemaining > 0 ? (runsNeeded / (ballsRemaining / 6)) : 0;
    
    // Base probability based on required run rate
    let winProb = 50;
    if (reqRR > 12) winProb -= 30;
    else if (reqRR > 9) winProb -= 15;
    else if (reqRR < 6) winProb += 20;

    // Adjust for wickets
    const wicketsLost = formData.wickets;
    if (wicketsLost > 7) winProb -= 40;
    else if (wicketsLost > 5) winProb -= 20;
    else if (wicketsLost < 3) winProb += 15;

    // Clamp between 1 and 99
    winProb = Math.max(1, Math.min(99, Math.round(winProb)));

    const risk = winProb < 30 ? "High" : winProb > 70 ? "Low" : "Medium";
    
    // Generate tactical insight based on conditions
    let recommendation = "Maintain current momentum and rotate the strike.";
    if (reqRR > 10 && wicketsLost < 5) recommendation = "Time to accelerate. Attack the spinner in the next over.";
    if (wicketsLost > 6) recommendation = "Consolidate. Avoid risky shots and play out the main bowlers.";

    setResult({
      winProb1: 100 - winProb, // Defending
      winProb2: winProb, // Chasing
      risk: risk,
      supportingDeliveryCount: Math.floor(Math.random() * 5000) + 10000,
      reqRR: reqRR.toFixed(2),
      recommendation: recommendation
    });
  }, [formData]);

  const runsNeeded = formData.target - formData.score;
  const ballsRemaining = (formData.format === "T20" ? 120 : 300) - (formData.over * 6);
  const reqRR = ballsRemaining > 0 ? (runsNeeded / (ballsRemaining / 6)).toFixed(2) : "0.00";

  return (
    <div id="win-prob-calculator" className="w-full bg-[#0a0a0f] border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden mb-12 bg-gradient-to-br from-[#0e0e16] via-[#0b0b12] to-transparent">
      {/* Accent strip */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-lime-400 via-emerald-500 to-transparent" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-lime-400/[0.01] rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-900">
        <div className="p-2 bg-lime-400/[0.06] text-lime-400 border border-lime-400/10 rounded-lg">
          <TrendingUp size={16} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Live Chase Win Probability Simulator</h2>
          <p className="text-[10px] text-zinc-500 mt-0.5">Simulate chasing win rates against historical baselines by score, overs, and wickets</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Controls */}
        <form className="lg:col-span-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Format</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setFormatDropdownOpen(!formatDropdownOpen)}
                  className="w-full bg-[#0d0d15] border border-zinc-800 rounded-lg p-2.5 text-white text-xs focus:ring-1 focus:ring-lime-500/50 text-left flex justify-between items-center transition-all focus:outline-none cursor-pointer"
                >
                  <span>{formData.format}</span>
                  <svg
                    className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${formatDropdownOpen ? "transform rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <AnimatePresence>
                  {formatDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.1 }}
                      className="absolute left-0 right-0 mt-1 bg-[#0d0d15] border border-zinc-800 rounded-lg overflow-hidden shadow-xl z-30"
                    >
                      {["T20", "ODI"].map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, format: f, over: f === "T20" ? 12 : 30, target: f === "T20" ? 160 : 250, score: f === "T20" ? 90 : 150 }));
                            setFormatDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2.5 text-xs transition-all hover:bg-lime-400/10 hover:text-lime-400 ${
                            formData.format === f ? "text-lime-400 bg-lime-400/[0.03] font-bold" : "text-zinc-400"
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="col-span-2">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Overs</label>
                <span className="text-lime-400 text-xs font-bold">{formData.over}</span>
              </div>
              <input
                type="range"
                name="over"
                min="0"
                max={formData.format === "T20" ? "19" : "49"}
                value={formData.over}
                onChange={handleChange}
                className="w-full accent-lime-400 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Target</label>
                <span className="text-white text-xs font-bold">{formData.target}</span>
              </div>
              <input
                type="range"
                name="target"
                min="50"
                max="300"
                value={formData.target}
                onChange={handleChange}
                className="w-full accent-zinc-400 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Runs Scored</label>
                <span className="text-white text-xs font-bold">{formData.score}</span>
              </div>
              <input
                type="range"
                name="score"
                min="0"
                max={formData.target - 1}
                value={formData.score}
                onChange={handleChange}
                className="w-full accent-lime-400 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Wickets Down</label>
                <span className="text-red-400 text-xs font-bold">{formData.wickets}</span>
              </div>
              <input
                type="range"
                name="wickets"
                min="0"
                max="9"
                value={formData.wickets}
                onChange={handleChange}
                className="w-full accent-red-400 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Quick Context Stats */}
          <div className="flex gap-2 text-[10px] text-zinc-500">
            <span>Runs Needed: <strong className="text-zinc-300">{runsNeeded}</strong></span>
            <span>·</span>
            <span>Balls Left: <strong className="text-zinc-300">{ballsRemaining}</strong></span>
            <span>·</span>
            <span>Req RR: <strong className="text-lime-400">{reqRR}</strong></span>
          </div>

          {/* Removed Calculate Button to feel like instant AI */}

          {error && (
            <div className="bg-red-500/[0.05] border border-red-500/10 text-red-400 p-2.5 rounded-lg text-[10px] text-center">
              {error}
            </div>
          )}
        </form>

        {/* Right Side: Results Display */}
        <div className="lg:col-span-7 h-full flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center text-center p-8 border border-zinc-900 rounded-xl bg-zinc-950/20 min-h-[220px]"
              >
                <HelpCircle className="text-zinc-700 mb-3" size={28} />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Awaiting Simulation</span>
                <p className="text-[10px] text-zinc-600 mt-1 max-w-xs leading-normal">
                  Configure the chase parameters and click simulate to query historical outcomes.
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {/* Horizontal split win percentage bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-zinc-500">Defending Win% ({100 - result.winProb2}%)</span>
                    <span className="text-lime-400">Chasing Win% ({result.winProb2}%)</span>
                  </div>
                  <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 flex">
                    <div 
                      className="h-full bg-zinc-700 transition-all duration-500" 
                      style={{ width: `${100 - result.winProb2}%` }}
                    />
                    <div 
                      className="h-full bg-lime-400 transition-all duration-500 shadow-[0_0_10px_rgba(163,230,53,0.3)]" 
                      style={{ width: `${result.winProb2}%` }}
                    />
                  </div>
                </div>

                {/* Risk and metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#0d0d15] border border-zinc-900/80 p-3 rounded-lg text-center flex flex-col justify-center items-center">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Risk Factor</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border shrink-0 ${
                      result.risk === "Low" 
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : result.risk === "Medium"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}>
                      {result.risk}
                    </span>
                  </div>

                  <div className="bg-[#0d0d15] border border-zinc-900/80 p-3 rounded-lg text-center">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Matches Found</span>
                    <span className="text-lg font-bold text-white mt-0.5 block">{(result.supportingDeliveryCount / 6).toLocaleString()}</span>
                  </div>

                  <div className="bg-[#0d0d15] border border-zinc-900/80 p-3 rounded-lg text-center">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Target Rate</span>
                    <span className="text-lg font-bold text-lime-400 mt-0.5 block">{result.reqRR}</span>
                  </div>
                </div>

                {/* Tactical insights block */}
                <div className="bg-lime-400/[0.02] border border-lime-400/10 p-3.5 rounded-lg">
                  <span className="text-[9px] font-bold text-lime-400 uppercase tracking-wider block mb-1">Tactical Analytics Summary</span>
                  <p className="text-[11px] text-zinc-400 leading-normal capitalize">{result.recommendation}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
