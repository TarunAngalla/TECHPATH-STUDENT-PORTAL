"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AUTH_TAGLINES } from "./AuthTaglineMarquee";

const HERO_LINES = [
  { lead: "We Don't Find You Jobs", accent: "We Build Your Path." },
  { lead: "From Training to Placement", accent: "We've Got You Covered." },
  { lead: "Your Career,", accent: "Our Commitment." },
] as const;

export function AuthHeroTagline() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="space-y-8 max-w-xl">
      {HERO_LINES.map((block, i) => (
        <motion.div
          key={block.lead}
          initial={reduceMotion ? false : { opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.15, duration: 0.5, ease: "easeOut" }}
        >
          <p className="text-[clamp(2rem,4.5vw,3.5rem)] font-display font-semibold leading-[1.1] text-text-primary">
            {block.lead}
            <br />
            <span className="text-gradient">{block.accent}</span>
          </p>
        </motion.div>
      ))}

      <motion.p
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="text-base sm:text-lg text-text-muted leading-relaxed max-w-md"
      >
        {AUTH_TAGLINES[3]}
      </motion.p>
    </div>
  );
}
