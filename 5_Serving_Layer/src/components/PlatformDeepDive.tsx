"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

const TABS = [
  {
    id: "situation",
    title: "Match Situation Analysis",
    description: "Analyze the current match context against millions of historical scenarios. Understand the optimal pacing, par scores, and historical outcomes for the current state.",
    image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=800&h=600",
    link: "/demo",
    cta: "Launch Decision Engine",
  },
  {
    id: "bowling",
    title: "Bowling Change Recommendations",
    description: "AI-driven suggestions for when to introduce spin, hold back pace, or deploy your strike bowler based on matchup data and pitch degradation modeling.",
    image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=800&h=600",
    comingSoon: true,
  },
  {
    id: "matchup",
    title: "Player Matchup Insights",
    description: "Deep dive into batter vs bowler historical performance. Discover hidden weaknesses against specific delivery types, lengths, and lines.",
    image: "https://plus.unsplash.com/premium_photo-1679917489673-b952cee5857a?auto=format&fit=crop&q=80&w=800&h=600",
    link: "/players",
    cta: "Search Player Stats",
  },
  {
    id: "winprob",
    title: "Live Win Probability & Risk Scoring",
    description: "Real-time win probability updates that factor in not just the scoreline, but remaining resources, batter quality, and historical chase success rates at the venue.",
    image: "https://plus.unsplash.com/premium_photo-1664304605904-d0aa3a50a5b7?auto=format&fit=crop&q=80&w=800&h=600",
    comingSoon: true,
  },
];

export default function PlatformDeepDive() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  const activeContent = TABS.find((t) => t.id === activeTab);

  return (
    <section className="w-full bg-[#0a0a0f] py-32 px-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_20%,rgba(30,41,59,0.1),transparent)]" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section header — left aligned */}
        <div className="mb-16 max-w-2xl">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500 block mb-4"
          >
            Platform Deep-Dive
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold text-white tracking-[-0.03em] mb-5"
          >
            Explore the core modules
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base text-zinc-500 leading-relaxed"
          >
            The engines that power Edge and deliver match-winning insights.
          </motion.p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Tabs Navigation — left side */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col gap-1.5 lg:w-[340px] shrink-0"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-left p-5 rounded-xl transition-all duration-300 flex items-center justify-between group ${
                  activeTab === tab.id
                    ? "bg-[#0e0e16] border border-zinc-800/60"
                    : "border border-transparent hover:bg-[#0e0e16]/50"
                }`}
              >
                <div className="flex flex-col pr-4">
                  <h3 className={`text-sm font-semibold transition-colors duration-200 ${activeTab === tab.id ? "text-lime-400" : "text-zinc-300 group-hover:text-white"}`}>
                    {tab.title}
                  </h3>
                  {tab.comingSoon && (
                    <span className="inline-flex text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1.5">
                      Coming Soon
                    </span>
                  )}
                </div>
                <ChevronRight
                  size={16}
                  className={`transition-all duration-200 shrink-0 ${activeTab === tab.id ? "text-lime-400 translate-x-0.5" : "text-zinc-700 group-hover:text-zinc-500 group-hover:translate-x-0.5"}`}
                />
              </button>
            ))}
          </motion.div>

          {/* Tab Content — right side, larger */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {activeContent && (
                <motion.div
                  key={activeContent.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.35 }}
                  className="bg-[#0e0e16] border border-zinc-800/60 rounded-2xl p-6 md:p-8 overflow-hidden h-full flex flex-col"
                >
                  <div className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-3 tracking-[-0.01em]">{activeContent.title}</h3>
                      <p className="text-sm text-zinc-500 leading-relaxed max-w-xl">{activeContent.description}</p>
                    </div>
                    {activeContent.link && (
                      <Link 
                        href={activeContent.link}
                        className="px-5 py-2.5 bg-lime-400 hover:bg-lime-300 text-[#0a0a0f] text-xs font-semibold rounded-[10px] transition-all duration-200 shrink-0 hover:scale-[1.03] text-center"
                      >
                        {activeContent.cta} →
                      </Link>
                    )}
                  </div>
                  
                  {/* Image */}
                  <div className="relative flex-1 min-h-[300px] w-full rounded-xl overflow-hidden bg-[#12121c]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeContent.image}
                      alt={activeContent.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-70 mix-blend-luminosity hover:mix-blend-normal hover:opacity-90 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e16] via-transparent to-transparent" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
