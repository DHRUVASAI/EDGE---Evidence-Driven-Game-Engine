'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowLeftRight, ChevronDown } from 'lucide-react';
import Link from 'next/link';

// Helper to get initials
function getInitials(name: string): string {
  if (!name) return "";
  const words = name.trim().split(/\s+/);
  return words
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);
}

// Avatar component with fallback initials
function PlayerAvatar({ imageUrl, name, textSize = "text-base" }: { imageUrl: string | null; name: string; textSize?: string }) {
  const [error, setError] = useState(false);
  const initials = getInitials(name);

  useEffect(() => {
    setError(false);
  }, [imageUrl]);

  if (!imageUrl || error) {
    return (
      <div className={`flex items-center justify-center bg-lime-400/[0.06] text-lime-400 font-bold ${textSize} border border-lime-400/10 rounded-full w-full h-full`}>
        {initials}
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      onError={() => setError(true)}
      className="w-full h-full object-cover"
    />
  );
}

// ─── Types ───────────────────────────────────────────────────────
interface SearchResult {
  id: string;
  name: string;
  displayName: string;
  country: string | null;
  role: string | null;
  imageUrl: string | null;
  runs: number;
  wickets: number;
}

interface CareerStat {
  format: string;
  matches: number | null;
  innings: number | null;
  runs: number | null;
  avg: number | null;
  sr: number | null;
  hundreds: number | null;
  fifties: number | null;
  highScore: string | null;
  wickets: number | null;
  bowlAvg: number | null;
  bowlEcon: number | null;
  bowlSR: number | null;
  fiveWickets: number | null;
  catches: number | null;
  stumpings: number | null;
}

interface PlayerData {
  id: string;
  name: string;
  fullName: string | null;
  displayName: string;
  country: string | null;
  role: string | null;
  battingStyle: string | null;
  bowlingStyle: string | null;
  imageUrl: string | null;
  bio: string | null;
  careerStats: Record<string, CareerStat>;
}

interface MatchupSide {
  runs: number;
  balls: number;
  dismissals: number;
}

interface H2HData {
  player1: { id: string; name: string; imageUrl: string | null; careerStats: CareerStat | null };
  player2: { id: string; name: string; imageUrl: string | null; careerStats: CareerStat | null };
  matchup: { player1Batter: MatchupSide; player2Batter: MatchupSide };
}

// ─── Debounce Hook ───────────────────────────────────────────────
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ─── Autocomplete Search ─────────────────────────────────────────
function PlayerSearch({ onSelect, label, excludeId, loadingExternal }: { onSelect: (p: SearchResult) => void; label: string; excludeId?: string; loadingExternal?: boolean }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debouncedQuery.length < 2) { setResults([]); return; }
    setLoading(true);
    fetch(`/api/player-search?q=${encodeURIComponent(debouncedQuery)}`)
      .then(r => r.json())
      .then((data: SearchResult[]) => {
        const filtered = excludeId ? data.filter(p => p.id !== excludeId) : data;
        setResults(filtered.slice(0, 5));
        setIsOpen(true);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery, excludeId]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <label className="block text-xs font-semibold tracking-[0.15em] uppercase text-zinc-500 mb-3">{label}</label>
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Search player name..."
          className="w-full bg-[#0e0e16] border border-zinc-800/60 rounded-[10px] pl-11 pr-4 py-3.5 text-sm text-white placeholder-zinc-600 focus:ring-1 focus:ring-lime-500/50 focus:border-lime-500/50 transition-all focus:outline-none"
        />
        {(loading || loadingExternal) && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-zinc-600 border-t-lime-400 rounded-full animate-spin" />}
      </div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-[#0e0e16] border border-zinc-800/60 rounded-xl overflow-hidden shadow-2xl shadow-black/50"
          >
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => { onSelect(p); setQuery(p.displayName); setIsOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/40 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden shrink-0 border border-zinc-700/50 flex items-center justify-center">
                  <PlayerAvatar imageUrl={p.imageUrl} name={p.displayName} textSize="text-xs" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">{p.displayName}</div>
                  <div className="text-xs text-zinc-500">{[p.country, p.role].filter(Boolean).join(' · ')}</div>
                </div>
                <div className="ml-auto text-xs text-zinc-600 shrink-0">
                  {p.runs > 0 && <span>{p.runs} runs</span>}
                  {p.runs > 0 && p.wickets > 0 && <span> · </span>}
                  {p.wickets > 0 && <span>{p.wickets} wkts</span>}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Stat Value Display ──────────────────────────────────────────
function StatCell({ label, value, highlight }: { label: string; value: string | number | null | undefined; highlight?: boolean }) {
  const display = value === null || value === undefined ? '—' : value;
  return (
    <div className="flex flex-col items-center py-3 px-2">
      <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-lg font-bold tracking-tight ${highlight ? 'text-lime-400' : 'text-white'}`}>{display}</div>
    </div>
  );
}

// ─── Player Stats Card ──────────────────────────────────────────
function PlayerStatsCard({ player, compact }: { player: PlayerData; compact?: boolean }) {
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const formats = Object.keys(player.careerStats || {});

  useEffect(() => {
    if (formats.length > 0 && !formats.includes(selectedFormat)) {
      setSelectedFormat(formats[0]);
    }
  }, [formats, selectedFormat]);

  const stat = (player.careerStats || {})[selectedFormat];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-[#0e0e16] border border-zinc-800/60 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 pb-4 flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-zinc-800 overflow-hidden border border-zinc-700/50 shrink-0 flex items-center justify-center">
          <PlayerAvatar imageUrl={player.imageUrl} name={player.displayName} textSize="text-lg" />
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-white tracking-[-0.01em] truncate">{player.displayName}</h3>
          <div className="flex gap-2 mt-1">
            {player.country && <span className="text-xs text-zinc-500">{player.country}</span>}
            {player.role && <span className="text-xs text-zinc-500">· {player.role}</span>}
          </div>
          {player.battingStyle && <div className="text-xs text-zinc-600 mt-1">{player.battingStyle}{player.bowlingStyle ? ` · ${player.bowlingStyle}` : ''}</div>}
        </div>
      </div>

      {/* Format Tabs */}
      {formats.length > 0 && (
        <div className="px-6 flex gap-1">
          {formats.map(f => (
            <button
              key={f}
              onClick={() => setSelectedFormat(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                selectedFormat === f
                  ? 'bg-lime-400/[0.08] text-lime-400 border border-lime-400/10'
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      {stat ? (
        <div className="p-6 pt-4">
          <div className="grid grid-cols-4 gap-1 mb-3">
            <StatCell label="M" value={stat.matches} />
            <StatCell label="Inn" value={stat.innings} />
            <StatCell label="Runs" value={stat.runs} highlight />
            <StatCell label="Avg" value={stat.avg?.toFixed(1)} />
          </div>
          <div className="grid grid-cols-4 gap-1 mb-3">
            <StatCell label="SR" value={stat.sr?.toFixed(1)} />
            <StatCell label="100s" value={stat.hundreds} />
            <StatCell label="50s" value={stat.fifties} />
            <StatCell label="HS" value={stat.highScore} />
          </div>
          {(stat.wickets && stat.wickets > 0) && (
            <>
              <div className="border-t border-zinc-800/40 my-3" />
              <div className="grid grid-cols-4 gap-1">
                <StatCell label="Wkts" value={stat.wickets} highlight />
                <StatCell label="BAvg" value={stat.bowlAvg?.toFixed(1)} />
                <StatCell label="Econ" value={stat.bowlEcon?.toFixed(1)} />
                <StatCell label="5W" value={stat.fiveWickets} />
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="p-6 text-center text-sm text-zinc-600">No career stats found for this player.</div>
      )}
    </motion.div>
  );
}

// ─── Head-to-Head Section ────────────────────────────────────────
function HeadToHead({ h2h, p1Name, p2Name }: { h2h: H2HData; p1Name: string; p2Name: string }) {
  const { player1Batter, player2Batter } = h2h.matchup;
  const hasData = player1Batter.balls > 0 || player2Batter.balls > 0;

  if (!hasData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0e0e16] border border-zinc-800/60 rounded-2xl p-8 text-center"
      >
        <ArrowLeftRight size={24} className="text-zinc-700 mx-auto mb-3" />
        <p className="text-sm text-zinc-500">No head-to-head delivery data found between these two players.</p>
      </motion.div>
    );
  }

  const sr1 = player1Batter.balls > 0 ? ((player1Batter.runs / player1Batter.balls) * 100).toFixed(1) : '—';
  const sr2 = player2Batter.balls > 0 ? ((player2Batter.runs / player2Batter.balls) * 100).toFixed(1) : '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-[#0e0e16] border border-zinc-800/60 rounded-2xl overflow-hidden"
    >
      <div className="p-6 border-b border-zinc-800/40">
        <div className="flex items-center gap-2">
          <ArrowLeftRight size={16} className="text-lime-400" />
          <h3 className="text-sm font-bold text-white">Head-to-Head Matchup</h3>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* P1 batting vs P2 bowling */}
        {player1Batter.balls > 0 && (
          <div>
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              {p1Name} <span className="text-zinc-700">batting vs</span> {p2Name} <span className="text-zinc-700">bowling</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              <StatCell label="Balls" value={player1Batter.balls} />
              <StatCell label="Runs" value={player1Batter.runs} highlight />
              <StatCell label="Outs" value={player1Batter.dismissals} />
              <StatCell label="SR" value={sr1} />
            </div>
          </div>
        )}

        {/* P2 batting vs P1 bowling */}
        {player2Batter.balls > 0 && (
          <div>
            {player1Batter.balls > 0 && <div className="border-t border-zinc-800/40 mb-6" />}
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              {p2Name} <span className="text-zinc-700">batting vs</span> {p1Name} <span className="text-zinc-700">bowling</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              <StatCell label="Balls" value={player2Batter.balls} />
              <StatCell label="Runs" value={player2Batter.runs} highlight />
              <StatCell label="Outs" value={player2Batter.dismissals} />
              <StatCell label="SR" value={sr2} />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function PlayersPage() {
  const [player1, setPlayer1] = useState<PlayerData | null>(null);
  const [player2, setPlayer2] = useState<PlayerData | null>(null);
  const [h2hData, setH2hData] = useState<H2HData | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [loadingP1, setLoadingP1] = useState(false);
  const [loadingP2, setLoadingP2] = useState(false);
  const [loadingH2H, setLoadingH2H] = useState(false);
  const [h2hFormat, setH2hFormat] = useState('T20');

  const loadPlayer = useCallback(async (id: string, slot: 1 | 2) => {
    const setLoading = slot === 1 ? setLoadingP1 : setLoadingP2;
    const setPlayer = slot === 1 ? setPlayer1 : setPlayer2;
    setLoading(true);
    try {
      const res = await fetch(`/api/player-stats/${id}`);
      const data = await res.json();
      setPlayer(data);
    } catch { setPlayer(null); }
    finally { setLoading(false); }
  }, []);

  // Fetch H2H when both players are selected
  useEffect(() => {
    if (!player1 || !player2) { setH2hData(null); return; }
    setLoadingH2H(true);
    fetch(`/api/h2h?player1=${player1.id}&player2=${player2.id}&format=${h2hFormat}`)
      .then(r => r.json())
      .then(setH2hData)
      .catch(() => setH2hData(null))
      .finally(() => setLoadingH2H(false));
  }, [player1, player2, h2hFormat]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans selection:bg-lime-500/30 selection:text-lime-200">
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Page Header */}
        <div className="mb-12">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500 block mb-4"
          >
            Player Intelligence
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold text-white tracking-[-0.03em] mb-4"
          >
            Search &amp; Compare
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base text-zinc-500 max-w-xl"
          >
            Explore career statistics and head-to-head matchup data for any player in the database.
          </motion.p>
        </div>

        {/* Search Bars */}
        <div className={`grid gap-6 mb-10 ${compareMode ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-lg'}`}>
          <PlayerSearch
            label="Player 1"
            onSelect={(p) => loadPlayer(p.id, 1)}
            excludeId={player2?.id}
            loadingExternal={loadingP1}
          />
          <AnimatePresence>
            {compareMode && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <PlayerSearch
                  label="Player 2"
                  onSelect={(p) => loadPlayer(p.id, 2)}
                  excludeId={player1?.id}
                  loadingExternal={loadingP2}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Compare Toggle */}
        {player1 && !compareMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-10">
            <button
              onClick={() => setCompareMode(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0e0e16] border border-zinc-800/60 rounded-[10px] text-xs font-semibold text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
            >
              <ArrowLeftRight size={14} />
              Compare with another player
            </button>
          </motion.div>
        )}



        {/* Player Cards */}
        {(player1 || player2) && !loadingP1 && !loadingP2 && (
          <div className={`grid gap-6 mb-10 ${compareMode && player2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-lg'}`}>
            {player1 && <PlayerStatsCard player={player1} />}
            {compareMode && player2 && <PlayerStatsCard player={player2} />}
          </div>
        )}

        {/* H2H Format Selector + Data */}
        {compareMode && player1 && player2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold tracking-[0.15em] uppercase text-zinc-500">Format</span>
              <div className="flex gap-1">
                {['T20', 'ODI', 'Test'].map(f => (
                  <button
                    key={f}
                    onClick={() => setH2hFormat(f)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      h2hFormat === f
                        ? 'bg-lime-400/[0.08] text-lime-400 border border-lime-400/10'
                        : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {loadingH2H ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-zinc-700 border-t-lime-400 rounded-full animate-spin" />
              </div>
            ) : h2hData ? (
              <HeadToHead h2h={h2hData} p1Name={player1.displayName || player1.name} p2Name={player2.displayName || player2.name} />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
