"use client";

import React from "react";
import { motion } from "framer-motion";

const MISSION_CONTENT = {
  text: "Edge is revolutionizing cricket strategy. By ingesting millions of historical deliveries, we identify similar match situations and recommend tactical decisions backed by irrefutable evidence. Explore. Improve. Win.",
};

export default function Mission() {
  return (
    <section className="w-full bg-[#0a0a0f] py-32 px-4 relative overflow-hidden">
      {/* Subtle radial gradient for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(30,41,59,0.12),transparent)]" />

      <div className="max-w-3xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500">
            Our Mission
          </span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="text-2xl md:text-3xl lg:text-[2.5rem] font-medium leading-[1.35] text-zinc-300 tracking-[-0.01em]"
        >
          {MISSION_CONTENT.text}
        </motion.p>
      </div>
    </section>
  );
}
