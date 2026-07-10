"use client";

import { motion } from "framer-motion";

/**
 * The page's signature element: a radar-like signal sweep with orbiting
 * "connection" dots and a live mono-font coordinate readout — a visual
 * shorthand for what the product does, echoing Nothing OS's glyph language.
 */
export function HeroSignal() {
  return (
    <div className="relative mt-16 flex h-64 w-64 items-center justify-center">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute rounded-full border border-signal/30"
          style={{ width: `${(i + 1) * 70}px`, height: `${(i + 1) * 70}px` }}
          animate={{ opacity: [0.6, 0.1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
        />
      ))}

      <motion.div
        className="absolute h-full w-full rounded-full"
        style={{
          background: "conic-gradient(from 0deg, rgba(255,85,51,0.35), transparent 30%)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative z-10 flex h-4 w-4 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-signal-pulse rounded-full bg-signal" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-signal ring-4 ring-void" />
      </div>

      <div className="mono-readout absolute -bottom-8 whitespace-nowrap">28.6139° N, 77.2090° E · LIVE</div>
    </div>
  );
}
