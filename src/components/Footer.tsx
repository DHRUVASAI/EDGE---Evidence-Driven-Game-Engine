"use client";

import React from "react";
import { Github, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-black py-12 px-4 border-t border-zinc-900">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="text-2xl font-bold tracking-tighter text-white">
            TACTIX
          </div>
          <p className="text-zinc-500 text-sm">
            Built for Gen AI Academy APAC Edition
          </p>
        </div>
        
        <div className="flex items-center gap-6">
          <a href="#" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 text-sm">
            <Github size={18} />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <a href="mailto:contact@tactix.test" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 text-sm">
            <Mail size={18} />
            <span className="hidden sm:inline">Contact</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
