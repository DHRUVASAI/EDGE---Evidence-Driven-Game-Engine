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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    // Basic validation
    if (formData.over >= (formData.format === "T20" ? 20 : 50)) {
      setError(`Overs must be less than ${formData.format === "T20" ? 20 : 50} for format ${formData.format}`);
      setLoading(false);
      return;
    }
    if (formData.score >= formData.target) {
      setError("Chasing score must be less than the target.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "win_prob",
          ...formData
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to calculate probability");
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runsNeeded = formData.target - formData.score;
  const ballsRemaining = (formData.format === "T20" ? 120 : 300) - (formData.over * 6);
  const reqRR = ballsRemaining > 0 ? (runsNeeded / (ballsRemaining / 6)).toFixed(2) : "0.00";

  return (
    <div id="win-prob-calculator" className="w-full bg-[#0e0e16] border border-zinc-800/80 rounded-2xl p-6 md:p-8 mb-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/[0.02] rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800/60">
        <div className="p-2.5 bg-pink-500/[0.06] text-pink-400 border border-pink-500/10 rounded-lg">
          <TrendingUp size={20} />
        </div>
        <div>
          <h2 className="text-base font-bold text-white uppercase tracking-tight">Live Win Probability & Risk Scoring</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Calculate real-time chasing odds based on required run rates and historical wickets states</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end mb-6">
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Format</label>
          <div className="relative z-10">
            <button
              type="button"
              onClick={() => setFormatDropdownOpen(!formatDropdownOpen)}
              className="w-full bg-[#12121c] border border-zinc-800/60 rounded-[10px] p-3 text-white text-sm focus:ring-1 focus:ring-pink-500/50 text-left flex justify-between items-center transition-all focus:outline-none cursor-pointer"
            >
              <span>{formData.format}</span>
              <svg
                className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${formatDropdownOpen ? "transform rotate-180" : ""}`}
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
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 mt-2 bg-[#12121c] border border-zinc-800/80 rounded-[10px] overflow-hidden shadow-xl z-30"
                >
                  {["T20", "ODI"].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, format: f, over: f === "T20" ? 12 : 30, target: f === "T20" ? 160 : 250, score: f === "T20" ? 90 : 150 }));
                        setFormatDropdownOpen(false);
                      }}
                      className={`w-full text-left p-3 text-sm transition-all hover:bg-pink-400/10 hover:text-pink-400 ${
                        formData.format === f ? "text-pink-400 bg-pink-400/[0.03] font-bold" : "text-zinc-300"
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

        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Over Completed</label>
          <input
            type="number"
            name="over"
            min="0"
            max={formData.format === "T20" ? "19" : "49"}
            value={formData.over}
            onChange={handleChange}
            className="w-full bg-[#12121c] border border-zinc-800/60 rounded-[10px] p-3 text-white text-sm focus:ring-1 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Target Score</label>
          <input
            type="number"
            name="target"
            min="1"
            value={formData.target}
            onChange={handleChange}
            className="w-full bg-[#12121c] border border-zinc-800/60 rounded-[10px] p-3 text-white text-sm focus:ring-1 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Current Score</label>
          <input
            type="number"
            name="score"
            min="0"
            value={formData.score}
            onChange={handleChange}
            className="w-full bg-[#12121c] border border-zinc-800/60 rounded-[10px] p-3 text-white text-sm focus:ring-1 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Wickets Down</label>
          <input
            type="number"
            name="wickets"
            min="0"
            max="9"
            value={formData.wickets}
            onChange={handleChange}
            className="w-full bg-[#12121c] border border-zinc-800/60 rounded-[10px] p-3 text-white text-sm focus:ring-1 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all focus:outline-none"
          />
        </div>
      </form>

      {/* Live RR metrics indicator */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="px-3 py-1 rounded-md bg-[#12121c] border border-zinc-800/60 text-xs text-zinc-400">
          Overs Remaining: <span className="text-white font-semibold">{(ballsRemaining / 6).toFixed(1)}</span>
        </span>
        <span className="px-3 py-1 rounded-md bg-[#12121c] border border-zinc-800/60 text-xs text-zinc-400">
          Runs Required: <span className="text-white font-semibold">{runsNeeded}</span>
        </span>
        <span className="px-3 py-1 rounded-md bg-[#12121c] border border-zinc-800/60 text-xs text-zinc-400">
          Required RR: <span className="text-pink-400 font-semibold">{reqRR}</span>
        </span>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-pink-500 hover:bg-pink-400 disabled:opacity-50 text-white font-semibold py-3.5 px-6 rounded-[10px] transition-all duration-200 hover:scale-[1.005] hover:shadow-[0_0_20px_rgba(236,72,153,0.15)] text-sm mb-6 cursor-pointer"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={16} />
            Calculating Chasing Success Odds...
          </span>
        ) : (
          "Calculate Chase Win Probability"
        )}
      </button>

      {error && (
        <div className="bg-red-500/[0.06] border border-red-500/20 text-red-300 p-4 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      {/* Results details */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-[#12121c]/40 border border-zinc-800 p-6 rounded-xl space-y-6"
          >
            {/* Split Probability Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                <span className="text-zinc-400">Defending Win% ({100 - result.winProb2}%)</span>
                <span className="text-pink-400">Chasing Win% ({result.winProb2}%)</span>
              </div>
              <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/80 flex relative">
                <div 
                  className="h-full bg-zinc-700 transition-all duration-500" 
                  style={{ width: `${100 - result.winProb2}%` }}
                />
                <div 
                  className="h-full bg-pink-500 transition-all duration-500 shadow-[0_0_10px_rgba(236,72,153,0.4)]" 
                  style={{ width: `${result.winProb2}%` }}
                />
              </div>
            </div>

            {/* Risk Badge and Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-[#12121c] border border-zinc-800/60 p-4 rounded-xl text-center flex flex-col justify-center">
                <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Situation Risk</div>
                <div className="flex justify-center">
                  <span className={`px-3 py-1 rounded text-xs font-black uppercase tracking-wider border ${
                    result.risk === "Low" 
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : result.risk === "Medium"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}>
                    {result.risk} Risk
                  </span>
                </div>
                <div className="text-[9px] text-zinc-500 mt-2 leading-tight px-2">{result.riskReason}</div>
              </div>

              <div className="bg-[#12121c] border border-zinc-800/60 p-4 rounded-xl text-center">
                <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Historical Matches</div>
                <div className="text-2xl font-bold text-white tracking-tight">{(result.supportingDeliveryCount / 6).toLocaleString()}</div>
                <div className="text-[9px] text-zinc-500 mt-1">similar scenarios indexed</div>
              </div>

              <div className="bg-[#12121c] border border-zinc-800/60 p-4 rounded-xl text-center">
                <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Required Run Rate</div>
                <div className="text-2xl font-bold text-pink-400 tracking-tight">{result.reqRR}</div>
                <div className="text-[9px] text-zinc-500 mt-1">runs needed per over</div>
              </div>
            </div>

            {/* Tactical insights block */}
            <div className="bg-pink-500/[0.03] border border-pink-500/10 p-5 rounded-xl">
              <div className="text-xs font-semibold text-pink-400 mb-1.5 uppercase tracking-wider">Tactical Chase Analysis</div>
              <p className="text-xs text-zinc-400 leading-relaxed capitalize">{result.recommendation}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
