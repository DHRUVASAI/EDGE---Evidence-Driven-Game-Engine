"use client";

import React from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { TrendingUp, Loader2 } from "lucide-react";

interface FormTrendData {
  match_id: string;
  date: string;
  venue: string;
  opponent: string;
  runs: number;
  balls_faced: number;
  sr: number;
  rolling_avg_5: number;
  rolling_sr_5: number;
  consistency_5: number;
  wickets?: number;
  economy?: number;
}

interface FormTrendsResponse {
  error?: string;
  player: string;
  format: string;
  window: number;
  batting?: FormTrendData[];
  bowling?: FormTrendData[];
}

interface FormTrendsChartProps {
  data: FormTrendsResponse | null;
  playerName?: string;
  metric: "batting" | "bowling";
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

function BattingTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as FormTrendData;
  return (
    <div className="bg-[#0d0d18] border border-zinc-700/80 rounded-xl px-3.5 py-3 text-xs shadow-2xl min-w-[160px] pointer-events-none">
      <p className="font-bold text-white text-[11px] mb-0.5">{formatDate(d.date)}</p>
      <p className="text-zinc-500 text-[10px] mb-2 truncate max-w-[150px]">vs {d.opponent}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-zinc-400">Runs</span>
          <span className="font-bold text-lime-400">{d.runs}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-400">5-Match Avg</span>
          <span className="font-bold text-orange-400">{d.rolling_avg_5?.toFixed(1) ?? "—"}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-400">Strike Rate</span>
          <span className="font-bold text-cyan-400">{d.sr?.toFixed(1) ?? "—"}</span>
        </div>
        {d.balls_faced > 0 && (
          <div className="flex justify-between gap-4">
            <span className="text-zinc-400">Balls</span>
            <span className="font-bold text-zinc-300">{d.balls_faced}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function BowlingTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as FormTrendData;
  return (
    <div className="bg-[#0d0d18] border border-zinc-700/80 rounded-xl px-3.5 py-3 text-xs shadow-2xl min-w-[160px] pointer-events-none">
      <p className="font-bold text-white text-[11px] mb-0.5">{formatDate(d.date)}</p>
      <p className="text-zinc-500 text-[10px] mb-2 truncate max-w-[150px]">vs {d.opponent}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-zinc-400">Wickets</span>
          <span className="font-bold text-pink-400">{d.wickets ?? 0}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-400">Economy</span>
          <span className="font-bold text-blue-400">{d.economy?.toFixed(2) ?? "—"}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-400">5-Match Avg Wkts</span>
          <span className="font-bold text-orange-400">{d.rolling_avg_5?.toFixed(1) ?? "—"}</span>
        </div>
      </div>
    </div>
  );
}

export default function FormTrendsChart({ data, playerName, metric }: FormTrendsChartProps) {
  const [activeTab, setActiveTab] = React.useState<"batting" | "bowling">(metric);

  // Sync tab when parent metric selector changes
  React.useEffect(() => { setActiveTab(metric); }, [metric]);

  if (!data) {
    return (
      <div className="h-80 flex flex-col items-center justify-center gap-3 text-zinc-500">
        <Loader2 className="animate-spin h-8 w-8 text-lime-500/40" />
        <span className="text-xs">Loading form data…</span>
      </div>
    );
  }

  const battingData = [...(data.batting ?? [])].reverse();
  const bowlingData = [...(data.bowling ?? [])].reverse();

  const battingAvg =
    battingData.length > 0
      ? battingData[battingData.length - 1].rolling_avg_5 ?? 0
      : 0;

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp size={15} className="text-lime-400" />
          <h2 className="text-sm font-black text-white uppercase tracking-wider">
            Form Trends
            <span className="ml-1.5 text-[10px] font-semibold text-zinc-500 normal-case tracking-normal">
              5-match rolling
            </span>
          </h2>
        </div>
        <div className="flex gap-1 bg-zinc-800/60 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab("batting")}
            className={`px-3 py-1 text-xs rounded-md font-semibold transition-all ${
              activeTab === "batting"
                ? "bg-lime-500 text-black font-bold shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Batting
          </button>
          <button
            onClick={() => setActiveTab("bowling")}
            className={`px-3 py-1 text-xs rounded-md font-semibold transition-all ${
              activeTab === "bowling"
                ? "bg-lime-500 text-black font-bold shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Bowling
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === "batting" && battingData.length > 0 ? (
            <LineChart
              data={battingData}
              margin={{ top: 8, right: 12, left: -18, bottom: 0 }}
            >
              <defs>
                <linearGradient id="glowRuns" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a3e635" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#a3e635" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1a1a2e" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#3f3f5a"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                dy={8}
                interval={Math.max(1, Math.floor(battingData.length / 7))}
              />
              <YAxis
                stroke="#3f3f5a"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                dx={-4}
                tickFormatter={(v) => String(Math.round(v))}
                width={30}
              />
              {/* Mean reference line */}
              {battingAvg > 0 && (
                <ReferenceLine
                  y={battingAvg}
                  stroke="#f97316"
                  strokeDasharray="6 3"
                  strokeOpacity={0.5}
                  strokeWidth={1}
                />
              )}
              <Tooltip
                content={<BattingTooltip />}
                wrapperStyle={{ zIndex: 100, outline: "none" }}
                cursor={{ stroke: "#a3e635", strokeWidth: 1, strokeDasharray: "4 2", strokeOpacity: 0.4 }}
              />
              <Line
                type="monotone"
                dataKey="rolling_avg_5"
                name="5-Match Avg"
                stroke="#f97316"
                strokeWidth={1.5}
                strokeDasharray="5 4"
                dot={false}
                strokeOpacity={0.7}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="runs"
                name="Runs"
                stroke="#a3e635"
                strokeWidth={2}
                dot={{ r: 3, fill: "#a3e635", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#a3e635", stroke: "#fff", strokeWidth: 1.5 }}
                isAnimationActive={true}
                animationDuration={600}
              />
            </LineChart>
          ) : activeTab === "bowling" && bowlingData.length > 0 ? (
            <LineChart
              data={bowlingData}
              margin={{ top: 8, right: 12, left: -18, bottom: 0 }}
            >
              <CartesianGrid stroke="#1a1a2e" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#3f3f5a"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                dy={8}
                interval={Math.max(1, Math.floor(bowlingData.length / 7))}
              />
              <YAxis
                stroke="#3f3f5a"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                dx={-4}
                tickFormatter={(v) => v.toFixed(1)}
                width={30}
              />
              <Tooltip
                content={<BowlingTooltip />}
                wrapperStyle={{ zIndex: 100, outline: "none" }}
                cursor={{ stroke: "#ec4899", strokeWidth: 1, strokeDasharray: "4 2", strokeOpacity: 0.4 }}
              />
              <Line
                type="monotone"
                dataKey="economy"
                name="Economy"
                stroke="#3b82f6"
                strokeWidth={1.5}
                strokeDasharray="5 4"
                dot={false}
                strokeOpacity={0.7}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="wickets"
                name="Wickets"
                stroke="#ec4899"
                strokeWidth={2}
                dot={{ r: 3, fill: "#ec4899", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#ec4899", stroke: "#fff", strokeWidth: 1.5 }}
                isAnimationActive={true}
                animationDuration={600}
              />
            </LineChart>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-600">
              <TrendingUp size={28} className="opacity-30" />
              <span className="text-xs">No {activeTab} data for this player / format</span>
            </div>
          )}
        </ResponsiveContainer>
      </div>

      {/* Stat pills */}
      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
        {activeTab === "batting" && battingData.length > 0 && (() => {
          const last = battingData[battingData.length - 1];
          return [
            { label: "Latest Runs",  value: String(last.runs),                    color: "text-lime-400"   },
            { label: "5-Match Avg",  value: last.rolling_avg_5?.toFixed(1) ?? "—", color: "text-orange-400" },
            { label: "Strike Rate",  value: last.sr?.toFixed(1) ?? "—",            color: "text-cyan-400"   },
            { label: "Consistency",  value: last.consistency_5?.toFixed(1) ?? "—", color: "text-purple-400" },
          ];
        })()?.map((s, i) => (
          <div key={i} className="bg-zinc-900/50 border border-zinc-800/70 rounded-xl p-3 text-center">
            <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">{s.label}</p>
            <p className={`text-lg font-black tabular-nums ${s.color}`}>{s.value}</p>
          </div>
        ))}

        {activeTab === "bowling" && bowlingData.length > 0 && (() => {
          const last = bowlingData[bowlingData.length - 1];
          return [
            { label: "Last Wickets",      value: String(last.wickets ?? 0),             color: "text-pink-400"   },
            { label: "Economy",           value: last.economy?.toFixed(2) ?? "—",        color: "text-blue-400"   },
            { label: "5-Match Avg Wkts",  value: last.rolling_avg_5?.toFixed(1) ?? "—", color: "text-orange-400" },
            { label: "Consistency",       value: last.consistency_5?.toFixed(1) ?? "—", color: "text-purple-400" },
          ];
        })()?.map((s, i) => (
          <div key={i} className="bg-zinc-900/50 border border-zinc-800/70 rounded-xl p-3 text-center">
            <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">{s.label}</p>
            <p className={`text-lg font-black tabular-nums ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
