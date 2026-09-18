"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowLeftRight, Calendar, Award, Zap, Trophy, Shield } from "lucide-react";
import Link from "next/link";

// Helper to get initials
function getInitials(name: string): string {
  if (!name) return "";
  const words = name.trim().split(/\s+/);
  return words
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);
}

// Avatar component with fallback initials
function PlayerAvatar({
  imageUrl,
  name,
  textSize = "text-xl",
}: {
  imageUrl: string | null;
  name: string;
  textSize?: string;
}) {
  const [error, setError] = useState(false);
  const initials = getInitials(name);

  useEffect(() => {
    setError(false);
  }, [imageUrl]);

  if (!imageUrl || error) {
    return (
      <div
        className={`flex items-center justify-center bg-lime-400/[0.04] text-lime-400 font-extrabold ${textSize} border border-lime-400/10 rounded-full w-full h-full`}
      >
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

// Types
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
  bio?: string | null;
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

// Debounce Hook
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Autocomplete Search input component
function PlayerSearch({
  onSelect,
  placeholder,
  excludeId,
  loadingExternal,
}: {
  onSelect: (p: SearchResult) => void;
  placeholder: string;
  excludeId?: string;
  loadingExternal?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    fetch(`/api/player-search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data: SearchResult[]) => {
        const filtered = excludeId ? data.filter((p) => p.id !== excludeId) : data;
        setResults(filtered.slice(0, 5));
        setIsOpen(true);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery, excludeId]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-zinc-900/40 border border-zinc-800/80 rounded-xl pl-11 pr-10 py-3 text-sm text-white placeholder-zinc-500 focus:ring-1 focus:ring-lime-500/50 focus:border-lime-500/50 transition-all focus:outline-none"
        />
        {(loading || loadingExternal) && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-zinc-700 border-t-lime-400 rounded-full animate-spin" />
        )}
      </div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-zinc-950 border border-zinc-850 rounded-xl overflow-hidden shadow-2xl"
          >
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onSelect(p);
                  setQuery("");
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-900 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-zinc-900 overflow-hidden shrink-0 border border-zinc-800 flex items-center justify-center">
                  <PlayerAvatar imageUrl={p.imageUrl} name={p.displayName} textSize="text-xs" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{p.displayName}</div>
                  <div className="text-[10px] text-zinc-500">
                    {[p.country, p.role].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <div className="ml-auto text-[10px] font-bold text-zinc-500 shrink-0">
                  {p.runs > 0 && <span>{p.runs} R</span>}
                  {p.runs > 0 && p.wickets > 0 && <span> · </span>}
                  {p.wickets > 0 && <span>{p.wickets} W</span>}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Stat Box in Cricket Card
function CardStat({ label, value, highlight }: { label: string; value: string | number | null; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center py-2 px-1 bg-zinc-900/40 rounded border border-zinc-800/30">
      <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">{label}</span>
      <span className={`text-xs font-extrabold mt-0.5 ${highlight ? "text-lime-400" : "text-white"}`}>
        {value === null || value === undefined ? "—" : value}
      </span>
    </div>
  );
}

// FUT/Cricket Trading Card Component
function CricketCard({
  player,
  onCompare,
  onRemove,
  showCompareButton = true,
}: {
  player: PlayerData;
  onCompare?: () => void;
  onRemove?: () => void;
  showCompareButton?: boolean;
}) {
  const [format, setFormat] = useState<string>("T20");
  const formats = Object.keys(player.careerStats || {});

  useEffect(() => {
    if (formats.length > 0 && !formats.includes(format)) {
      setFormat(formats.includes("IPL") ? "IPL" : formats[0]);
    }
  }, [formats, format]);

  const stat = (player.careerStats || {})[format];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="relative w-80 md:w-88 h-[490px] bg-gradient-to-b from-[#161622] via-[#0a0a0f] to-[#07070b] border border-zinc-800 rounded-3xl p-5 flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.7)] group overflow-hidden"
    >
      {/* Remove card button */}
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-4 right-4 z-20 p-1 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800/80 transition-colors"
        >
          <X size={14} />
        </button>
      )}

      {/* Decorative light overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-lime-500/[0.04] to-transparent opacity-60 pointer-events-none" />

      {/* Card Header Info */}
      <div className="flex justify-between items-start z-10">
        <div>
          <span className="text-[10px] font-bold text-lime-400 tracking-wider bg-lime-400/[0.06] border border-lime-400/10 px-2 py-0.5 rounded-full uppercase">
            {player.role || "Player"}
          </span>
        </div>
        <div className="text-right">
          <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            {player.country || "Int'l"}
          </span>
        </div>
      </div>

      {/* Hero Photo Section */}
      <div className="flex flex-col items-center justify-center mt-2 z-10">
        <div className="w-36 h-36 rounded-full border-2 border-lime-400/20 bg-zinc-900/80 overflow-hidden flex items-center justify-center shadow-[0_0_25px_rgba(163,230,53,0.06)] group-hover:border-lime-500/40 transition-all duration-300">
          <PlayerAvatar imageUrl={player.imageUrl} name={player.displayName} />
        </div>
        <h3 className="text-lg font-black tracking-tight text-white uppercase mt-4 text-center">
          {player.displayName}
        </h3>
        <p className="text-[10px] text-zinc-500 font-semibold uppercase mt-0.5 tracking-wider">
          {player.battingStyle || "Right-hand bat"}
        </p>
      </div>

      {/* Format Selector inside Card */}
      <div className="flex justify-center gap-1 my-3 z-10">
        {formats.map((f) => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className={`px-2 py-1 rounded text-[9px] font-bold tracking-wider uppercase transition-all ${
              format === f
                ? "bg-lime-400 text-black font-extrabold"
                : "text-zinc-500 hover:text-zinc-300 bg-zinc-900/40"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Card Stats Grid */}
      <div className="z-10 bg-zinc-950/40 border border-zinc-900 rounded-xl p-3">
        {stat ? (
          <div className="grid grid-cols-3 gap-2">
            <CardStat label="MAT" value={stat.matches} />
            <CardStat label="RUNS" value={stat.runs} highlight />
            <CardStat label="AVG" value={stat.avg ? stat.avg.toFixed(1) : "—"} />
            <CardStat label="SR" value={stat.sr ? stat.sr.toFixed(1) : "—"} />
            <CardStat label="WKT" value={stat.wickets || 0} highlight={!!stat.wickets && stat.wickets > 0} />
            <CardStat label="ECON" value={stat.bowlEcon ? stat.bowlEcon.toFixed(1) : "—"} />
          </div>
        ) : (
          <p className="text-[10px] text-zinc-650 text-center py-4 uppercase font-semibold">
            No statistics loaded
          </p>
        )}
      </div>

      {/* Action Compare Option */}
      {showCompareButton && onCompare && (
        <button
          onClick={onCompare}
          className="w-full mt-4 py-2 text-[10px] font-bold text-center uppercase tracking-wider text-lime-400 bg-lime-400/[0.04] border border-lime-500/10 rounded-xl hover:bg-lime-400 hover:text-black transition-all hover:scale-[1.01] flex items-center justify-center gap-1.5 z-10"
        >
          <ArrowLeftRight size={12} />
          Compare matchup VS
        </button>
      )}
    </motion.div>
  );
}

// Side-by-side Comparative Stat Rows
function CompareRow({
  label,
  val1,
  val2,
  better,
}: {
  label: string;
  val1: number | string | null | undefined;
  val2: number | string | null | undefined;
  better?: 1 | 2 | null;
}) {
  const formatVal = (v: any) => (v === null || v === undefined ? "—" : v);
  return (
    <div className="grid grid-cols-3 gap-2 items-center py-2.5 px-4 border-b border-zinc-900 text-xs">
      <div className={`text-left font-bold ${better === 1 ? "text-lime-400 font-black" : "text-zinc-400"}`}>
        {formatVal(val1)}
      </div>
      <div className="text-center text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
        {label}
      </div>
      <div className={`text-right font-bold ${better === 2 ? "text-lime-400 font-black" : "text-zinc-400"}`}>
        {formatVal(val2)}
      </div>
    </div>
  );
}

// Head-to-Head Duel Segment
function HeadToHeadDuel({ h2h, p1Name, p2Name }: { h2h: H2HData; p1Name: string; p2Name: string }) {
  const { player1Batter, player2Batter } = h2h.matchup;
  const hasData = player1Batter.balls > 0 || player2Batter.balls > 0;

  if (!hasData) {
    return (
      <div className="w-full max-w-xl mx-auto rounded-2xl border border-zinc-900 bg-zinc-950/40 p-6 text-center text-zinc-500 text-xs">
        No head-to-head match logs found between these players.
      </div>
    );
  }

  const getStrikeRate = (side: MatchupSide) => {
    if (side.balls === 0) return 0;
    return (side.runs / side.balls) * 100;
  };

  const sr1 = getStrikeRate(player1Batter);
  const sr2 = getStrikeRate(player2Batter);

  return (
    <div className="w-full max-w-2xl mx-auto bg-gradient-to-b from-[#11111a] to-[#07070a] border border-zinc-800/80 rounded-2xl p-6 flex flex-col gap-6">
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <ArrowLeftRight size={14} className="text-lime-400" />
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
          Head-To-Head Matchup Duel
        </h4>
      </div>

      <div className="flex flex-col gap-5">
        {/* P1 Batter vs P2 Bowler */}
        {player1Batter.balls > 0 && (
          <div className="flex flex-col gap-2">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              {p1Name} <span className="text-zinc-650">vs</span> {p2Name}
            </div>
            <div className="grid grid-cols-4 gap-2 bg-zinc-950/50 p-3 rounded-xl border border-zinc-900">
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-zinc-500 uppercase font-semibold">Balls</span>
                <span className="text-xs font-extrabold text-white mt-0.5">{player1Batter.balls}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-zinc-500 uppercase font-semibold">Runs</span>
                <span className="text-xs font-extrabold text-lime-400 mt-0.5">{player1Batter.runs}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-zinc-500 uppercase font-semibold">Outs</span>
                <span className="text-xs font-extrabold text-red-500 mt-0.5">{player1Batter.dismissals}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-zinc-500 uppercase font-semibold">S/R</span>
                <span className="text-xs font-extrabold text-white mt-0.5">{sr1.toFixed(1)}</span>
              </div>
            </div>
          </div>
        )}

        {/* P2 Batter vs P1 Bowler */}
        {player2Batter.balls > 0 && (
          <div className="flex flex-col gap-2">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              {p2Name} <span className="text-zinc-650">vs</span> {p1Name}
            </div>
            <div className="grid grid-cols-4 gap-2 bg-zinc-950/50 p-3 rounded-xl border border-zinc-900">
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-zinc-500 uppercase font-semibold">Balls</span>
                <span className="text-xs font-extrabold text-white mt-0.5">{player2Batter.balls}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-zinc-500 uppercase font-semibold">Runs</span>
                <span className="text-xs font-extrabold text-lime-400 mt-0.5">{player2Batter.runs}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-zinc-500 uppercase font-semibold">Outs</span>
                <span className="text-xs font-extrabold text-red-500 mt-0.5">{player2Batter.dismissals}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-zinc-500 uppercase font-semibold">S/R</span>
                <span className="text-xs font-extrabold text-white mt-0.5">{sr2.toFixed(1)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PlayersPage() {
  const [player1, setPlayer1] = useState<PlayerData | null>(null);
  const [player2, setPlayer2] = useState<PlayerData | null>(null);
  const [h2hData, setH2hData] = useState<H2HData | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [loadingP1, setLoadingP1] = useState(false);
  const [loadingP2, setLoadingP2] = useState(false);
  const [loadingH2H, setLoadingH2H] = useState(false);
  const [h2hFormat, setH2hFormat] = useState("T20");

  const loadPlayer = useCallback(async (id: string, slot: 1 | 2) => {
    const setLoading = slot === 1 ? setLoadingP1 : setLoadingP2;
    const setPlayer = slot === 1 ? setPlayer1 : setPlayer2;
    setLoading(true);
    try {
      const res = await fetch(`/api/player-stats/${id}`);
      const data = await res.json();
      setPlayer(data);
    } catch {
      setPlayer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch H2H when both players are selected
  useEffect(() => {
    if (!player1 || !player2) {
      setH2hData(null);
      return;
    }
    setLoadingH2H(true);
    fetch(`/api/h2h?player1=${player1.id}&player2=${player2.id}&format=${h2hFormat}`)
      .then((r) => r.json())
      .then(setH2hData)
      .catch(() => setH2hData(null))
      .finally(() => setLoadingH2H(false));
  }, [player1, player2, h2hFormat]);

  // Helper to figure out better stat in comparison
  const getBetterStat = (key: keyof CareerStat, format: string, isLowerBetter = false) => {
    if (!player1 || !player2) return null;
    const s1 = player1.careerStats[format];
    const s2 = player2.careerStats[format];
    if (!s1 || !s2) return null;
    const v1 = s1[key];
    const v2 = s2[key];
    if (v1 === null || v1 === undefined || v2 === null || v2 === undefined) return null;

    if (typeof v1 === "number" && typeof v2 === "number") {
      if (v1 === v2) return null;
      if (isLowerBetter) {
        return v1 < v2 ? 1 : 2;
      }
      return v1 > v2 ? 1 : 2;
    }
    return null;
  };

  // Synchronized format for comparison
  const [compareFormat, setCompareFormat] = useState("T20");

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans selection:bg-lime-500/30 selection:text-lime-200">
      {/* Decorative background lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(163,230,53,0.03),transparent_70%)] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 py-16 relative z-10">
        {/* Page Header */}
        <div className="mb-12 text-center sm:text-left">
          <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-zinc-500 block mb-3">
            Analytic Modules
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            PLAYER MATCHUP DUELS
          </h1>
          <p className="text-xs text-zinc-500 mt-2 max-w-xl">
            Evaluate individual cricket trading card metrics, load dynamic comparison grids, and run ball-by-ball head-to-head match records.
          </p>
        </div>

        {/* Search Console Area */}
        <div className="max-w-lg mx-auto sm:mx-0 mb-10 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <PlayerSearch
              placeholder="Search first player..."
              onSelect={(p) => loadPlayer(p.id, 1)}
              excludeId={player2?.id}
              loadingExternal={loadingP1}
            />

            {compareMode && (
              <PlayerSearch
                placeholder="Search second player..."
                onSelect={(p) => loadPlayer(p.id, 2)}
                excludeId={player1?.id}
                loadingExternal={loadingP2}
              />
            )}
          </div>
        </div>

        {/* Trading Cards Workspace */}
        <div className="flex flex-col items-center gap-10">
          {/* Layout for cards */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full">
            {player1 && (
              <CricketCard
                player={player1}
                showCompareButton={!compareMode}
                onCompare={() => setCompareMode(true)}
                onRemove={() => {
                  setPlayer1(null);
                  setCompareMode(false);
                }}
              />
            )}

            {compareMode && player1 && player2 && (
              <div className="hidden md:flex flex-col items-center justify-center bg-zinc-900 border border-zinc-800 rounded-full w-10 h-10 shrink-0 select-none">
                <span className="text-xs font-black text-lime-400">VS</span>
              </div>
            )}

            {compareMode && player2 && (
              <CricketCard
                player={player2}
                showCompareButton={false}
                onRemove={() => {
                  setPlayer2(null);
                }}
              />
            )}
          </div>

          {/* Unified Stats Comparison Grid (Side-by-side) */}
          {compareMode && player1 && player2 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-2xl bg-zinc-950/40 border border-zinc-850 rounded-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-zinc-900 flex items-center justify-between">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  Side-By-Side Stats Comparison
                </h4>
                {/* Unified format selector */}
                <div className="flex gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                  {["T20", "ODI", "Test", "IPL"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setCompareFormat(f)}
                      className={`px-2 py-1 rounded text-[8px] font-bold tracking-wider uppercase transition-all ${
                        compareFormat === f
                          ? "bg-lime-400 text-black font-extrabold"
                          : "text-zinc-500 hover:text-zinc-350"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stat rows */}
              <div className="flex flex-col">
                <CompareRow
                  label="Matches"
                  val1={player1.careerStats[compareFormat]?.matches}
                  val2={player2.careerStats[compareFormat]?.matches}
                  better={getBetterStat("matches", compareFormat)}
                />
                <CompareRow
                  label="Innings"
                  val1={player1.careerStats[compareFormat]?.innings}
                  val2={player2.careerStats[compareFormat]?.innings}
                  better={getBetterStat("innings", compareFormat)}
                />
                <CompareRow
                  label="Runs"
                  val1={player1.careerStats[compareFormat]?.runs}
                  val2={player2.careerStats[compareFormat]?.runs}
                  better={getBetterStat("runs", compareFormat)}
                />
                <CompareRow
                  label="Average"
                  val1={player1.careerStats[compareFormat]?.avg}
                  val2={player2.careerStats[compareFormat]?.avg}
                  better={getBetterStat("avg", compareFormat)}
                />
                <CompareRow
                  label="Strike Rate"
                  val1={player1.careerStats[compareFormat]?.sr}
                  val2={player2.careerStats[compareFormat]?.sr}
                  better={getBetterStat("sr", compareFormat)}
                />
                <CompareRow
                  label="Wickets"
                  val1={player1.careerStats[compareFormat]?.wickets}
                  val2={player2.careerStats[compareFormat]?.wickets}
                  better={getBetterStat("wickets", compareFormat)}
                />
                <CompareRow
                  label="Bowling Econ"
                  val1={player1.careerStats[compareFormat]?.bowlEcon}
                  val2={player2.careerStats[compareFormat]?.bowlEcon}
                  better={getBetterStat("bowlEcon", compareFormat, true)}
                />
                <CompareRow
                  label="High Score"
                  val1={player1.careerStats[compareFormat]?.highScore}
                  val2={player2.careerStats[compareFormat]?.highScore}
                />
              </div>
            </motion.div>
          )}

          {/* H2H Duel Matchup Logs */}
          {compareMode && player1 && player2 && (
            <div className="w-full">
              {loadingH2H ? (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-2 border-zinc-800 border-t-lime-400 rounded-full animate-spin" />
                </div>
              ) : (
                h2hData && (
                  <HeadToHeadDuel
                    h2h={h2hData}
                    p1Name={player1.displayName}
                    p2Name={player2.displayName}
                  />
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
