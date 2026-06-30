"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";

const TABS = [
  {
    id: "situation",
    title: "Match Situation Analysis",
    description: "Analyze the current match context against millions of historical scenarios. Understand the par score, survival probability, and optimal pacing for the current partnership.",
    image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=800&h=600", // TODO: replace with real screenshot
  },
  {
    id: "bowling",
    title: "Bowling Change Recommendations",
    description: "AI-driven suggestions for when to introduce spin, hold back pace, or deploy your strike bowler based on matchup data and pitch degradation modeling.",
    image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=800&h=600", // TODO: replace with real screenshot
  },
  {
    id: "matchup",
    title: "Player Matchup Insights",
    description: "Deep dive into batter vs bowler historical performance. Discover hidden weaknesses against specific delivery types, lengths, and lines.",
    image: "https://images.unsplash.com/photo-1624526267942-ab0f0b580615?auto=format&fit=crop&q=80&w=800&h=600", // TODO: replace with real screenshot
  },
  {
    id: "winprob",
    title: "Live Win Probability & Risk Scoring",
    description: "Real-time win probability updates that factor in not just the scoreline, but remaining resources, batter quality, and historical chase success rates at the venue.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800&h=600", // TODO: replace with real screenshot
  },
];

export default function PlatformDeepDive() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  const activeContent = TABS.find((t) => t.id === activeTab);

  return (
    <section className="w-full bg-zinc-950 py-24 px-4 border-t border-zinc-900">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 text-center md:text-left">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Platform Deep-Dive</h2>
          <p className="text-xl text-zinc-400 max-w-2xl">
            Explore the core modules that power TACTIX and deliver match-winning insights.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Tabs Navigation */}
          <div className="flex flex-col gap-2 lg:w-1/3">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-left p-6 rounded-xl transition-all flex items-center justify-between group ${
                  activeTab === tab.id
                    ? "bg-zinc-800/50 border border-zinc-700"
                    : "hover:bg-zinc-900 border border-transparent"
                }`}
              >
                <div>
                  <h3 className={`text-lg font-semibold ${activeTab === tab.id ? "text-lime-400" : "text-white group-hover:text-zinc-300"}`}>
                    {tab.title}
                  </h3>
                </div>
                <ChevronRight
                  className={`transition-transform ${activeTab === tab.id ? "text-lime-400 translate-x-1" : "text-zinc-600 group-hover:translate-x-1"}`}
                />
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="lg:w-2/3">
            <AnimatePresence mode="wait">
              {activeContent && (
                <motion.div
                  key={activeContent.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8 overflow-hidden h-full flex flex-col"
                >
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-white mb-4">{activeContent.title}</h3>
                    <p className="text-zinc-400 text-lg leading-relaxed">{activeContent.description}</p>
                  </div>
                  
                  {/* Image Placeholder */}
                  <div className="relative flex-1 min-h-[300px] w-full rounded-xl overflow-hidden bg-zinc-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeContent.image}
                      alt={activeContent.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-luminosity hover:mix-blend-normal transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
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
