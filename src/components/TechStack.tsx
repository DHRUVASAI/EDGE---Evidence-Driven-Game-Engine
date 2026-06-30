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
    <section className="w-full bg-zinc-950 py-24 px-4">
      <div className="max-w-5xl mx-auto text-center">
        <h3 className="text-sm font-semibold tracking-widest text-zinc-500 uppercase mb-8">
          Powered By Industry-Leading Technology
        </h3>
        <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8">
          {TECH_STACK.map((tech, index) => (
            <motion.div
              key={tech}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center hover:border-zinc-700 transition-colors cursor-default"
            >
              <span className="text-zinc-300 font-medium">{tech}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
