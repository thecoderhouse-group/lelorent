"use client";

import { motion } from "motion/react";

import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

/**
 * Rises and fades a child into place when it scrolls into view, staggered by
 * `index`. By default it replays each time it re-enters, matching the rest of
 * the landing page; pass `once` to play it a single time.
 *
 * With reduce motion on, it only fades.
 */
export function Reveal({
  index = 0,
  once = false,
  children,
  className,
}: {
  index?: number;
  /** Play only the first time it enters view (e.g. search results). */
  once?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = usePrefersReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 48, rotateX: 10, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      viewport={{ once, amount: 0.15 }}
      transition={
        reduce
          ? { duration: 0.4, delay: index * 0.04 }
          : {
              type: "spring",
              stiffness: 120,
              damping: 18,
              mass: 0.8,
              delay: (index % 4) * 0.08 + Math.floor(index / 4) * 0.12,
            }
      }
      style={{ transformPerspective: 1000, transformOrigin: "50% 100%" }}
    >
      {children}
    </motion.div>
  );
}
