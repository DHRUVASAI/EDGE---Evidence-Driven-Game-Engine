'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowLeft, Search, Zap } from 'lucide-react';
import Link from 'next/link';

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<'situation' | 'bowling'>('situation');

  // Situation tab state
  const [situationData, setSituationData] = useState({
    format: 'T20',
    over: 5,
    score: 45,
    wickets: 1
  });

  // Bowling tab state
  const [bowlingData, setBowlingData] = useState({
    format: 'T20',
    over: 10,
    score: 80,
    wickets: 3,
    currentBowler: 'RA Jadeja',
    runsConceded: 16,
    wicketsTaken: 1,
    oversBowled: 2
  });

  // Autocomplete state
  const [bowlerQuery, setBowlerQuery] = useState('RA Jadeja');
  const [bowlerSuggestions, setBowlerSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [formatDropdownOpen, setFormatDropdownOpen] = useState(false);

  // Read URL search params to set active tab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'bowling') {
        setActiveTab('bowling');
        setResult(null);
      } else if (tabParam === 'situation') {
        setActiveTab('situation');
        setResult(null);
      }
    }
  }, []);

  // Fetch bowler suggestions
  useEffect(() => {
    if (bowlerQuery.length < 2) {
      setBowlerSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/player-search?q=${encodeURIComponent(bowlerQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setBowlerSuggestions(data);
        }
      } catch (err) {
        console.error('Error fetching player suggestions:', err);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [bowlerQuery]);

  const handleSituationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSituationData(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
    }));
  };

  const handleBowlingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBowlingData(prev => ({
      ...prev,
      [name]: ['over', 'score', 'wickets', 'runsConceded', 'wicketsTaken', 'oversBowled'].includes(name)
        ? (name === 'oversBowled' ? parseFloat(value) || 0 : parseInt(value) || 0)
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    const payload = activeTab === 'situation' 
      ? { mode: 'situation', ...situationData }
      : { mode: 'bowling', ...bowlingData, currentBowler: bowlerQuery };

    // Validations
    if (payload.over >= (payload.format === 'T20' ? 20 : 50)) {
      setError(`Overs completed must be less than ${payload.format === 'T20' ? 20 : 50} for format ${payload.format}.`);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  const currentRR = activeTab === 'situation'
    ? (situationData.over > 0 ? (situationData.score / situationData.over).toFixed(1) : '0.0')
    : (bowlingData.over > 0 ? (bowlingData.score / bowlingData.over).toFixed(1) : '0.0');

  const matchPhase = activeTab === 'situation'
    ? (situationData.over < (situationData.format === 'T20' ? 6 : 10) ? 'Powerplay' : situationData.over < (situationData.format === 'T20' ? 16 : 40) ? 'Middle' : 'Death')
    : (bowlingData.over < (bowlingData.format === 'T20' ? 6 : 10) ? 'Powerplay' : bowlingData.over < (bowlingData.format === 'T20' ? 16 : 40) ? 'Middle' : 'Death');

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans selection:bg-lime-500/30 selection:text-lime-200 pb-20">
      <div className="max-w-3xl mx-auto px-6 py-12">
        
        {/* Navigation back */}
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-all text-xs font-semibold mb-8 group">
          <ArrowLeft size={14} className="group-hover:translate-x-[-2px] transition-transform" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-10">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500 block mb-3">
            Decision Engine
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-[-0.03em] mb-4">
            Tactical Advisory Center
          </h1>
          <p className="text-base text-zinc-500 max-w-xl">
            Input live match details to obtain explainable AI suggestions and match predictions backed by historical cricket delivery analytics.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-zinc-800/80 mb-8">
          <button
            onClick={() => { setActiveTab('situation'); setResult(null); setError(''); }}
            className={`flex items-center gap-2 pb-4 px-6 text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'situation'
                ? 'border-lime-400 text-lime-400 font-black'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Search size={16} />
            Match Situation
          </button>
          <button
            onClick={() => { setActiveTab('bowling'); setResult(null); setError(''); }}
            className={`flex items-center gap-2 pb-4 px-6 text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'bowling'
                ? 'border-emerald-400 text-emerald-400 font-black'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Zap size={16} />
            Bowling Change
          </button>
        </div>

        {/* Form panel */}
        <motion.form
          onSubmit={handleSubmit}
          className="bg-[#0e0e16] p-6 md:p-8 rounded-2xl border border-zinc-800/60 mb-8"
        >
          {activeTab === 'situation' ? (
            /* ==========================================
               SITUATION FORM
               ========================================== */
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Over Completed</label>
                <input
                  type="number"
                  name="over"
                  min="0"
                  max={situationData.format === 'T20' ? '19' : '49'}
                  value={situationData.over}
                  onChange={handleSituationChange}
                  className="w-full bg-[#12121c] border border-zinc-800/60 rounded-[10px] p-3 text-white text-sm focus:ring-1 focus:ring-lime-500/50 focus:border-lime-500/50 transition-all focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Score</label>
                <input
                  type="number"
                  name="score"
                  min="0"
                  value={situationData.score}
                  onChange={handleSituationChange}
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
                  value={situationData.wickets}
                  onChange={handleSituationChange}
                  className="w-full bg-[#12121c] border border-zinc-800/60 rounded-[10px] p-3 text-white text-sm focus:ring-1 focus:ring-lime-500/50 focus:border-lime-500/50 transition-all focus:outline-none"
                />
              </div>
              <div className="relative z-20">
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Format</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setFormatDropdownOpen(!formatDropdownOpen)}
                    className="w-full bg-[#12121c] border border-zinc-800/60 rounded-[10px] p-3 text-white text-sm focus:ring-1 focus:ring-lime-500/50 text-left flex justify-between items-center transition-all focus:outline-none cursor-pointer"
                  >
                    <span>{situationData.format}</span>
                    <svg
                      className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${formatDropdownOpen ? 'transform rotate-180' : ''}`}
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
                        {['T20', 'ODI'].map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => {
                              setSituationData(prev => ({ ...prev, format: f, over: f === 'T20' ? 5 : 15, score: f === 'T20' ? 45 : 75 }));
                              setFormatDropdownOpen(false);
                            }}
                            className={`w-full text-left p-3 text-sm transition-all hover:bg-lime-400/10 hover:text-lime-400 ${
                              situationData.format === f ? 'text-lime-400 bg-lime-400/[0.03] font-bold' : 'text-zinc-300'
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
            </div>
          ) : (
            /* ==========================================
               BOWLING CHANGE FORM
               ========================================== */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bowler Input */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Current Bowler</label>
                  <input
                    type="text"
                    value={bowlerQuery}
                    onChange={(e) => { setBowlerQuery(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full bg-[#12121c] border border-zinc-800/60 rounded-[10px] p-3 text-white text-sm focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all focus:outline-none"
                    placeholder="e.g. RA Jadeja, JJ Bumrah"
                  />
                  {showSuggestions && bowlerSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 mt-2 bg-[#12121c] border border-zinc-800/80 rounded-[10px] overflow-hidden shadow-xl z-30 max-h-48 overflow-y-auto">
                      {bowlerSuggestions.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setBowlerQuery(s.name);
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left p-3 text-xs text-zinc-300 hover:bg-emerald-400/10 hover:text-emerald-400 border-b border-zinc-800/40 last:border-b-0 flex justify-between"
                        >
                          <span className="font-bold">{s.name}</span>
                          <span className="text-[10px] text-zinc-500">{s.country} · {s.role}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bowler Overs Bowled */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Overs</label>
                    <input
                      type="number"
                      name="oversBowled"
                      min="1"
                      max="10"
                      value={bowlingData.oversBowled}
                      onChange={handleBowlingChange}
                      className="w-full bg-[#12121c] border border-zinc-800/60 rounded-[10px] p-3 text-white text-sm focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Runs Conc.</label>
                    <input
                      type="number"
                      name="runsConceded"
                      min="0"
                      value={bowlingData.runsConceded}
                      onChange={handleBowlingChange}
                      className="w-full bg-[#12121c] border border-zinc-800/60 rounded-[10px] p-3 text-white text-sm focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Wickets</label>
                    <input
                      type="number"
                      name="wicketsTaken"
                      min="0"
                      max="10"
                      value={bowlingData.wicketsTaken}
                      onChange={handleBowlingChange}
                      className="w-full bg-[#12121c] border border-zinc-800/60 rounded-[10px] p-3 text-white text-sm focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Over Completed</label>
                  <input
                    type="number"
                    name="over"
                    min="0"
                    max={bowlingData.format === 'T20' ? '19' : '49'}
                    value={bowlingData.over}
                    onChange={handleBowlingChange}
                    className="w-full bg-[#12121c] border border-zinc-800/60 rounded-[10px] p-3 text-white text-sm focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Match Score</label>
                  <input
                    type="number"
                    name="score"
                    min="0"
                    value={bowlingData.score}
                    onChange={handleBowlingChange}
                    className="w-full bg-[#12121c] border border-zinc-800/60 rounded-[10px] p-3 text-white text-sm focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Match Wkts Down</label>
                  <input
                    type="number"
                    name="wickets"
                    min="0"
                    max="10"
                    value={bowlingData.wickets}
                    onChange={handleBowlingChange}
                    className="w-full bg-[#12121c] border border-zinc-800/60 rounded-[10px] p-3 text-white text-sm focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all focus:outline-none"
                  />
                </div>
                <div className="relative z-20">
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Format</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setFormatDropdownOpen(!formatDropdownOpen)}
                      className="w-full bg-[#12121c] border border-zinc-800/60 rounded-[10px] p-3 text-white text-sm focus:ring-1 focus:ring-emerald-500/50 text-left flex justify-between items-center transition-all focus:outline-none cursor-pointer"
                    >
                      <span>{bowlingData.format}</span>
                      <svg
                        className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${formatDropdownOpen ? 'transform rotate-180' : ''}`}
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
                          {['T20', 'ODI'].map((f) => (
                            <button
                              key={f}
                              type="button"
                              onClick={() => {
                                setBowlingData(prev => ({ ...prev, format: f, over: f === 'T20' ? 10 : 30, score: f === 'T20' ? 80 : 150 }));
                                setFormatDropdownOpen(false);
                              }}
                              className={`w-full text-left p-3 text-sm transition-all hover:bg-emerald-400/10 hover:text-emerald-400 ${
                                bowlingData.format === f ? 'text-emerald-400 bg-emerald-400/[0.03] font-bold' : 'text-zinc-300'
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
              </div>
            </div>
          )}

          {/* Context chips */}
          <div className="flex flex-wrap gap-2 my-6">
            <span className="px-3 py-1 rounded-md bg-[#12121c] border border-zinc-800/60 text-xs text-zinc-400">
              Phase: <span className="text-white font-semibold">{matchPhase}</span>
            </span>
            <span className="px-3 py-1 rounded-md bg-[#12121c] border border-zinc-800/60 text-xs text-zinc-400">
              Match Run Rate: <span className="text-white font-semibold">{currentRR}</span>
            </span>
            {activeTab === 'bowling' && (
              <span className="px-3 py-1 rounded-md bg-[#12121c] border border-zinc-800/60 text-xs text-zinc-400">
                Bowler Econ: <span className="text-emerald-400 font-semibold">{(bowlingData.runsConceded / Math.max(1, bowlingData.oversBowled)).toFixed(1)}</span>
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full font-semibold py-3.5 px-6 rounded-[10px] transition-all duration-200 hover:scale-[1.005] text-sm cursor-pointer ${
              activeTab === 'situation'
                ? 'bg-lime-400 hover:bg-lime-300 text-[#0a0a0f] hover:shadow-[0_0_20px_rgba(163,230,53,0.15)]'
                : 'bg-emerald-500 hover:bg-emerald-400 text-white hover:shadow-[0_0_20px_rgba(52,211,153,0.15)]'
            }`}
          >
            {loading ? 'Analyzing Situation...' : 'Get Explainable AI Advisory'}
          </button>
        </motion.form>

        {/* Error Message */}
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

        {/* Results output */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-[#0e0e16] p-6 md:p-8 rounded-2xl border border-zinc-800/60 space-y-6"
            >
              {activeTab === 'situation' ? (
                /* ==========================================
                   SITUATION RESULTS
                   ========================================== */
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white tracking-[-0.01em]">Analysis Result</h2>
                    <span className="text-xs font-semibold tracking-[0.15em] uppercase text-lime-400/70 bg-lime-400/[0.06] px-3 py-1 rounded-md border border-lime-400/10">
                      {situationData.format} · {matchPhase}
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
                </>
              ) : (
                /* ==========================================
                   BOWLING RESULTS
                   ========================================== */
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white tracking-[-0.01em]">Bowling Spell Advisory</h2>
                    <span className={`text-xs font-semibold tracking-[0.15em] uppercase px-3 py-1 rounded-md border ${
                      result.action === 'continue' 
                        ? 'text-emerald-400 bg-emerald-400/[0.06] border-emerald-400/10'
                        : 'text-rose-400 bg-rose-400/[0.06] border-rose-400/10'
                    }`}>
                      {result.action === 'continue' ? 'Continue Spell' : 'Bowling Change'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#12121c] border border-zinc-800/60 p-4 rounded-xl text-center">
                      <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Bowler Style</div>
                      <div className="text-lg font-bold text-white capitalize">{result.bowlerStyle}</div>
                    </div>
                    <div className="bg-[#12121c] border border-zinc-800/60 p-4 rounded-xl text-center">
                      <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Bowler Over Econ</div>
                      <div className="text-xl font-bold text-emerald-400">{result.bowlerAvgRuns}</div>
                      <div className="text-[9px] text-zinc-600 mt-1">historical avg</div>
                    </div>
                    <div className="bg-[#12121c] border border-zinc-800/60 p-4 rounded-xl text-center">
                      <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Expected Pace Econ</div>
                      <div className="text-xl font-bold text-white">{result.paceAvgRuns}</div>
                      <div className="text-[9px] text-zinc-600 mt-1">phase avg</div>
                    </div>
                    <div className="bg-[#12121c] border border-zinc-800/60 p-4 rounded-xl text-center">
                      <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Expected Spin Econ</div>
                      <div className="text-xl font-bold text-white">{result.spinAvgRuns}</div>
                      <div className="text-[9px] text-zinc-600 mt-1">phase avg</div>
                    </div>
                  </div>

                  <div className={`p-6 rounded-xl border ${
                    result.action === 'continue'
                      ? 'bg-emerald-500/[0.04] border-emerald-500/10'
                      : 'bg-rose-500/[0.04] border-rose-500/10'
                  }`}>
                    <div className={`text-sm font-semibold mb-2 ${
                      result.action === 'continue' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      Recommendation Details
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed">{result.recommendation}</p>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
