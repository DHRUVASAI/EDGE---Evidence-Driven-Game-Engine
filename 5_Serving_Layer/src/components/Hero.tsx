"use client";

import Link from "next/link";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X } from "lucide-react";

const HERO_CONTENT = {
  eyebrow: "AI-Powered Cricket Intelligence",
  headline: "Decode the Game Before It's Played",
  subheadline: "AI-powered tactical decisions derived from ball-by-ball cricket data to give you the ultimate edge.",
  primaryCTA: "Try the Demo",
  secondaryCTA: "Watch Video",
};

export default function Hero() {
  const [startAnimation, setStartAnimation] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (sessionStorage.getItem("intro_played")) {
        setStartAnimation(true);
      } else {
        const handleDismiss = () => setStartAnimation(true);
        window.addEventListener("intro_dismissed", handleDismiss);
        return () => window.removeEventListener("intro_dismissed", handleDismiss);
      }
    }
  }, []);

  const openVideo = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("play_intro"));
    }
  }, []);

  return (
    <>
      <section className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0f]">
        {/* Layered static gradient background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(163,230,53,0.08),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_80%,rgba(30,41,59,0.15),transparent)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/40 via-transparent to-[#0a0a0f]" />
        </div>

        <motion.div 
          initial={{ scale: 0.98 }}
          animate={startAnimation ? { scale: 1 } : { scale: 0.98 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto"
        >
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={startAnimation ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 text-xs font-semibold tracking-[0.2em] uppercase text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
              {HERO_CONTENT.eyebrow}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={startAnimation ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-[-0.03em] text-white mb-6 leading-[0.95]"
          >
            {HERO_CONTENT.headline}
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={startAnimation ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-base md:text-lg text-zinc-400 mb-12 max-w-xl leading-relaxed"
          >
            {HERO_CONTENT.subheadline}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={startAnimation ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <Link
              href="/demo"
              className="px-8 py-3.5 bg-lime-400 hover:bg-lime-300 text-[#0a0a0f] font-semibold rounded-[10px] transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(163,230,53,0.2)] w-full sm:w-auto text-center"
            >
              {HERO_CONTENT.primaryCTA}
            </Link>
            <button
              onClick={openVideo}
              className="px-8 py-3.5 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-medium rounded-[10px] transition-all duration-200 hover:scale-[1.03] w-full sm:w-auto bg-white/[0.02]"
            >
              {HERO_CONTENT.secondaryCTA}
            </button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={startAnimation ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-zinc-600"
        >
          <ChevronDown size={28} />
        </motion.div>
      </section>

    </>
  );
}
