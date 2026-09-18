"use client";

import React from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Gauge, TrendingUp, AlertTriangle, Loader2 } from "lucide-react";

interface WorkloadMatch {
  match_id: string;
  date: string;
  venue: string;
  opponent: string;
  overs: number;
  wickets: number;
  runs_conceded: number;
  economy: number;
  balls_bowled: number;
  workload_14d: number;
}

interface WorkloadSummary {
  totalBalls: number;
  totalWickets: number;
  avgEconomy: number;
  currentWorkload: number;
  riskLevel: "Low" | "Medium" | "High";
  riskReason: string;
}

interface WorkloadResponse {
  error?: string;
  player: string;
  format: string;
  window: number;
  matches?: WorkloadMatch[];
  summary?: WorkloadSummary;
}

interface WorkloadChartProps {
  data: WorkloadResponse | null | undefined;
  playerName?: string;
  metric?: "batting" | "bowling";
}

const riskColors: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  Low: { bg: "bg-lime-500/10", text: "text-lime-400", border: "border-lime-500/30", icon: <TrendingUp size={14} className="text-lime-400" /> },
  Medium: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30", icon: <Gauge size={14} className="text-orange-400" /> },
  High: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30", icon: <AlertTriangle size={14} className="text-red-400" /> },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-lg text-xs shadow-2xl">
        <p className="font-bold text-white mb-1">{new Date(d.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</p>
        <p className="text-zinc-400 text-[10px] mb-1">vs {d.opponent} @ {d.venue}</p>
        <p className="text-cyan-400">Overs: {d.overs}</p>
        <p className="text-pink-400">Wickets: {d.wickets}</p>
        <p className="text-blue-400">Economy: {d.economy?.toFixed(2)}</p>
        <p className="text-yellow-400">14d Workload: {d.workload_14d}</p>
      </div>
    );
  }
  return null;
};

const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

export default function WorkloadChart({ data, playerName, metric = "bowling" }: WorkloadChartProps) {
  // When batting is selected the SWR key is null, so data stays undefined — show a placeholder
  if (metric === "batting") {
    return (
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-6 h-80 flex flex-col items-center justify-center gap-3">
        <Gauge size={32} className="text-zinc-700" />
        <p className="text-sm font-medium text-zinc-500">Bowling Workload</p>
        <p className="text-xs text-zinc-600 text-center">Switch to <span className="text-zinc-400 font-semibold">Bowling</span> metric to view workload analysis</p>
      </div>
    );
  }

  // Bowling is selected but data is still loading
  if (data === null || data === undefined) {
    return (
      <div className="h-80 flex items-center justify-center text-zinc-500">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  const matches = [...(data.matches ?? [])].reverse(); // chronological
  const summary = data.summary ?? {
    totalBalls: 0,
    totalWickets: 0,
    avgEconomy: 0,
    currentWorkload: 0,
    riskLevel: "Low" as const,
    riskReason: "No workload data available",
  };
  const riskColor = riskColors[summary.riskLevel] || riskColors.Low;

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Gauge size={16} className="text-lime-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Bowling Workload (14-Day Window)</h2>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${riskColor.bg} ${riskColor.border} ${riskColor.text}`}>
          {riskColor.icon}
          <span className="text-xs font-medium uppercase">Risk: {summary.riskLevel}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-center">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Total Overs</p>
          <p className="text-xl font-bold text-cyan-400">{(summary.totalBalls / 6).toFixed(1)}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-center">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Total Wickets</p>
          <p className="text-xl font-bold text-pink-400">{summary.totalWickets}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-center">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Avg Economy</p>
          <p className="text-xl font-bold text-blue-400">{summary.avgEconomy.toFixed(2)}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-center">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">14-Day Workload</p>
          <p className="text-xl font-bold text-yellow-400">{summary.currentWorkload} balls</p>
        </div>
      </div>

      {/* Risk Reason */}
      <div className={`mb-6 p-3 rounded-lg border ${riskColor.bg} ${riskColor.border} ${riskColor.text}`}>
        <p className="text-sm">{summary.riskReason}</p>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workload over time */}
        <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-4 h-[300px]">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Workload Trend (Balls per Match)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={matches} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#52525b"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                dy={8}
                interval={Math.max(1, Math.floor(matches.length / 6))}
              />
              <YAxis
                stroke="#52525b"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="balls_bowled"
                name="Balls Bowled"
                fill="#a3e635"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Economy & Wickets */}
        <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-4 h-[300px]">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Economy & Wickets Trend</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={matches} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#52525b"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                dy={8}
                interval={Math.max(1, Math.floor(matches.length / 6))}
              />
              <YAxis
                yAxisId="left"
                stroke="#52525b"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                dx={-10}
                tickFormatter={(v) => v.toFixed(1)}
                orientation="left"
              />
              <YAxis
                yAxisId="right"
                stroke="#52525b"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                dx={10}
                orientation="right"
                tickFormatter={(v) => v.toFixed(1)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="economy"
                name="Economy"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3, fill: "#3b82f6" }}
                activeDot={{ r: 5, strokeWidth: 2 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="wickets"
                name="Wickets"
                stroke="#ec4899"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: "#ec4899" }}
                activeDot={{ r: 5, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent matches table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
              <th className="pb-2 pr-4">Date</th>
              <th className="pb-2 pr-4">Opponent</th>
              <th className="pb-2 pr-4">Venue</th>
              <th className="pb-2 pr-4 text-right">Overs</th>
              <th className="pb-2 pr-4 text-right">Wkts</th>
              <th className="pb-2 pr-4 text-right">Runs</th>
              <th className="pb-2 pr-4 text-right">Econ</th>
              <th className="pb-2 pr-4 text-right">14d Load</th>
            </tr>
          </thead>
          <tbody>
            {matches.slice(0, 10).map((row, i) => (
              <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                <td className="py-2 pr-4 text-zinc-400">{formatDate(row.date)}</td>
                <td className="py-2 pr-4 text-white">{row.opponent}</td>
                <td className="py-2 pr-4 text-zinc-500 truncate max-w-[120px]">{row.venue}</td>
                <td className="py-2 pr-4 text-right text-cyan-400">{row.overs?.toFixed(1)}</td>
                <td className="py-2 pr-4 text-right text-pink-400 font-medium">{row.wickets}</td>
                <td className="py-2 pr-4 text-right text-orange-400">{row.runs_conceded}</td>
                <td className="py-2 pr-4 text-right text-blue-400">{row.economy?.toFixed(2)}</td>
                <td className="py-2 pr-4 text-right text-yellow-400 font-medium">{row.workload_14d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
