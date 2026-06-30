"use client";

import React from "react";
import { motion } from "framer-motion";
import { Search, BrainCircuit, Zap } from "lucide-react";

const PRODUCTS = [
  {
    title: "Situation Engine",
    description: "Similarity search across historical deliveries to find comparable match states instantly. Query 9.5M+ deliveries in milliseconds to surface the exact historical context for any ball-by-ball scenario.",
    icon: Search,
    span: "md:col-span-2",
    stat: "9.5M+",
    statLabel: "deliveries indexed",
  },
  {
    title: "Tactical Recommendations",
    description: "Explainable AI suggestions for captains and coaches with supporting statistical evidence. Every recommendation is backed by verifiable historical outcomes.",
    icon: BrainCircuit,
    span: "md:col-span-1",
    stat: "1.5M",
    statLabel: "T20 scenarios",
  },
  {
    title: "GPU-Accelerated Analytics",
    description: "RAPIDS/cuDF powered processing across the entire dataset in real time for lightning-fast insights. From raw delivery data to tactical intelligence in under a second.",
    icon: Zap,
    span: "md:col-span-3",
    stat: "<1s",
    statLabel: "query response",
  },
];

export default function ProductsGrid() {
  return (
    <section className="w-full bg-[#0a0a0f] py-32 px-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_80%,rgba(30,41,59,0.1),transparent)]" />

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
            Core Modules
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold text-white tracking-[-0.03em] mb-5"
          >
            Built for the modern analyst
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base text-zinc-500 leading-relaxed"
          >
            Three engines working together to transform raw delivery data into actionable match-day intelligence.
          </motion.p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRODUCTS.map((product, index) => (
            <motion.div
              key={product.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.1 + index * 0.15 }}
              className={`${product.span} group relative bg-[#0e0e16] border border-zinc-800/60 rounded-2xl transition-all duration-500 hover:border-zinc-700/80 overflow-hidden`}
            >
              {/* Subtle inner gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/[0.08] via-transparent to-transparent" />
              {/* Hover gradient glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-lime-400/[0.04] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              {/* Decorative grid pattern */}
              <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, #a3e635 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

              <div className="relative z-10 p-8 md:p-10 flex flex-col h-full min-h-[220px]">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-lime-400/[0.06] text-lime-400 rounded-2xl flex items-center justify-center border border-lime-400/[0.06]">
                    <product.icon size={26} strokeWidth={1.5} />
                  </div>
                  {/* Stat badge */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white tracking-tight">{product.stat}</div>
                    <div className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">{product.statLabel}</div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-[-0.01em]">{product.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{product.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
