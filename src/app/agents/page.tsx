"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Network, History, Cpu, Play, CheckCircle2, ShieldAlert, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function AutonomousAgentsPage() {
  const [teamName, setTeamName] = useState("India");
  const [opponent, setOpponent] = useState("Australia");
  const [venue, setVenue] = useState("Melbourne Cricket Ground");
  const [format, setFormat] = useState<"T20" | "ODI" | "TEST">("T20");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState("");

  const handleRunStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/agents/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName,
          opponent,
          venue,
          format,
          sessionId: `session_${teamName}_${opponent}`.toLowerCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to orchestrate strategy");
      }

      setReport(data.report);
    } catch (err: any) {
      setError(err.message || "Failed to orchestrate agent strategy");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white selection:bg-lime-500/30 selection:text-lime-200 pb-20">
      <div className="max-w-6xl mx-auto px-6 py-10">
        
        {/* Navigation back */}
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-all text-xs font-semibold mb-8 group">
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-zinc-900">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-lime-400/10 text-lime-400 border border-lime-400/20">
                Next-Gen Multi-Agent Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                RocketRide • HydraDB • Hindsight
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Autonomous Match Strategist
            </h1>
            <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
              Collaborative multi-agent framework powered by <strong>Self-Driving Agents</strong>, 
              grounded by <strong>HydraDB</strong> graph traversals, and remembered across sessions by <strong>Hindsight</strong>.
            </p>
          </div>
        </div>

        {/* Setup Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Controls Column */}
          <div className="lg:col-span-1">
            <form onSubmit={handleRunStrategy} className="bg-[#0e0e16] border border-zinc-800/80 rounded-2xl p-6 space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Bot size={16} className="text-lime-400" />
                Mission Configuration
              </h2>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Our Team</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full bg-[#12121c] border border-zinc-800/80 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-lime-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Opponent</label>
                <input
                  type="text"
                  value={opponent}
                  onChange={(e) => setOpponent(e.target.value)}
                  className="w-full bg-[#12121c] border border-zinc-800/80 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-rose-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Venue</label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full bg-[#12121c] border border-zinc-800/80 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["T20", "ODI", "TEST"] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setFormat(fmt)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                        format === fmt
                          ? "bg-lime-400 text-black border-lime-400"
                          : "bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-white"
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-lime-400 to-emerald-400 hover:from-lime-300 hover:to-emerald-300 text-black font-extrabold text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(163,230,53,0.2)] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Agent Team Working...
                  </>
                ) : (
                  <>
                    <Play size={16} className="fill-current" />
                    Launch Strategy Engine
                  </>
                )}
              </button>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                  {error}
                </div>
              )}
            </form>

            {/* Architecture Stack Callout */}
            <div className="mt-6 bg-zinc-950/60 border border-zinc-800/60 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Autonomous Stack</h3>
              <div className="space-y-2 text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <Cpu size={14} className="text-orange-400" />
                  <span><strong>RocketRide:</strong> Dynamic model orchestration & failover</span>
                </div>
                <div className="flex items-center gap-2">
                  <Network size={14} className="text-blue-400" />
                  <span><strong>HydraDB:</strong> Batter vs Bowler relationship graph</span>
                </div>
                <div className="flex items-center gap-2">
                  <History size={14} className="text-purple-400" />
                  <span><strong>Hindsight:</strong> Cross-session tactical memory context</span>
                </div>
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-2">
            {!report && !loading && (
              <div className="h-full min-h-[400px] border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-zinc-500">
                <Bot size={48} className="text-zinc-700 mb-4" />
                <h3 className="text-base font-bold text-zinc-300 mb-1">Agents Idle</h3>
                <p className="text-xs max-w-sm">
                  Configure teams and launch the autonomous strategy engine to view collaborative agent traces,
                  tactical recommendations, and playing XI synthesis.
                </p>
              </div>
            )}

            {loading && (
              <div className="h-full min-h-[400px] bg-[#0e0e16] border border-zinc-800/80 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4">
                <Loader2 size={40} className="text-lime-400 animate-spin" />
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">Autonomous Agents Collaborating</h3>
                  <p className="text-xs text-zinc-400">Scout Agent $\rightarrow$ Pitch Conditions Agent $\rightarrow$ HydraDB Nemesis Graph $\rightarrow$ Executive Synthesizer</p>
                </div>
              </div>
            )}

            {report && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Agent Workflow Execution Trace */}
                <div className="bg-[#0e0e16] border border-zinc-800/80 rounded-2xl p-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
                    <Cpu size={15} className="text-lime-400" />
                    Agent Trace Execution Log
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">Scout Agent</span>
                      <p className="text-xs text-zinc-300">{report.agentWorkflowTrace?.scout}</p>
                    </div>
                    <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">Conditions Agent</span>
                      <p className="text-xs text-zinc-300">{report.agentWorkflowTrace?.conditions}</p>
                    </div>
                    <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block mb-1">Tactics Synthesizer</span>
                      <p className="text-xs text-zinc-300">{report.agentWorkflowTrace?.tactics}</p>
                    </div>
                  </div>
                </div>

                {/* Key Directives */}
                <div className="bg-[#0e0e16] border border-zinc-800/80 rounded-2xl p-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-lime-400" />
                    Executive Match Directives
                  </h3>
                  <div className="space-y-2">
                    {report.keyTacticalDirectives?.map((dir: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/60 text-xs text-zinc-200">
                        <span className="w-5 h-5 rounded-full bg-lime-400/20 text-lime-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                          {idx + 1}
                        </span>
                        <p className="leading-relaxed">{dir}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Playing XI Synthesis */}
                <div className="bg-[#0e0e16] border border-zinc-800/80 rounded-2xl p-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
                    <ShieldAlert size={15} className="text-orange-400" />
                    Recommended Lineup Balance ({report.recommendedPlayingXI?.length || 11} Slots)
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                    {report.recommendedPlayingXI?.map((role: string, idx: number) => (
                      <div key={idx} className="p-3 bg-[#12121c] border border-zinc-800 rounded-xl flex items-center gap-2.5">
                        <span className="text-[10px] font-bold text-zinc-500 w-4">{idx + 1}</span>
                        <span className="text-xs font-semibold text-white truncate">{role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
