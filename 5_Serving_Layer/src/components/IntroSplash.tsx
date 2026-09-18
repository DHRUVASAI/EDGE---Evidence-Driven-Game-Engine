"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function IntroSplash() {
  const [show, setShow] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Only show if not already played this session
    if (typeof window !== "undefined") {
      if (!sessionStorage.getItem("intro_played")) {
        setShow(true);
      }

      const handlePlayIntro = () => {
        // Clear it so it plays
        sessionStorage.removeItem("intro_played");
        setShow(true);
      };
      window.addEventListener("play_intro", handlePlayIntro);
      return () => window.removeEventListener("play_intro", handlePlayIntro);
    }
  }, []);

  const dismiss = useCallback(() => {
    sessionStorage.setItem("intro_played", "1");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("intro_dismissed"));
    }
    setShow(false);
  }, []);

  const handleVideoEnd = useCallback(() => {
    // Small pause before fading so the final frame holds
    setTimeout(() => dismiss(), 200);
  }, [dismiss]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
        >
          <video
            ref={videoRef}
            src="/hero.mp4"
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnd}
            className="w-full h-full object-cover"
          />

          {/* Skip button */}
          <button
            onClick={dismiss}
            className="absolute bottom-8 right-8 text-xs font-medium text-zinc-500 hover:text-white transition-colors tracking-wider uppercase z-10"
          >
            Skip →
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
