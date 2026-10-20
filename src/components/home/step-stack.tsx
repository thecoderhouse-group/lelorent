"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";

import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

export type StepCard = {
  key: string;
  /** Optional in-page anchor (e.g. "how-it-works") that scrolls to this card. */
  anchor?: string;
  eyebrow: string;
  title: string;
  lede: string;
  content: React.ReactNode;
  /** Background image for this card; cross-fades in as the card arrives. */
  background?: string;
};

/**
 * Pinned scroll scene: near-full-screen cards, each showing its own image,
 * over a full-screen blurred copy of the current card's image (cross-fading
 * as cards change). Scrolling moves the current card up and back
 * while the next one rises in from below. Every value is a function of scroll
 * progress, so scrolling up plays it in reverse.
 *
 * With the OS "reduce motion" setting on, cards cross-fade in place instead.
 */
export function StepStack({ cards }: { cards: StepCard[] }) {
  const track = useRef<HTMLElement>(null);
  const reduce = usePrefersReducedMotion();
  const n = cards.length;

  const { scrollYProgress } = useScroll({
    target: track,
    offset: ["start start", "end end"],
  });
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.4 });

  // Reels-style snapping. When scrolling settles mid-transition, finish the
  // move in the direction the user was going, so the scene never rests
  // between two cards. Rest zones (one card fully in view) are left alone.
  useEffect(() => {
    const el = track.current;
    if (!el) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastSettledY = window.scrollY;

    const geometry = () => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      const range = el.offsetHeight - window.innerHeight;
      return { top, range };
    };

    const settle = () => {
      const { top, range } = geometry();
      if (range <= 0) return;
      const y = window.scrollY;
      const progress = (y - top) / range;
      const goingDown = y >= lastSettledY;
      lastSettledY = y;
      if (progress <= 0 || progress >= 1) return;

      for (let k = 1; k < n; k++) {
        const [start, end] = transitionWindow(k, n);
        if (progress > start && progress < end) {
          // Land just inside the neighbouring rest zone.
          const target = goingDown ? end + 0.01 : start - 0.01;
          const targetY = top + target * range;
          lastSettledY = targetY;
          window.scrollTo({ top: targetY, behavior: reduce ? "auto" : "smooth" });
          return;
        }
      }
    };

    // Debounced "scroll stopped" — works everywhere, including browsers
    // without the scrollend event, and waits out trackpad momentum.
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(settle, 140);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
  }, [n, reduce]);

  const bgScale = useTransform(p, [0, 1], [1.1, reduce ? 1.1 : 1.25]);

  return (
    <section
      ref={track}
      className="dark relative border-y border-hairline bg-background text-foreground"
      // ~120vh of scroll per card, plus the pinned screen itself.
      style={{ height: `${n * 120}vh` }}
    >
      {/* Anchors placed where each card is fully in view, so footer links
          like /#how-it-works land on the right card. */}
      {cards.map((card, i) =>
        card.anchor ? (
          <div
            key={card.anchor}
            id={card.anchor}
            aria-hidden="true"
            className="absolute left-0 h-px w-px"
            style={{ top: `${i === 0 ? 0 : (transitionWindow(i, n)[1] + 0.02) * 100 * ((n * 120 - 100) / (n * 120))}%` }}
          />
        ) : null,
      )}

      <div className="sticky top-16 h-[calc(100svh-4rem)] overflow-hidden">
        {/* Ambient backdrop: a heavily blurred copy of the current card's
            image, one layer per card, later layers on top. Scaled together
            for a slow push-in; oversized so the blur never shows an edge.
            Falls back to the skyline when a card has no image. */}
        <motion.div aria-hidden="true" className="absolute -inset-16" style={{ scale: bgScale }}>
          {cards.map((card, i) => (
            <BackgroundLayer
              key={card.key}
              src={card.background ?? "/hero/cities-band.webp?v=2"}
              index={i}
              count={n}
              p={p}
            />
          ))}
        </motion.div>
        <div aria-hidden="true" className="absolute inset-0 bg-black/30" />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(60rem_35rem_at_80%_100%,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_70%)]"
        />

        <div className="absolute inset-0 flex items-center justify-center [perspective:1400px]">
          {cards.map((card, i) => (
            <StackCard key={card.key} card={card} index={i} count={n} p={p} reduce={reduce} />
          ))}
        </div>

        {/* Progress: one segment per card. */}
        <div className="absolute bottom-[2.5%] left-1/2 z-50 flex -translate-x-1/2 gap-2">
          {cards.map((card, i) => (
            <ProgressPip key={card.key} index={i} count={n} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Scroll window [start, end] for the transition into card `k` (k ≥ 1). */
function transitionWindow(k: number, n: number): [number, number] {
  const at = k / n;
  return [at - 0.12, at + 0.08];
}

function StackCard({
  card,
  index,
  count,
  p,
  reduce,
}: {
  card: StepCard;
  index: number;
  count: number;
  p: MotionValue<number>;
  reduce: boolean;
}) {
  const first = index === 0;
  const last = index === count - 1;
  const [inStart, inEnd] = first ? [-2, -1] : transitionWindow(index, count);
  const [outStart, outEnd] = last ? [2, 3] : transitionWindow(index + 1, count);
  const range = [inStart, inEnd, outStart, outEnd];

  // Entering: rises from below, tilted. Leaving: drifts up and back.
  // Reduce mode cross-fades in place instead. The reduce flag is false during
  // hydration (see usePrefersReducedMotion), so server HTML always matches.
  const y = useTransform(p, range, reduce ? ["0%", "0%", "0%", "0%"] : ["108%", "0%", "0%", "-14%"]);
  const scale = useTransform(p, range, reduce ? [1, 1, 1, 1] : [0.94, 1, 1, 0.86]);
  const rotateX = useTransform(p, range, reduce ? [0, 0, 0, 0] : [14, 0, 0, -8]);
  const opacity = useTransform(p, range, first ? [1, 1, 1, 0] : [reduce ? 0 : 1, 1, 1, last ? 1 : 0]);
  const events = useTransform(opacity, (v) => (v > 0.6 ? "auto" : "none"));

  return (
    <motion.article
      aria-labelledby={`${card.key}-title`}
      className="absolute flex h-[90%] w-[94vw] flex-col overflow-hidden rounded-2xl border border-primary/20 bg-black shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)] will-change-transform"
      style={{ y, scale, rotateX, opacity, pointerEvents: events, zIndex: index + 1, transformOrigin: "50% 100%" }}
    >
      {/* The card's own image, sharp. Darkened at the top (heading) and the
          bottom (tiles) so content reads; the middle stays clear. */}
      {card.background && (
        <>
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${card.background})` }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(to_bottom,rgb(0_0_0/0.78)_0%,rgb(0_0_0/0.35)_38%,rgb(0_0_0/0.3)_55%,rgb(0_0_0/0.82)_100%)]"
          />
        </>
      )}

      {/* Oversized step number, purely decorative. */}
      <span
        aria-hidden="true"
        className="tnum pointer-events-none absolute -top-4 right-4 select-none text-[9rem] font-semibold leading-none text-primary/10 sm:right-8 sm:text-[13rem]"
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="relative flex h-full flex-col overflow-y-auto px-5 py-6 [scrollbar-width:none] sm:px-10 sm:py-10 lg:px-14 lg:py-12">
        <header className="max-w-2xl [text-shadow:0_1px_12px_rgb(0_0_0/0.85)]">
          <p className="sign-label text-primary">{card.eyebrow}</p>
          <h2
            id={`${card.key}-title`}
            className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl"
          >
            {card.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/75 sm:text-base">
            {card.lede}
          </p>
        </header>

        {/* Content sits low in the card, leaving the header room to breathe. */}
        <div className="mt-8 flex flex-1 flex-col justify-end">{card.content}</div>
      </div>
    </motion.article>
  );
}

function BackgroundLayer({
  src,
  index,
  count,
  p,
}: {
  src: string;
  index: number;
  count: number;
  p: MotionValue<number>;
}) {
  // The first layer is always shown; each later one fades in over the same
  // scroll window its card uses to rise into view.
  const [inStart, inEnd] = index === 0 ? [-2, -1] : transitionWindow(index, count);
  const opacity = useTransform(p, [inStart, inEnd], [index === 0 ? 1 : 0, 1]);

  return (
    <motion.div
      className="absolute inset-0 bg-cover bg-center blur-2xl brightness-[.5] saturate-[.6]"
      style={{ backgroundImage: `url(${src})`, opacity }}
    />
  );
}

function ProgressPip({
  index,
  count,
  p,
}: {
  index: number;
  count: number;
  p: MotionValue<number>;
}) {
  const [, inEnd] = index === 0 ? [-2, -1] : transitionWindow(index, count);
  const [outStart] = index === count - 1 ? [2, 3] : transitionWindow(index + 1, count);
  const width = useTransform(p, [inEnd - 0.05, inEnd, outStart, outStart + 0.05], [8, 28, 28, 8]);
  const opacity = useTransform(p, [inEnd - 0.05, inEnd, outStart, outStart + 0.05], [0.35, 1, 1, 0.35]);

  return (
    <motion.span
      aria-hidden="true"
      className="block h-1.5 rounded-full bg-primary"
      style={{ width, opacity }}
    />
  );
}
