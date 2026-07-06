"use client";

import React, { useState } from "react";
import { Trophy, Shield, Star, Loader2, Crown, Award, ChevronDown, Info, Zap } from "lucide-react";

interface XIPlayer {
  player: string;
  role: string;
  form_score_100: number;
  is_captain: boolean;
  is_vice_captain: boolean;
  selection_order: number;
  rationale: string;
  team: string;
  opponent: string;
  venue: string;
  date: string;
}

interface XIResponse {
  error?: string;
  format: string;
  source?: string;
  filters: { team: string | null; opponent: string | null; venue: string | null; date: string | null };
  teams?: Record<string, {
    players: XIPlayer[];
    roleCounts: { BAT: number; BOWL: number; AR: number; WK: number };
    captain: string | null;
    viceCaptain: string | null;
    totalPlayers: number;
  }>;
}

interface XIRecommendationsProps {
  data: XIResponse | null;
  format?: string;
}

const ROLE_CONFIG: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode; label: string }> = {
  BAT: { bg: "bg-lime-500/15",   text: "text-lime-400",   border: "border-lime-500/30",   icon: <Trophy size={10} />,  label: "Batsman"     },
  BOWL:{ bg: "bg-pink-500/15",   text: "text-pink-400",   border: "border-pink-500/30",   icon: <Shield size={10} />,  label: "Bowler"      },
  AR:  { bg: "bg-amber-500/15",  text: "text-amber-400",  border: "border-amber-500/30",  icon: <Star size={10} />,    label: "All-Rounder" },
  WK:  { bg: "bg-cyan-500/15",   text: "text-cyan-400",   border: "border-cyan-500/30",   icon: <Award size={10} />,   label: "Wicket-Keeper"},
};

function getScoreColor(score: number): string {
  if (score >= 85) return "text-lime-400";
  if (score >= 70) return "text-amber-400";
  if (score >= 50) return "text-orange-400";
  return "text-red-400";
}

function getScoreGradient(score: number): string {
  if (score >= 85) return "from-lime-500 to-lime-400";
  if (score >= 70) return "from-amber-500 to-amber-400";
  if (score >= 50) return "from-orange-500 to-orange-400";
  return "from-red-500 to-red-400";
}

/** Parse the raw rationale string into structured stats */
function parseRationale(rationale: string): { runs?: string; wickets?: string; matches?: string; avg?: string; sr?: string } {
  const out: Record<string, string> = {};
  const runsMatch = rationale.match(/(\d[\d,]*)\s*runs?/i);
  const wktsMatch = rationale.match(/(\d+)\s*wickets?/i);
  const matchesMatch = rationale.match(/(\d+)\s*matches?/i);
  const avgMatch = rationale.match(/avg[:\s]+([0-9.]+)/i);
  const srMatch = rationale.match(/sr[:\s]+([0-9.]+)/i);
  if (runsMatch)   out.runs    = runsMatch[1];
  if (wktsMatch)   out.wickets = wktsMatch[1];
  if (matchesMatch)out.matches = matchesMatch[1];
  if (avgMatch)    out.avg     = avgMatch[1];
  if (srMatch)     out.sr      = srMatch[1];
  return out;
}

function PlayerCard({ player, rank }: { player: XIPlayer; rank: number }) {
  const role = ROLE_CONFIG[player.role] ?? ROLE_CONFIG.BAT;
  const score = player.form_score_100 ?? 0;
  const stats = parseRationale(player.rationale);

  return (
    <div
      className={`relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-xl ${
        player.is_captain
          ? "border-yellow-500/50 shadow-[0_0_24px_rgba(234,179,8,0.12)]"
          : player.is_vice_captain
          ? "border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.10)]"
          : "border-zinc-800/80 hover:border-zinc-700"
      }`}
      style={{ background: "linear-gradient(160deg, #141420 0%, #0c0c15 100%)" }}
    >
      {/* Captain / VC ribbon */}
      {player.is_captain && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500" />
      )}
      {player.is_vice_captain && !player.is_captain && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 via-violet-400 to-purple-500" />
      )}

      {/* Badge top-right */}
      {player.is_captain && (
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-yellow-500/15 border border-yellow-500/30 rounded-full px-2 py-0.5 z-10">
          <Crown size={10} className="text-yellow-400" />
          <span className="text-[9px] font-black text-yellow-400 uppercase tracking-wide">C</span>
        </div>
      )}
      {player.is_vice_captain && !player.is_captain && (
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-purple-500/15 border border-purple-500/30 rounded-full px-2 py-0.5 z-10">
          <span className="text-[9px] font-black text-purple-400 uppercase tracking-wide">VC</span>
        </div>
      )}

      {/* Image + name section */}
      <div className="flex flex-col items-center pt-5 pb-3 px-3">
        {/* Avatar */}
        <div className={`w-16 h-16 rounded-full overflow-hidden border-2 flex-shrink-0 mb-2 ${
          player.is_captain ? "border-yellow-500/60" : player.is_vice_captain ? "border-purple-500/50" : "border-zinc-700"
        }`}>
          <img
            src={`/api/player-image?name=${encodeURIComponent(player.player)}`}
            alt={player.player}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              // Let the server-side SVG fallback do its job — don't hide the img
              (e.currentTarget as HTMLImageElement).onerror = null;
            }}
          />
        </div>

        {/* Name — always wraps, never overflows */}
        <p className="text-sm font-bold text-white text-center leading-tight w-full break-words hyphens-auto px-1" style={{ wordBreak: "break-word" }}>
          {player.player}
        </p>

        {/* Role badge */}
        <div className={`mt-1.5 flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${role.bg} ${role.text} ${role.border}`}>
          {role.icon}
          {role.label}
        </div>
      </div>

      {/* Form score bar */}
      <div className="px-3 pb-3">
        <div className="flex items-center justify-between text-[10px] mb-1.5">
          <span className="text-zinc-500 font-medium">Form Score</span>
          <span className={`font-black text-sm tabular-nums ${getScoreColor(score)}`}>
            {score.toFixed(0)}<span className="text-[9px] text-zinc-600">/100</span>
          </span>
        </div>
        <div className="w-full h-2 bg-zinc-800/80 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${getScoreGradient(score)} rounded-full transition-all duration-700`}
            style={{ width: `${Math.min(score, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="mx-3 mb-3 grid grid-cols-3 gap-1 rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-2">
        {stats.runs && (
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-lime-400 tabular-nums leading-none">{stats.runs}</span>
            <span className="text-[8px] text-zinc-600 uppercase mt-0.5">Runs</span>
          </div>
        )}
        {stats.wickets && (
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-pink-400 tabular-nums leading-none">{stats.wickets}</span>
            <span className="text-[8px] text-zinc-600 uppercase mt-0.5">Wkts</span>
          </div>
        )}
        {stats.matches && (
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-cyan-400 tabular-nums leading-none">{stats.matches}</span>
            <span className="text-[8px] text-zinc-600 uppercase mt-0.5">Mts</span>
          </div>
        )}
        {/* Fallback if nothing parsed */}
        {!stats.runs && !stats.wickets && !stats.matches && (
          <div className="col-span-3 flex items-center justify-center">
            <span className="text-[9px] text-zinc-600 italic">Career data unavailable</span>
          </div>
        )}
      </div>

      {/* Selection order footer */}
      <div className="mt-auto px-3 pb-3 flex items-center justify-between text-[9px] text-zinc-600">
        <span className="font-mono">#{rank}</span>
        <span className={`px-1.5 py-0.5 rounded border ${role.bg} ${role.border} ${role.text} font-bold`}>
          {player.role}
        </span>
      </div>
    </div>
  );
}

export default function XIRecommendations({ data, format = "IPL" }: XIRecommendationsProps) {
  const [selectedTeam, setSelectedTeam] = useState<string>("");

  if (!data) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-3 text-zinc-500">
        <Loader2 className="animate-spin h-8 w-8 text-lime-500/50" />
        <span className="text-xs">Building optimal XI…</span>
      </div>
    );
  }

  const teamsByName = data.teams ?? {};
  const teams = Object.keys(teamsByName);
  const activeTeam = selectedTeam || teams[0] || "";
  const teamData = activeTeam ? teamsByName[activeTeam] : undefined;
  const roleCounts = teamData?.roleCounts ?? { BAT: 0, BOWL: 0, AR: 0, WK: 0 };
  const isLocalFallback = data.source === "local-fallback";

  if (data.error || teams.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/20 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={16} className="text-lime-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Form-Based XI Advisor</h2>
        </div>
        <p className="text-sm text-zinc-500">
          {data.error ? "XI recommendations are temporarily unavailable." : `No XI data found for ${format}.`}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-lime-500/15 border border-lime-500/20 flex items-center justify-center">
              <Zap size={12} className="text-lime-400" />
            </div>
            <h2 className="text-base font-black text-white uppercase tracking-wider">
              Form-Based XI Advisor
            </h2>
            {isLocalFallback && (
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                Career Stats
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed max-w-2xl">
            {isLocalFallback
              ? "Players ranked by historical career performance score (runs × 0.55 + wickets × 22 + matches × 1.5). Switch to BigQuery mode for live form scores."
              : "Players ranked by rolling form score derived from recent match performances, venue history, and consistency metrics."
            }
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[10px] text-zinc-600 font-semibold uppercase tracking-wider">Format</span>
          <span className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-bold text-white">
            {format.toUpperCase()}
          </span>
          {teams.length > 1 && (
            <div className="relative">
              <select
                value={activeTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-white px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-lime-500/50 appearance-none pr-7 font-semibold"
              >
                {teams.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={11} />
            </div>
          )}
        </div>
      </div>

      {/* Role composition bar */}
      {teamData && (
        <div className="flex flex-wrap items-center gap-2 mb-5 p-3 rounded-xl border border-zinc-800/60 bg-zinc-900/30">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mr-1">Composition</span>
          {(["WK","BAT","AR","BOWL"] as const).map((r) => {
            const cfg = ROLE_CONFIG[r];
            return (
              <div key={r} className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                {cfg.icon}
                <span>{roleCounts[r]}× {r}</span>
              </div>
            );
          })}
          <div className="ml-auto flex items-center gap-1 text-[10px] text-zinc-500">
            <Info size={11} />
            <span>Ranked by form score</span>
          </div>
        </div>
      )}

      {/* Player grid */}
      {teamData && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {(teamData.players ?? []).map((player, idx) => (
              <PlayerCard key={player.player} player={player} rank={idx + 1} />
            ))}
          </div>

          {/* Captain / VC footer bar */}
          {(teamData.captain || teamData.viceCaptain) && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {teamData.captain && (
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/8 border border-yellow-500/20 rounded-xl">
                  <Crown size={14} className="text-yellow-400" />
                  <span className="text-[11px] text-zinc-400 font-medium">Captain</span>
                  <span className="text-sm font-black text-yellow-300">{teamData.captain}</span>
                </div>
              )}
              {teamData.viceCaptain && (
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/8 border border-purple-500/20 rounded-xl">
                  <Award size={14} className="text-purple-400" />
                  <span className="text-[11px] text-zinc-400 font-medium">Vice-Captain</span>
                  <span className="text-sm font-black text-purple-300">{teamData.viceCaptain}</span>
                </div>
              )}
              <span className="text-[10px] text-zinc-600 ml-auto">
                {teamData.totalPlayers} players selected
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
