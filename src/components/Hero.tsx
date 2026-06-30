"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const HERO_CONTENT = {
  headline: "Decode the Game Before It's Played",
  subheadline: "AI-powered tactical decisions derived from ball-by-ball cricket data to give you the ultimate edge.",
  primaryCTA: "Try the Demo",
  secondaryCTA: "Watch Video",
  videoSrc: "/hero.mp4", // TODO: replace with real placeholder/video
};

export default function Hero() {
  return (
    <section className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-zinc-950">
      {/* Fallback gradient background / Video background */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-zinc-950 to-zinc-950">
        <video
          src={HERO_CONTENT.videoSrc}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-950/90" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6"
        >
          {HERO_CONTENT.headline}
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-zinc-300 mb-10 max-w-2xl"
        >
          {HERO_CONTENT.subheadline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <button className="px-8 py-4 bg-lime-500 hover:bg-lime-400 text-zinc-950 font-semibold rounded-full transition-colors w-full sm:w-auto">
            {HERO_CONTENT.primaryCTA}
          </button>
          <button className="px-8 py-4 border border-zinc-500 hover:border-white text-white font-semibold rounded-full transition-colors w-full sm:w-auto">
            {HERO_CONTENT.secondaryCTA}
          </button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-zinc-500"
      >
        <ChevronDown size={32} />
      </motion.div>
    </section>
  );
}
