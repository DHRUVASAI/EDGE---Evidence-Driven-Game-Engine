"use client";

import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Gauge, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ConsistencyMatch {
  match_id: string;
  date: string;
  venue: string;
  opponent: string;
  value: number;
}

interface ConsistencyResponse {
  error?: string;
  player: string;
  format: string;
  metric: string;
  window: number;
  consistency: {
    mean: number;
    stdDev: number;
    cv: number;
    rating: string;
    trend: string;
  };
  percentiles: {
    p25: number;
    p50: number;
    p75: number;
  };
  matchData: ConsistencyMatch[];
}

const metricInfo: Record<string, { label: string; color: string }> = {
  runs: { label: "Runs", color: "text-lime-400" },
  sr: { label: "Strike Rate", color: "text-orange-400" },
  wickets: { label: "Wickets", color: "text-pink-400" },
  economy: { label: "Economy", color: "text-blue-400" },
};

const trendIcons: Record<string, React.ReactNode> = {
  Improving: <TrendingUp size={14} className="text-lime-400" />,
  Declining: <TrendingDown size={14} className="text-red-400" />,
  Stable: <Minus size={14} className="text-zinc-400" />,
};

const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-lg text-xs shadow-2xl">
        <p className="font-bold text-white mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className={`${p.color} font-semibold`}>
            {p.name}: {p.value !== null ? p.value.toFixed(2) : "N/A"}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface ConsistencyChartProps {
  data: ConsistencyResponse | null;
  playerName?: string;
  metric: "batting" | "bowling";
}

export default function ConsistencyChart({ data, playerName, metric }: ConsistencyChartProps) {
  if (!data) {
    return (
      <div className="h-80 flex items-center justify-center text-zinc-500">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  const consistency = data.consistency ?? { mean: 0, stdDev: 0, cv: 0, rating: "No Data", trend: "Stable" };
  const percentiles = data.percentiles ?? { p25: 0, p50: 0, p75: 0 };
  const matches = [...(data.matchData ?? [])].reverse(); // chronological
  const mInfo = metricInfo[data.metric] || metricInfo.runs;
  const format = data.format || "";
  const window = data.window || 0;

  if (data.error || matches.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Gauge size={16} className="text-lime-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Consistency Metrics</h2>
        </div>
        <p className="text-sm text-zinc-500">
          No consistency data found{playerName ? ` for ${playerName}` : ""}.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Gauge size={16} className="text-lime-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Consistency Metrics ({mInfo.label})</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>Format: <span className="text-white ml-1">{format}</span></span>
          <span>Window: <span className="text-white ml-1">{window}</span></span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-center">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Mean</p>
          <p className="text-xl font-bold text-white">{consistency.mean.toFixed(2)}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-center">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Std Dev</p>
          <p className="text-xl font-bold text-zinc-400">{consistency.stdDev.toFixed(2)}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-center">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">CV %</p>
          <p className="text-xl font-bold text-yellow-400">{consistency.cv.toFixed(1)}%</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-center">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Trend</p>
          <p className="flex items-center justify-center gap-1">
            {trendIcons[consistency.trend]}
            <span className="text-sm font-medium capitalize">{consistency.trend.toLowerCase()}</span>
          </p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-center">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Rating</p>
          <p className="text-sm font-bold text-cyan-400">{consistency.rating}</p>
        </div>
      </div>

      {/* Percentiles */}
      <div className="mb-6 p-3 rounded-lg border border-zinc-800 bg-zinc-900/30">
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Percentile Distribution</p>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-zinc-600" />
            <span className="text-zinc-400">P25: </span>
            <span className="font-bold text-white">{percentiles.p25.toFixed(2)}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-zinc-500" />
            <span className="text-zinc-400">P50: </span>
            <span className="font-bold text-white">{percentiles.p50.toFixed(2)}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-zinc-400" />
            <span className="text-zinc-400">P75: </span>
            <span className="font-bold text-white">{percentiles.p75.toFixed(2)}</span>
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-[300px] mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={matches.map((m, i) => ({ ...m, mean: consistency.mean, index: i }))} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={mInfo.color.replace("text-", "")} stopOpacity={0.3} />
                <stop offset="95%" stopColor={mInfo.color.replace("text-", "")} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#52525b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={10}
              interval={Math.max(1, Math.floor(matches.length / 8))}
            />
            <YAxis
              stroke="#52525b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              name={mInfo.label}
              stroke={mInfo.color.replace("text-", "")}
              strokeWidth={2}
              dot={{ r: 3, fill: mInfo.color.replace("text-", "") }}
              activeDot={{ r: 5, strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="mean"
              name="Mean"
              stroke="#f97316"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Match data table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
              <th className="pb-2 pr-4">Date</th>
              <th className="pb-2 pr-4">Opponent</th>
              <th className="pb-2 pr-4">Venue</th>
              <th className="pb-2 pr-4 text-right">{mInfo.label}</th>
              <th className="pb-2 pr-4 text-right">Deviation</th>
            </tr>
          </thead>
          <tbody>
            {matches.slice(0, 15).map((row, i) => {
              const deviation = row.value - consistency.mean;
              const devColor = deviation > 0 ? "text-lime-400" : deviation < 0 ? "text-red-400" : "text-zinc-400";
              const devSign = deviation > 0 ? "+" : "";
              return (
                <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                  <td className="py-2 pr-4 text-zinc-400">{formatDate(row.date)}</td>
                  <td className="py-2 pr-4 text-white">{row.opponent}</td>
                  <td className="py-2 pr-4 text-zinc-500 truncate max-w-[120px]">{row.venue}</td>
                  <td className={`py-2 pr-4 text-right font-medium ${mInfo.color}`}>{row.value}</td>
                  <td className={`py-2 pr-4 text-right ${devColor} font-mono text-xs`}>{devSign}{deviation.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
