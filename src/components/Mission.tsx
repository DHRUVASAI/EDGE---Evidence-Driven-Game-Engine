"use client";

import React from "react";
import { motion } from "framer-motion";

const MISSION_CONTENT = {
  text: "TACTIX is revolutionizing cricket strategy. By ingesting millions of historical deliveries, we identify similar match situations and recommend tactical decisions backed by irrefutable evidence. Explore. Improve. Win.",
};

export default function Mission() {
  return (
    <section className="w-full bg-zinc-950 py-24 px-4 border-b border-zinc-900">
      <div className="max-w-4xl mx-auto text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-2xl md:text-3xl lg:text-4xl font-medium leading-relaxed text-zinc-300"
        >
          {MISSION_CONTENT.text}
        </motion.p>
      </div>
    </section>
  );
}
