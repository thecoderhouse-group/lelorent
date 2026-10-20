"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";

/**
 * Scroll-driven landing hero.
 *
 * The section is a tall "track"; inside it a sticky stage stays pinned while
 * the user scrolls through the track. Everything is a pure function of scroll
 * progress (0 → 1), so scrolling back up plays the same animation in reverse
 * with no extra code.
 *
 *   progress 0.00  full society view, headline + search visible
 *   progress 0.00 → 0.45  copy drifts up and fades; the camera pushes in,
 *                          tilting and rotating for a 3D feel
 *   progress 0.50 → 0.90  the three benefit points fade in over the close-up
 *
 * The background is `/hero/society.webp`.
 *
 * The whole stage is forced into the dark palette (`dark` class) so the
 * gold-on-black look holds regardless of the site theme.
 *
 * With the OS "reduce motion" setting on, the same sequence plays with a
 * small zoom and no rotation or tilt.
 */
export function ScrollHero({
  children,
  benefits,
}: {
  children: React.ReactNode;
  benefits: React.ReactNode;
}) {
  const track = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: track,
    offset: ["start start", "end end"],
  });
  // A little spring smooths wheel-notch jumps without breaking reversibility.
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.4 });

  // Reduced motion keeps the scroll story but drops the vestibular triggers:
  // a small, slow zoom with no tilt or spin.
  const scale = useTransform(p, [0, 1], [1.05, reduce ? 1.25 : 2.2]);
  const rotateX = useTransform(p, [0, 1], [0, reduce ? 0 : 22]);
  const rotateZ = useTransform(p, [0, 1], [0, reduce ? 0 : -7]);
  const bgY = useTransform(p, [0, 1], ["0%", reduce ? "-3%" : "-9%"]);

  const copyY = useTransform(p, [0, 0.45], [0, reduce ? -40 : -140]);
  const copyOpacity = useTransform(p, [0, 0.35, 0.5], [1, 1, 0]);
  const copyEvents = useTransform(copyOpacity, (v) => (v < 0.2 ? "none" : "auto"));

  const benefitsOpacity = useTransform(p, [0.5, 0.7, 0.92, 1], [0, 1, 1, 1]);
  // Same start value for both modes: the server can't know the reduce-motion
  // setting, so anything rendered at progress 0 must not depend on it.
  const benefitsY = useTransform(p, [0.5, 0.75], [40, 0]);
  const benefitsEvents = useTransform(benefitsOpacity, (v) =>
    v < 0.2 ? "none" : "auto",
  );

  const veil = useTransform(p, [0, 0.5, 1], [0.2, 0.4, 0.55]);

  return (
    <section
      ref={track}
      className="dark relative h-[260vh] border-b border-hairline bg-background text-foreground"
    >
      <div className="sticky top-16 h-[calc(100svh-4rem)] overflow-hidden [perspective:1100px]">
        {/* 3D background. Oversized so rotation never exposes an edge. */}
        <motion.div
          aria-hidden="true"
          className="absolute -inset-[18%] bg-cover bg-center will-change-transform"
          style={{
            backgroundImage:
              "url(/hero/society.webp?v=2)",
            scale,
            rotateX,
            rotateZ,
            y: bgY,
            // Zoom target: the pool and clubhouse at the centre of the society.
            transformOrigin: "53% 66%",
          }}
        />

        {/* Black veil keeps copy readable; a gold glow bottom-right ties it
            to the brand. */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 bg-black"
          style={{ opacity: veil }}
        />
        {/* Readability scrim: dark where the copy sits (left), clear on the
            right so the image still shows. On phones the copy spans the full
            width, so the scrim is a flat wash instead. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-black/55 md:bg-transparent md:bg-[linear-gradient(to_right,rgb(0_0_0/0.88)_0%,rgb(0_0_0/0.7)_35%,rgb(0_0_0/0.25)_62%,transparent_80%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(60rem 30rem at 85% 110%, color-mix(in oklab, var(--primary) 28%, transparent), transparent 70%), linear-gradient(to bottom, transparent 60%, var(--background))",
          }}
        />

        {/* Headline, search, chips. */}
        <motion.div
          className="relative z-10 mx-auto flex h-full w-full max-w-[1400px] items-center px-4 sm:px-6"
          style={{ y: copyY, opacity: copyOpacity, pointerEvents: copyEvents }}
        >
          <div className="w-full">{children}</div>
        </motion.div>

        {/* Benefits, revealed over the close-up. */}
        <motion.div
          className="absolute inset-0 z-10 mx-auto flex w-full max-w-[1400px] items-center px-4 sm:px-6"
          style={{ y: benefitsY, opacity: benefitsOpacity, pointerEvents: benefitsEvents }}
        >
          <div className="w-full">{benefits}</div>
        </motion.div>
      </div>
    </section>
  );
}
