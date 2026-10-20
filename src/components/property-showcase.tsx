"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import {
  ArrowsOut,
  CaretLeft,
  CaretRight,
  ImageSquare,
  X,
} from "@phosphor-icons/react/ssr";

import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

/**
 * Photos arrive with their URLs already resolved on the server: only
 * serializable data crosses the Server/Client boundary.
 */
export type ShowcasePhoto = {
  id: string;
  cardUrl: string;
  fullUrl: string;
  blurDataUrl: string | null;
  width: number | null;
  height: number | null;
};

/** How much of the pinned photo stays uncovered before the sheet arrives. */
const SHEET_OVERLAP = "35svh";

/**
 * Listing page layout: a full-bleed photo carousel pinned under the header,
 * with the details sheet (children) scrolling up over it. As the sheet rises,
 * the photo blurs, dims and pushes in slightly, and the overlay (title, rent,
 * controls) fades out. All of it is tied to scroll position, so scrolling
 * back up reverses it.
 *
 * Carousel rules: native swipe (scroll-snap), explicit previous/next buttons,
 * arrow keys, no auto-rotation. Tapping a photo opens it full screen.
 */
export function PropertyShowcase({
  photos,
  alt,
  flatTypeLabel,
  overlay,
  topLeft,
  children,
}: {
  photos: ShowcasePhoto[];
  alt: string;
  flatTypeLabel: string;
  /** Title, chips and rent, laid over the bottom of the photo. */
  overlay: React.ReactNode;
  /** Small control in the top-left corner, e.g. a back link. */
  topLeft?: React.ReactNode;
  /** The details sheet. */
  children: React.ReactNode;
}) {
  const reduce = usePrefersReducedMotion();
  const count = photos.length;
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // ---- scroll-linked fade -------------------------------------------------
  // Progress 0 → 1 over the first ~55% of a screen of scrolling, which is
  // roughly when the sheet has covered the photo's visible area.
  const { scrollY } = useScroll();
  const progress = useTransform(scrollY, (y) =>
    y <= 0 || typeof window === "undefined"
      ? 0
      : Math.min(1, y / (window.innerHeight * 0.55)),
  );
  const blurLayer = useTransform(progress, [0, 1], [0, 1]);
  // Dim enough that text on the frosted sheet stays readable.
  const veil = useTransform(progress, [0, 1], [0, 0.55]);
  const scale = useTransform(progress, [0, 1], [1, reduce ? 1 : 1.08]);
  const uiOpacity = useTransform(progress, [0, 0.45], [1, 0]);
  const uiEvents = useTransform(uiOpacity, (v) => (v < 0.3 ? "none" : "auto"));

  // ---- carousel -----------------------------------------------------------
  const goTo = useCallback(
    (i: number) => {
      const track = trackRef.current;
      if (!track || count === 0) return;
      const next = (i + count) % count;
      track.scrollTo({
        left: next * track.clientWidth,
        behavior: reduce ? "auto" : "smooth",
      });
    },
    [count, reduce],
  );

  const onTrackScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  };

  // Arrow keys move the carousel (or the lightbox); Escape closes the lightbox.
  useEffect(() => {
    if (count < 2 && !lightbox) return;
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select")) return;
      if (e.key === "Escape" && lightbox) setLightbox(false);
      if (count < 2) return;
      if (e.key === "ArrowLeft") {
        if (lightbox) setIndex((i) => (i - 1 + count) % count);
        else goTo(index - 1);
      } else if (e.key === "ArrowRight") {
        if (lightbox) setIndex((i) => (i + 1) % count);
        else goTo(index + 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count, goTo, index, lightbox]);

  // Lock page scroll while the lightbox is open, and keep the carousel in
  // step with wherever the lightbox was left.
  useEffect(() => {
    if (!lightbox) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightbox]);

  function closeLightbox() {
    setLightbox(false);
    const track = trackRef.current;
    if (track) track.scrollTo({ left: index * track.clientWidth, behavior: "auto" });
  }

  const active = photos[Math.min(index, count - 1)];

  return (
    <div className="relative">
      {/* ------------------------------------------------- pinned stage --- */}
      <div className="dark sticky top-16 z-0 h-[calc(100svh-4rem)] overflow-hidden bg-black text-white">
        <motion.div className="absolute inset-0" style={{ scale }}>
          {count > 0 ? (
            <div
              ref={trackRef}
              onScroll={onTrackScroll}
              role="group"
              aria-roledescription="carousel"
              aria-label={`${count} photos`}
              className="flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {photos.map((photo, i) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => {
                    setIndex(i);
                    setLightbox(true);
                  }}
                  aria-label={`Open photo ${i + 1} of ${count} full screen`}
                  className="relative h-full w-full shrink-0 snap-center cursor-zoom-in focus-visible:outline-none"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- variants
                      are pre-sized at upload; next/image would re-optimise for nothing. */}
                  <img
                    src={photo.fullUrl}
                    alt={`${alt}, photo ${i + 1} of ${count}`}
                    width={photo.width ?? 1600}
                    height={photo.height ?? 1200}
                    loading={i === 0 ? "eager" : "lazy"}
                    fetchPriority={i === 0 ? "high" : "auto"}
                    decoding="async"
                    className="h-full w-full object-cover"
                    style={
                      photo.blurDataUrl
                        ? {
                            backgroundImage: `url(${photo.blurDataUrl})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }
                        : undefined
                    }
                  />
                </button>
              ))}
            </div>
          ) : (
            // No photos: a styled backdrop rather than an empty block.
            <div className="relative flex h-full items-center justify-center">
              <div
                aria-hidden="true"
                className="absolute inset-0 scale-110 bg-cover bg-center blur-xl brightness-[.45] saturate-[.6]"
                style={{ backgroundImage: "url(/hero/step-looking-for.webp?v=2)" }}
              />
              <div className="relative -mt-[20svh] flex flex-col items-center gap-2 text-center">
                <ImageSquare size={28} className="text-white/60" aria-hidden="true" />
                <span className="font-mono text-3xl font-medium tracking-tight text-white/90">
                  {flatTypeLabel}
                </span>
                <span className="sign-label text-white/60">Owner has not added photos</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Blurred copy of the current photo, faded in as the sheet rises.
            The blur is static (cheap); only its opacity animates. */}
        {active && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-10 bg-cover bg-center blur-2xl"
            style={{ backgroundImage: `url(${active.cardUrl})`, opacity: blurLayer }}
          />
        )}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-black"
          style={{ opacity: veil }}
        />

        {/* Legibility gradients for the overlay and the top-left control. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/55 to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[75%] bg-gradient-to-t from-black/90 via-black/45 to-transparent"
        />

        {/* ---------------------------------------- overlay + controls --- */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{ opacity: uiOpacity }}
        >
          {topLeft && (
            <motion.div
              className="absolute left-4 top-4 sm:left-6"
              style={{ pointerEvents: uiEvents }}
            >
              {topLeft}
            </motion.div>
          )}

          {count > 1 && (
            <motion.div style={{ pointerEvents: uiEvents }}>
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                aria-label="Previous photo"
                className="absolute left-3 top-[32%] inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:left-6"
              >
                <CaretLeft size={18} weight="bold" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                aria-label="Next photo"
                className="absolute right-3 top-[32%] inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:right-6"
              >
                <CaretRight size={18} weight="bold" aria-hidden="true" />
              </button>
            </motion.div>
          )}

          <div
            className="absolute inset-x-0 mx-auto w-full max-w-[1400px] px-4 sm:px-6"
            style={{ bottom: `calc(${SHEET_OVERLAP} + 1.5rem)` }}
          >
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="min-w-0 max-w-3xl [text-shadow:0_1px_14px_rgb(0_0_0/0.7)]">
                {overlay}
              </div>

              {count > 0 && (
                <motion.div
                  className="flex items-center gap-3"
                  style={{ pointerEvents: uiEvents }}
                >
                  {count > 1 && (
                    <div className="flex gap-1.5" aria-hidden="true">
                      {photos.map((photo, i) => (
                        <span
                          key={photo.id}
                          className={cn(
                            "h-1.5 rounded-full bg-white transition-all duration-300",
                            i === index ? "w-6 opacity-100" : "w-1.5 opacity-45",
                          )}
                        />
                      ))}
                    </div>
                  )}
                  <span className="tnum rounded-full bg-black/45 px-2.5 py-1 text-xs backdrop-blur">
                    {index + 1} / {count}
                  </span>
                  <button
                    type="button"
                    onClick={() => setLightbox(true)}
                    aria-label="View photos full screen"
                    className="inline-flex size-9 items-center justify-center rounded-full bg-black/45 backdrop-blur transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <ArrowsOut size={16} weight="bold" aria-hidden="true" />
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* --------------------------------------------------------- sheet --- */}
      <div className="relative z-10" style={{ marginTop: `-${SHEET_OVERLAP}` }}>
        {children}
      </div>

      {/* ------------------------------------------------------ lightbox --- */}
      {lightbox && active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${index + 1} of ${count}`}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4"
          onClick={closeLightbox}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={active.fullUrl}
            alt={`${alt}, photo ${index + 1} of ${count}`}
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            type="button"
            autoFocus
            onClick={closeLightbox}
            aria-label="Close"
            className="absolute right-4 top-4 inline-flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X size={18} weight="bold" aria-hidden="true" />
          </button>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex((i) => (i - 1 + count) % count);
                }}
                aria-label="Previous photo"
                className="absolute left-4 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <CaretLeft size={18} weight="bold" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex((i) => (i + 1) % count);
                }}
                aria-label="Next photo"
                className="absolute right-4 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <CaretRight size={18} weight="bold" aria-hidden="true" />
              </button>
              <p className="tnum absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white">
                {index + 1} / {count}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
