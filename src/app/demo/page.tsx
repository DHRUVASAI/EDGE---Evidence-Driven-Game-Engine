'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DemoPage() {
  const [formData, setFormData] = useState({
    format: 'T20',
    over: 5,
    score: 45,
    wickets: 1,
    venue: 'Any',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['over', 'score', 'wickets'].includes(name) ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch recommendation');
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Derive match phase for display
  const matchPhase = formData.over < 6 ? 'Powerplay' : formData.over < 16 ? 'Middle' : 'Death';
  const currentRR = formData.over > 0 ? (formData.score / formData.over).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans selection:bg-lime-500/30 selection:text-lime-200">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500 block mb-4"
          >
            Decision Engine
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold text-white tracking-[-0.03em] mb-4"
          >
            Match Situation Analyzer
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base text-zinc-500 max-w-xl"
          >
            Input the current match state and get a data-driven tactical recommendation backed by 1.5M+ historical T20 deliveries.
          </motion.p>
        </div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0e0e16] p-6 md:p-8 rounded-2xl border border-zinc-800/60 mb-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Over</label>
              <input
                type="number"
                name="over"
                min="0"
                max="49"
                value={formData.over}
                onChange={handleChange}
                className="w-full bg-[#12121c] border border-zinc-800/60 rounded-[10px] p-3 text-white text-sm focus:ring-1 focus:ring-lime-500/50 focus:border-lime-500/50 transition-all focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Score</label>
              <input
                type="number"
                name="score"
                min="0"
                value={formData.score}
                onChange={handleChange}
                className="w-full bg-[#12121c] border border-zinc-800/60 rounded-[10px] p-3 text-white text-sm focus:ring-1 focus:ring-lime-500/50 focus:border-lime-500/50 transition-all focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Wickets</label>
              <input
                type="number"
                name="wickets"
                min="0"
                max="10"
                value={formData.wickets}
                onChange={handleChange}
                className="w-full bg-[#12121c] border border-zinc-800/60 rounded-[10px] p-3 text-white text-sm focus:ring-1 focus:ring-lime-500/50 focus:border-lime-500/50 transition-all focus:outline-none"
              />
            </div>
            <div className="relative z-20">
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Format</label>
              <select
                name="format"
                value={formData.format}
                onChange={handleChange}
                className="w-full bg-[#12121c] border border-zinc-800/60 rounded-[10px] p-3 text-white text-sm focus:ring-1 focus:ring-lime-500/50 focus:border-lime-500/50 transition-all focus:outline-none appearance-none cursor-pointer"
              >
                <option value="T20">T20</option>
              </select>
            </div>
          </div>

          {/* Live context chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="px-3 py-1 rounded-md bg-[#12121c] border border-zinc-800/60 text-xs text-zinc-400">
              Phase: <span className="text-white font-semibold">{matchPhase}</span>
            </span>
            <span className="px-3 py-1 rounded-md bg-[#12121c] border border-zinc-800/60 text-xs text-zinc-400">
              Run Rate: <span className="text-white font-semibold">{currentRR}</span>
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-[#0a0a0f] font-semibold py-3.5 px-6 rounded-[10px] transition-all duration-200 hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(163,230,53,0.15)] text-sm"
          >
            {loading ? 'Analyzing...' : 'Get Recommendation'}
          </button>
        </motion.form>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-500/[0.06] border border-red-500/20 text-red-300 p-4 rounded-xl text-sm mb-8"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-[#0e0e16] p-6 md:p-8 rounded-2xl border border-zinc-800/60 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white tracking-[-0.01em]">Analysis Result</h2>
                <span className="text-xs font-semibold tracking-[0.15em] uppercase text-lime-400/70 bg-lime-400/[0.06] px-3 py-1 rounded-md border border-lime-400/10">
                  {formData.format} · {matchPhase}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#12121c] border border-zinc-800/60 p-5 rounded-xl text-center">
                  <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Historical Matches</div>
                  <div className="text-3xl font-bold text-white tracking-tight">{Number(result.supportingDeliveryCount).toLocaleString()}</div>
                </div>
                <div className="bg-[#12121c] border border-zinc-800/60 p-5 rounded-xl text-center">
                  <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Expected Runs</div>
                  <div className="text-3xl font-bold text-lime-400 tracking-tight">{result.avgOutcome}</div>
                  <div className="text-xs text-zinc-600 mt-1">per over</div>
                </div>
                <div className="bg-[#12121c] border border-zinc-800/60 p-5 rounded-xl text-center">
                  <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Most Common</div>
                  <div className="text-3xl font-bold text-white tracking-tight">{result.mostCommonOutcome}</div>
                  <div className="text-xs text-zinc-600 mt-1">single outcome</div>
                </div>
              </div>

              <div className="bg-lime-400/[0.04] border border-lime-400/10 p-6 rounded-xl">
                <div className="text-sm font-semibold text-lime-400 mb-2">Tactical Recommendation</div>
                <p className="text-sm text-zinc-400 leading-relaxed">{result.recommendation}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
