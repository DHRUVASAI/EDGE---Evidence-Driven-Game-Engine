"use client";

import React, { useState, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { ChevronLeft, ChevronRight, MapPin, Loader2 } from "lucide-react";

interface VenueOpponentData {
  venue: string;
  opponent: string;
  matches: number;
  total_runs: number;
  avg_runs: number;
  avg_sr: number;
  high_score: number;
  total_balls: number;
  total_wickets: number;
  avg_wickets: number;
  avg_economy: number;
  best_figures: number;
}

interface VenueOpponentResponse {
  error?: string;
  player: string;
  format: string;
  filters: { venue: string | null; opponent: string | null };
  batting?: VenueOpponentData[];
  bowling?: VenueOpponentData[];
}

interface VenueOpponentChartProps {
  data: VenueOpponentResponse | null;
  playerName?: string;
  metric: "batting" | "bowling";
}

/** Custom tooltip that never overflows the viewport */
function VenueTooltip({ active, payload, activeTab }: any) {
  if (!active || !payload?.length) return null;
  const d: VenueOpponentData = payload[0]?.payload;
  return (
    <div
      className="bg-[#0d0d18] border border-zinc-700/80 rounded-xl px-3.5 py-3 text-xs shadow-2xl pointer-events-none"
      style={{ minWidth: 190, maxWidth: 230 }}
    >
      <p className="font-bold text-white text-[11px] leading-tight mb-0.5 break-words">{d.venue}</p>
      <p className="text-zinc-500 text-[10px] mb-2">vs {d.opponent}</p>
      <div className="flex items-center gap-1 mb-2">
        <span className="px-1.5 py-0.5 rounded bg-lime-500/15 border border-lime-500/20 text-lime-400 font-bold text-[10px]">
          {d.matches} match{d.matches !== 1 ? "es" : ""}
        </span>
      </div>
      {activeTab === "batting" ? (
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-zinc-400">Avg Runs</span>
            <span className="font-bold text-lime-400">{d.avg_runs?.toFixed(1)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-zinc-400">Avg SR</span>
            <span className="font-bold text-orange-400">{d.avg_sr?.toFixed(1)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-zinc-400">High Score</span>
            <span className="font-bold text-purple-400">{d.high_score}</span>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-zinc-400">Avg Wickets</span>
            <span className="font-bold text-pink-400">{d.avg_wickets?.toFixed(1)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-zinc-400">Avg Economy</span>
            <span className="font-bold text-blue-400">{d.avg_economy?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-zinc-400">Best Figures</span>
            <span className="font-bold text-purple-400">{d.best_figures}</span>
          </div>
        </div>
      )}
    </div>
  );
}

const getLabel = (venue: string) =>
  venue.length > 22 ? venue.slice(0, 19) + "…" : venue;

export default function VenueOpponentChart({ data, playerName, metric }: VenueOpponentChartProps) {
  const [activeTab, setActiveTab] = useState<"batting" | "bowling">(metric);
  const [venueFilter, setVenueFilter] = useState("");
  const [opponentFilter, setOpponentFilter] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 8;

  // Rules of Hooks: all hooks before any early return
  React.useEffect(() => { setPage(0); }, [activeTab, venueFilter, opponentFilter]);

  if (!data) {
    return (
      <div className="h-80 flex flex-col items-center justify-center gap-3 text-zinc-500">
        <Loader2 className="animate-spin h-8 w-8 text-lime-500/40" />
        <span className="text-xs">Loading matchup data…</span>
      </div>
    );
  }

  const battingData = data.batting ?? [];
  const bowlingData = data.bowling ?? [];
  const currentData = activeTab === "batting" ? battingData : bowlingData;

  const filteredData = currentData.filter((row) => {
    const vm = row.venue?.toLowerCase().includes(venueFilter.toLowerCase());
    const om = row.opponent?.toLowerCase().includes(opponentFilter.toLowerCase());
    return vm && om;
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageData = filteredData.slice(safePage * pageSize, safePage * pageSize + pageSize);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <MapPin size={15} className="text-lime-400" />
          <h2 className="text-sm font-black text-white uppercase tracking-wider">Venue / Opponent Matchups</h2>
        </div>
        <div className="flex gap-1 bg-zinc-800/60 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab("batting")}
            className={`px-3 py-1 text-xs rounded-md font-semibold transition-all ${activeTab === "batting" ? "bg-lime-500 text-black font-bold" : "text-zinc-400 hover:text-white"}`}
          >
            Batting
          </button>
          <button
            onClick={() => setActiveTab("bowling")}
            className={`px-3 py-1 text-xs rounded-md font-semibold transition-all ${activeTab === "bowling" ? "bg-lime-500 text-black font-bold" : "text-zinc-400 hover:text-white"}`}
          >
            Bowling
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          value={venueFilter}
          onChange={(e) => setVenueFilter(e.target.value)}
          placeholder="Filter venue…"
          className="flex-1 min-w-[130px] bg-zinc-900/70 border border-zinc-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-lime-500/40 placeholder:text-zinc-600"
        />
        <input
          type="text"
          value={opponentFilter}
          onChange={(e) => setOpponentFilter(e.target.value)}
          placeholder="Filter opponent…"
          className="flex-1 min-w-[130px] bg-zinc-900/70 border border-zinc-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-lime-500/40 placeholder:text-zinc-600"
        />
        {(venueFilter || opponentFilter) && (
          <button
            onClick={() => { setVenueFilter(""); setOpponentFilter(""); }}
            className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors border border-zinc-800 rounded-lg hover:border-zinc-700"
          >
            Clear
          </button>
        )}
      </div>

      {/* Pagination row */}
      {filteredData.length > pageSize && (
        <div className="flex items-center justify-between mb-3 text-[10px]">
          <span className="text-zinc-500">
            {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, filteredData.length)} of {filteredData.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="h-6 w-6 inline-flex items-center justify-center rounded border border-zinc-800 text-zinc-400 disabled:opacity-30 hover:text-white hover:border-zinc-700 transition-all"
            >
              <ChevronLeft size={12} />
            </button>
            <span className="text-zinc-500 px-2 tabular-nums">{safePage + 1}/{totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="h-6 w-6 inline-flex items-center justify-center rounded border border-zinc-800 text-zinc-400 disabled:opacity-30 hover:text-white hover:border-zinc-700 transition-all"
            >
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Bar chart — overflow visible so tooltip doesn't clip */}
      <div className="w-full h-[300px]" style={{ overflow: "visible" }}>
        <ResponsiveContainer width="100%" height="100%">
          {pageData.length > 0 ? (
            <BarChart
              data={pageData}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
            >
              <CartesianGrid stroke="#1a1a2e" strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                stroke="#3f3f5a"
                fontSize={9}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="venue"
                stroke="#3f3f5a"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => getLabel(String(v ?? ""))}
                width={160}
              />
              {/* wrapperStyle overflow:visible prevents clipping */}
              <Tooltip
                content={(props) => <VenueTooltip {...props} activeTab={activeTab} />}
                wrapperStyle={{ zIndex: 100, overflow: "visible", outline: "none" }}
                cursor={{ fill: "rgba(163,230,53,0.04)" }}
              />
              <Bar
                dataKey={activeTab === "batting" ? "avg_runs" : "avg_wickets"}
                name={activeTab === "batting" ? "Avg Runs" : "Avg Wickets"}
                radius={[0, 5, 5, 0]}
                maxBarSize={22}
              >
                {pageData.map((_, i) => (
                  <Cell
                    key={`cell-${i}`}
                    fill={activeTab === "batting"
                      ? `hsl(${96 + i * 12}, 68%, 46%)`
                      : `hsl(${312 + i * 12}, 68%, 54%)`}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-600">
              <MapPin size={28} className="opacity-30" />
              <span className="text-xs">No {activeTab} matchup data</span>
            </div>
          )}
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="mt-5 overflow-x-auto rounded-xl border border-zinc-800/60">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[9px] text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
              <th className="py-2 px-3">Venue</th>
              <th className="py-2 px-3">Opponent</th>
              <th className="py-2 px-3 text-right">Mts</th>
              {activeTab === "batting" ? (
                <>
                  <th className="py-2 px-3 text-right">Avg</th>
                  <th className="py-2 px-3 text-right">SR</th>
                  <th className="py-2 px-3 text-right">HS</th>
                </>
              ) : (
                <>
                  <th className="py-2 px-3 text-right">Wkts</th>
                  <th className="py-2 px-3 text-right">Econ</th>
                  <th className="py-2 px-3 text-right">Best</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, i) => (
              <tr key={i} className={`border-b border-zinc-800/40 hover:bg-zinc-900/40 transition-colors ${i % 2 === 0 ? "" : "bg-zinc-900/10"}`}>
                <td className="py-2 px-3 text-white font-medium max-w-[130px] truncate">{row.venue}</td>
                <td className="py-2 px-3 text-zinc-400 max-w-[130px] truncate">{row.opponent}</td>
                <td className="py-2 px-3 text-right text-lime-400 font-bold">{row.matches}</td>
                {activeTab === "batting" ? (
                  <>
                    <td className="py-2 px-3 text-right text-cyan-400 font-semibold">{row.avg_runs?.toFixed(1)}</td>
                    <td className="py-2 px-3 text-right text-orange-400 font-semibold">{row.avg_sr?.toFixed(1)}</td>
                    <td className="py-2 px-3 text-right text-purple-400 font-semibold">{row.high_score}</td>
                  </>
                ) : (
                  <>
                    <td className="py-2 px-3 text-right text-pink-400 font-semibold">{row.avg_wickets?.toFixed(1)}</td>
                    <td className="py-2 px-3 text-right text-blue-400 font-semibold">{row.avg_economy?.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right text-purple-400 font-semibold">{row.best_figures}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
