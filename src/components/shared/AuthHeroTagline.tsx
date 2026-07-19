"use client";

import { motion } from "framer-motion";

export function AuthHeroTagline() {
  return (
    <div className="space-y-3 max-w-md">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-brand-600 bg-brand-50 border border-brand-100/50 mb-2 shadow-xs">
          🚀 Career Portal
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary leading-tight font-display tracking-tight">
          We Don&apos;t Find You Jobs.
          <span className="block text-gradient mt-1">We Build Your Path.</span>
        </h2>
      </motion.div>
    </div>
  );
}
