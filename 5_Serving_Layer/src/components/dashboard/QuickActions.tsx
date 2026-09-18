"use client";

import React from "react";
import Link from "next/link";
import { Zap, Users, Search, TrendingUp, ArrowRight } from "lucide-react";

export default function QuickActions() {
  const actions = [
    {
      title: "Match Situation Analysis",
      description: "Analyze any match situation against 1.5M historical T20 deliveries. Input target, overs, and wickets to get expected run rates and boundary likelihoods.",
      icon: Search,
      cta: "Launch Analysis Tool",
      href: "/demo?tab=situation",
      borderGlow: "hover:border-lime-500/30",
      iconColor: "text-lime-400 bg-lime-400/[0.06] border-lime-400/10",
      buttonStyle: "bg-lime-400 hover:bg-lime-300 text-[#0a0a0f]"
    },
    {
      title: "Bowling Change Recommendations",
      description: "Get explainable AI suggestions for bowling spells. Evaluate pace vs spin effectiveness and spell longevity based on historical matches.",
      icon: Zap,
      cta: "Get Bowling Recommendations",
      href: "/demo?tab=bowling",
      borderGlow: "hover:border-emerald-500/30",
      iconColor: "text-emerald-400 bg-emerald-400/[0.06] border-emerald-400/10",
      buttonStyle: "border border-zinc-700 hover:border-zinc-500 text-zinc-200 hover:text-white bg-zinc-900/20"
    },
    {
      title: "Player Matchup Insights",
      description: "Access head-to-head records and FUT-style player matchup telemetry. Search over 11,000 players to analyze batsman vs bowler dynamics.",
      icon: Users,
      cta: "Launch Matchup Studio",
      href: "/players",
      borderGlow: "hover:border-blue-500/30",
      iconColor: "text-blue-400 bg-blue-400/[0.06] border-blue-400/10",
      buttonStyle: "border border-zinc-700 hover:border-zinc-500 text-zinc-200 hover:text-white bg-zinc-900/20"
    },
    {
      title: "Live Win Probability & Risk Scoring",
      description: "Compute chasing success rates and risk index for any live game scenario. Assess required run rates against dynamic historical baselines.",
      icon: TrendingUp,
      cta: "Calculate Chasing Odds",
      href: "#win-prob-calculator",
      borderGlow: "hover:border-pink-500/30",
      iconColor: "text-pink-400 bg-pink-400/[0.06] border-pink-400/10",
      buttonStyle: "border border-zinc-700 hover:border-zinc-500 text-zinc-200 hover:text-white bg-zinc-900/20",
      isAnchor: true
    }
  ];

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const targetId = href.substring(1);
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
      {actions.map((act, index) => (
        <div 
          key={index} 
          className={`relative overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900/40 via-zinc-900/10 to-transparent p-8 transition-all duration-300 group ${act.borderGlow}`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-lime-400/[0.01] rounded-full blur-2xl group-hover:bg-lime-400/[0.03] transition-all" />
          
          <div className="flex items-start gap-4">
            <div className={`p-3 border rounded-lg shrink-0 ${act.iconColor}`}>
              <act.icon size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {act.title}
              </h3>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed max-w-md">
                {act.description}
              </p>
              {act.isAnchor ? (
                <a
                  href={act.href}
                  onClick={(e) => handleAnchorClick(e, act.href)}
                  className={`inline-flex items-center gap-2 mt-6 px-5 py-2.5 font-semibold text-xs rounded-lg transition-all hover:scale-[1.02] cursor-pointer ${act.buttonStyle}`}
                >
                  {act.cta}
                  <ArrowRight size={14} />
                </a>
              ) : (
                <Link
                  href={act.href}
                  className={`inline-flex items-center gap-2 mt-6 px-5 py-2.5 font-semibold text-xs rounded-lg transition-all hover:scale-[1.02] ${act.buttonStyle}`}
                >
                  {act.cta}
                  <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
