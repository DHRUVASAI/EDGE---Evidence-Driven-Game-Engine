"use client";

import React from "react";
import { motion } from "framer-motion";
import { Search, BrainCircuit, Zap } from "lucide-react";

const PRODUCTS = [
  {
    title: "SITUATION ENGINE",
    description: "Similarity search across historical deliveries to find comparable match states instantly.",
    icon: Search,
  },
  {
    title: "TACTICAL RECOMMENDATIONS",
    description: "Explainable AI suggestions for captains and coaches with supporting statistical evidence.",
    icon: BrainCircuit,
  },
  {
    title: "GPU-ACCELERATED ANALYTICS",
    description: "RAPIDS/cuDF powered processing across 9M+ deliveries in real time for lightning-fast insights.",
    icon: Zap,
  },
];

export default function ProductsGrid() {
  return (
    <section className="w-full bg-zinc-950 py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PRODUCTS.map((product, index) => (
            <motion.div
              key={product.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl hover:border-zinc-700 transition-colors"
            >
              <div className="w-12 h-12 bg-blue-900/30 text-blue-400 rounded-xl flex items-center justify-center mb-6">
                <product.icon size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 tracking-wide">{product.title}</h3>
              <p className="text-zinc-400 leading-relaxed">{product.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
