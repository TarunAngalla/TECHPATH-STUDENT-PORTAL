"use client";

import { useReducedMotion } from "framer-motion";

export const AUTH_TAGLINES = [
  "We Don't Find You Jobs · We Build Your Path.",
  "From Training to Placement — We've Got You Covered.",
  "Your Career, Our Commitment.",
  "Guiding OPT & STEM OPT Talent to Success.",
] as const;

function MarqueeRow({
  taglines,
  direction = "left",
  speed = 40,
  className = "",
}: {
  taglines: readonly string[];
  direction?: "left" | "right";
  speed?: number;
  className?: string;
}) {
  const items = [...taglines, ...taglines];

  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`} aria-hidden="true">
      <div
        className="inline-flex gap-12 auth-marquee-track"
        style={{
          animationDuration: `${speed}s`,
          animationDirection: direction === "right" ? "reverse" : "normal",
        }}
      >
        {items.map((line, i) => (
          <span
            key={`${line}-${i}`}
            className="inline-flex items-center gap-12 text-xs font-bold uppercase tracking-widest text-brand-600/5 select-none"
          >
            {line}
            <span className="text-accent/10">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function AuthTaglineMarquee() {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div
        className="absolute inset-0 flex flex-col justify-center gap-6 px-8 pointer-events-none"
        aria-hidden="true"
      >
        {AUTH_TAGLINES.map((line) => (
          <p
            key={line}
            className="text-xs font-bold uppercase tracking-widest text-brand-600/5 text-center"
          >
            {line}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-10 sm:gap-14 pointer-events-none" aria-hidden="true">
      <MarqueeRow taglines={AUTH_TAGLINES} direction="left" speed={55} className="opacity-80" />
      <MarqueeRow
        taglines={[...AUTH_TAGLINES].reverse()}
        direction="right"
        speed={45}
        className="opacity-60"
      />
      <MarqueeRow taglines={AUTH_TAGLINES} direction="left" speed={65} className="opacity-40 hidden sm:block" />
    </div>
  );
}
