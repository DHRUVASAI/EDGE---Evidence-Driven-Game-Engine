"use client";

import React from "react";
import { motion } from "framer-motion";

export default function ProductEvidence() {
  return (
    <section className="w-full bg-[#0a0a0f] pt-8 pb-32 px-4 relative overflow-hidden">
      {/* Subtle top gradient blending from Hero */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0a0a0f] to-transparent z-10" />

      <div className="max-w-5xl mx-auto relative z-20">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500">
            Product in Action
          </span>
        </motion.div>

        {/* Browser Frame Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="relative"
        >
          {/* Glow behind the card */}
          <div className="absolute -inset-4 bg-gradient-to-b from-lime-500/[0.06] via-transparent to-transparent rounded-3xl blur-2xl" />
          
          {/* Browser chrome */}
          <div className="relative bg-[#0e0e16] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
            {/* Title bar */}
            <div className="flex items-center gap-2 px-5 py-3.5 bg-[#0e0e16] border-b border-zinc-800/60">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-500 font-mono">
                  localhost:3000/demo
                </div>
              </div>
              <div className="w-14" />
            </div>

            {/* Content area — replica of the Analysis Result card */}
            <div className="p-8 md:p-12 bg-gradient-to-b from-[#0e0e16] to-[#0a0a0f]">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Analysis Result</h3>
                  <span className="text-xs font-semibold tracking-[0.15em] uppercase text-lime-400/70 bg-lime-400/[0.06] px-3 py-1 rounded-md border border-lime-400/10">
                    T20 · Powerplay
                  </span>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#12121c] border border-zinc-800/60 p-5 rounded-xl text-center">
                    <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Historical Matches</div>
                    <div className="text-4xl font-bold text-white tracking-tight">111,593</div>
                  </div>
                  <div className="bg-[#12121c] border border-zinc-800/60 p-5 rounded-xl text-center">
                    <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Expected Runs</div>
                    <div className="text-4xl font-bold text-lime-400 tracking-tight">9.2</div>
                    <div className="text-xs text-zinc-600 mt-1">per over</div>
                  </div>
                  <div className="bg-[#12121c] border border-zinc-800/60 p-5 rounded-xl text-center">
                    <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Most Common</div>
                    <div className="text-4xl font-bold text-white tracking-tight">Dot</div>
                    <div className="text-xs text-zinc-600 mt-1">single outcome</div>
                  </div>
                </div>

                {/* Recommendation */}
                <div className="bg-lime-400/[0.04] border border-lime-400/10 p-6 rounded-xl">
                  <div className="text-sm font-semibold text-lime-400 mb-2">Tactical Recommendation</div>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Historical data suggests an aggressive approach here yields ~9.2 runs in the next over. While a Dot remains the most frequent single outcome, the high expected run rate justifies prioritizing boundaries.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
