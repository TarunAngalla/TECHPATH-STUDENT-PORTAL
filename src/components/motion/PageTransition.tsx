"use client";

import { motion, useReducedMotion } from "framer-motion";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? false : "initial"}
      animate="animate"
      exit={prefersReducedMotion ? undefined : "exit"}
      variants={pageVariants}
      transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerChildren({
  children,
  className,
  stagger = 0.08,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: prefersReducedMotion ? 0 : 0.35, ease: "easeOut" },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedProgress({ value, className }: { value: number; className?: string }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={`h-2 rounded-full bg-border-subtle overflow-hidden ${className ?? ""}`}>
      <motion.div
        className="h-full rounded-full brand-gradient"
        initial={{ width: prefersReducedMotion ? `${Math.min(100, Math.max(0, value))}%` : 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.8, ease: "easeOut" }}
      />
    </div>
  );
}
