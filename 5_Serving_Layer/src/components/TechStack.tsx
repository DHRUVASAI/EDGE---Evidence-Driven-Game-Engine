"use client";

import React from "react";
import { motion } from "framer-motion";

const TECH_STACK = [
  "BigQuery",
  "Cloud Storage",
  "Looker",
  "NVIDIA RAPIDS",
  "cuDF",
  "Google Cloud GPUs",
];

export default function TechStack() {
  return (
    <section className="w-full bg-[#0a0a0f] py-24 px-4 relative overflow-hidden">
      <div className="max-w-5xl mx-auto text-center relative z-10">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500 block mb-10"
        >
          Powered By Industry-Leading Technology
        </motion.span>
        <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4">
          {TECH_STACK.map((tech, index) => (
            <motion.div
              key={tech}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="px-5 py-2.5 bg-[#0e0e16] border border-zinc-800/60 rounded-[10px] flex items-center justify-center hover:border-zinc-700/80 transition-all duration-300 cursor-default"
            >
              <span className="text-sm text-zinc-400 font-medium">{tech}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
