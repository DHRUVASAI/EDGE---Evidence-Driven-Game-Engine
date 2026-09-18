"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { LineChart as LineIcon, MapPin } from "lucide-react";

interface SeasonTrend {
  season: string;
  count: number;
}

interface VenueCount {
  venue: string;
  count: number;
}

interface TrendChartsProps {
  seasonTrends: SeasonTrend[];
  topVenues: VenueCount[];
}

export default function TrendCharts({ seasonTrends, topVenues }: TrendChartsProps) {
  // Truncate long venue names for clean rendering
  const formattedVenues = topVenues.map((v) => ({
    ...v,
    shortVenue: v.venue.length > 25 ? `${v.venue.slice(0, 22)}...` : v.venue,
  }));

  // Custom tooltips for premium aesthetics
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-lg text-xs shadow-2xl">
          <p className="font-bold text-white mb-1">{label}</p>
          <p className="text-lime-400 font-semibold">
            {payload[0].value.toLocaleString()} Matches
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomVenueTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-lg text-xs shadow-2xl max-w-xs">
          <p className="font-bold text-white mb-1">{data.venue}</p>
          <p className="text-lime-400 font-semibold">
            {data.count.toLocaleString()} Matches
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* Season Trends Chart */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <LineIcon size={16} className="text-lime-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Match Volume by Season
          </h2>
        </div>
        <div className="w-full h-[300px] mt-auto">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={seasonTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a3e635" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#a3e635" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="season"
                stroke="#52525b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke="#52525b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#a3e635", strokeWidth: 1, strokeDasharray: "4 4" }} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#a3e635"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Venues Chart */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <MapPin size={16} className="text-lime-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Top 5 Venue Distribution
          </h2>
        </div>
        <div className="w-full h-[300px] mt-auto">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={formattedVenues}
              layout="vertical"
              margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
            >
              <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis
                dataKey="shortVenue"
                type="category"
                stroke="#e4e4e7"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={120}
              />
              <Tooltip content={<CustomVenueTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
              <Bar dataKey="count" fill="#a3e635" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
