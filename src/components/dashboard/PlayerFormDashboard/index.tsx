"use client";

import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import FormTrendsChart from "./FormTrendsChart";
import VenueOpponentChart from "./VenueOpponentChart";
import XIRecommendations from "./XIRecommendations";
import WorkloadChart from "./WorkloadChart";
import ConsistencyChart from "./ConsistencyChart";
import { ChevronDown, Search, X } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Player {
  player_id: string;
  player_name: string;
  role: string;
  team: string;
}

const cardCls = "bg-zinc-950/60 border border-zinc-800/70 rounded-2xl p-5";

/** Searchable player picker — replaces the ugly native <select> with 120 options */
function PlayerPicker({
  players,
  value,
  onChange,
}: {
  players: Player[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = players.find((p) => p.player_id === value);
  const filtered = query.length === 0
    ? players.slice(0, 40) // show top 40 by default
    : players.filter((p) =>
        p.player_name.toLowerCase().includes(query.toLowerCase()) ||
        p.team.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 40);

  // close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else setQuery("");
  }, [open]);

  const ROLE_COLOR: Record<string, string> = {
    BAT: "text-lime-400", BOWL: "text-pink-400",
    AR: "text-amber-400", WK: "text-cyan-400",
  };

  return (
    <div ref={ref} className="relative min-w-[220px]">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 bg-zinc-900 border border-zinc-700 text-white pl-3 pr-2.5 py-2 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-lime-500/40 hover:border-zinc-600 transition-colors"
      >
        <span className="truncate max-w-[180px]">
          {selected ? (
            <span>
              {selected.player_name}
              <span className={`ml-1.5 text-[10px] font-bold ${ROLE_COLOR[selected.role] ?? "text-zinc-400"}`}>
                {selected.role}
              </span>
              <span className="ml-1 text-[10px] text-zinc-500">{selected.team}</span>
            </span>
          ) : "Select player"}
        </span>
        <ChevronDown size={13} className={`text-zinc-500 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 w-72 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
          {/* Search box */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800">
            <Search size={13} className="text-zinc-500 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search player or country…"
              className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")}>
                <X size={13} className="text-zinc-500 hover:text-white" />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-xs text-zinc-500 text-center">No players found</p>
            ) : (
              filtered.map((p) => (
                <button
                  key={p.player_id}
                  type="button"
                  onClick={() => { onChange(p.player_id); setOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 hover:bg-zinc-800 transition-colors text-left ${
                    p.player_id === value ? "bg-zinc-800/80" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={`/api/player-image?name=${encodeURIComponent(p.player_name)}`}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover border border-zinc-700 flex-shrink-0"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).onerror = null; }}
                    />
                    <span className="text-sm text-white truncate">{p.player_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    <span className={`text-[10px] font-bold ${ROLE_COLOR[p.role] ?? "text-zinc-400"}`}>{p.role}</span>
                    <span className="text-[9px] text-zinc-500 font-medium">{p.team}</span>
                  </div>
                </button>
              ))
            )}
            {query.length === 0 && players.length > 40 && (
              <p className="px-3 py-2 text-[10px] text-zinc-600 text-center border-t border-zinc-800">
                Type to search all {players.length} players
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlayerFormDashboard() {
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [selectedFormat, setSelectedFormat] = useState<string>("ipl");
  const [selectedMetric, setSelectedMetric] = useState<"batting" | "bowling">("batting");

  const {
    data: players,
    error: playersError,
    isLoading: playersLoading,
  } = useSWR(`/api/players?format=${selectedFormat}`, fetcher, { revalidateOnFocus: false });

  const defaultPlayer: string = players?.[0]?.player_id ?? "";
  const activePlayer = selectedPlayer || defaultPlayer;

  const { data: formTrends } = useSWR(
    activePlayer
      ? `/api/form-trends?player_id=${activePlayer}&format=${selectedFormat}&metric=${selectedMetric}`
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: venueOpponent } = useSWR(
    activePlayer
      ? `/api/venue-opponent?player_id=${activePlayer}&format=${selectedFormat}&metric=${selectedMetric}`
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: xiRecommendations } = useSWR(
    `/api/xi-recommendations?format=${selectedFormat}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: workload } = useSWR(
    activePlayer && selectedMetric === "bowling"
      ? `/api/workload?player_id=${activePlayer}&format=${selectedFormat}`
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: consistency } = useSWR(
    activePlayer
      ? `/api/consistency?player_id=${activePlayer}&format=${selectedFormat}&metric=${selectedMetric}`
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const formats = [
    { value: "ipl",  label: "IPL"  },
    { value: "odi",  label: "ODI"  },
    { value: "t20",  label: "T20"  },
    { value: "test", label: "Test" },
  ];
  const metrics = [
    { value: "batting", label: "Batting" },
    { value: "bowling", label: "Bowling" },
  ];

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (playersLoading) {
    return (
      <div className="w-full animate-pulse space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="h-8 bg-zinc-900 rounded w-72" />
          <div className="flex gap-3">
            <div className="h-9 bg-zinc-900 rounded w-24" />
            <div className="h-9 bg-zinc-900 rounded w-24" />
            <div className="h-9 bg-zinc-900 rounded w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-96 bg-zinc-900 rounded-2xl" />
          <div className="h-96 bg-zinc-900 rounded-2xl" />
        </div>
        <div className="h-72 bg-zinc-900 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-80 bg-zinc-900 rounded-2xl" />
          <div className="h-80 bg-zinc-900 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (playersError || !players) {
    return (
      <div className="w-full py-20 flex flex-col items-center justify-center text-center">
        <div className="text-red-500 text-lg font-bold">Failed to load players</div>
        <p className="text-sm text-zinc-500 mt-2">Check your database connectivity and refresh.</p>
      </div>
    );
  }

  const activePlayerName: string =
    players.find((p: Player) => p.player_id === activePlayer)?.player_name ?? "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="w-full space-y-5"
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none">
            Player Form & Selection Advisor
          </h2>
          <p className="text-zinc-500 text-sm mt-1.5">
            AI-powered form analysis, venue matchups & XI recommendations
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Format */}
          <div className="relative">
            <select
              value={selectedFormat}
              onChange={(e) => { setSelectedFormat(e.target.value); setSelectedPlayer(""); }}
              className="bg-zinc-900 border border-zinc-700 text-white pl-3 pr-8 py-2 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-lime-500/40 appearance-none"
            >
              {formats.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>

          {/* Metric */}
          <div className="relative">
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as "batting" | "bowling")}
              className="bg-zinc-900 border border-zinc-700 text-white pl-3 pr-8 py-2 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-lime-500/40 appearance-none"
            >
              {metrics.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>

          {/* Player searchable picker */}
          <PlayerPicker
            players={players}
            value={activePlayer}
            onChange={setSelectedPlayer}
          />
        </div>
      </div>

      {/* ── Row 1: Form Trends + Venue Matchups ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className={cardCls}
        >
          <FormTrendsChart
            data={formTrends}
            playerName={activePlayerName}
            metric={selectedMetric}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className={cardCls}
        >
          <VenueOpponentChart
            data={venueOpponent}
            playerName={activePlayerName}
            metric={selectedMetric}
          />
        </motion.div>
      </div>

      {/* ── Row 2: XI Recommendations (full width) ───────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
        className={cardCls}
      >
        <XIRecommendations data={xiRecommendations} format={selectedFormat} />
      </motion.div>

      {/* ── Row 3: Workload + Consistency ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`grid gap-5 ${selectedMetric === "bowling" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}
      >
        {selectedMetric === "bowling" && (
          <div className={cardCls}>
            <WorkloadChart
              data={workload}
              playerName={activePlayerName}
              metric={selectedMetric}
            />
          </div>
        )}
        <div className={cardCls}>
          <ConsistencyChart
            data={consistency}
            playerName={activePlayerName}
            metric={selectedMetric}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
