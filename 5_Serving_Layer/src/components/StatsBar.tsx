"use client";

import React from "react";
import { motion } from "framer-motion";

const STATS = [
  { value: "9.5M+", label: "Deliveries Analyzed" },
  { value: "14,700+", label: "Matches Modeled" },
  { value: "1.5M", label: "T20 Situations" },
  { value: "Real-time", label: "GCP + NVIDIA Powered" },
];

export default function StatsBar() {
  return (
    <section className="w-full bg-[#0a0a0f] py-24 px-4 relative overflow-hidden">
      {/* Subtle gradient bar */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_50%,rgba(163,230,53,0.03),transparent)]" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
          {STATS.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center text-center px-4 md:border-r last:border-r-0 border-zinc-800/40"
            >
              <div className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-[-0.03em]">
                {stat.value}
              </div>
              <div className="text-xs font-semibold text-zinc-500 tracking-[0.15em] uppercase">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
