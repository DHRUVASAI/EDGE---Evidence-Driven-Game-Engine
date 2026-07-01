"use client";

import React from "react";
import { GitBranch, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-[#0a0a0f] py-12 px-4 border-t border-zinc-800/40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="text-xl font-bold tracking-[-0.03em] text-white">
            Edge
          </div>
          <p className="text-zinc-600 text-xs">
            Built for Gen AI Academy APAC Edition
          </p>
        </div>
        
        <div className="flex items-center gap-6">
          <a href="https://github.com/DHRUVASAI/EDGE---Evidence-Driven-Game-Engine" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors duration-200 flex items-center gap-2 text-xs font-medium">
            <GitBranch size={16} />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <a href="mailto:dhruvasai1706@gmail.com" className="text-zinc-500 hover:text-white transition-colors duration-200 flex items-center gap-2 text-xs font-medium">
            <Mail size={16} />
            <span className="hidden sm:inline">Contact</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
