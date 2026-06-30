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
    <section className="w-full bg-blue-950/20 py-16 px-4 border-y border-blue-900/30">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x-0 md:divide-x divide-blue-900/50">
          {STATS.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center text-center px-4"
            >
              <div className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">
                {stat.value}
              </div>
              <div className="text-blue-300 font-medium tracking-wide uppercase text-sm">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
