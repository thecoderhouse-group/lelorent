"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CaretLeft, CaretRight, ImageSquare } from "@phosphor-icons/react/ssr";

import { cn } from "@/lib/utils";

/**
 * Photos arrive with their URLs already resolved.
 *
 * The server cannot hand this component a `publicUrl(path)` helper: only
 * serializable data crosses the Server/Client boundary, and a function is not
 * serializable. Resolving on the server keeps the boundary clean.
 */
export type GalleryPhoto = {
  id: string;
  cardUrl: string;
  fullUrl: string;
  blurDataUrl: string | null;
  width: number | null;
  height: number | null;
};

/**
 * Listing gallery, max 4 photos.
 *
 * Accessibility follows the carousel rules for this product type: explicit
 * previous/next buttons rather than swipe-only, full keyboard control, and no
 * auto-rotation at all (so there is nothing to pause and nothing that moves
 * under a reduced-motion user).
 */
export function PhotoGallery({
  photos,
  flatTypeLabel,
  alt,
}: {
  photos: GalleryPhoto[];
  flatTypeLabel: string;
  alt: string;
}) {
  const [index, setIndex] = useState(0);
  const regionRef = useRef<HTMLDivElement>(null);

  const count = photos.length;

  const go = useCallback(
    (delta: number) => setIndex((i) => (i + delta + count) % count),
    [count],
  );

  useEffect(() => {
    if (count < 2) return;
    const node = regionRef.current;
    if (!node) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      }
    }

    node.addEventListener("keydown", onKey);
    return () => node.removeEventListener("keydown", onKey);
  }, [go, count]);

  if (count === 0) {
    return (
      <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-lg bg-plate">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--plate-muted) 1px, transparent 1px), linear-gradient(to bottom, var(--plate-muted) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
        <div className="relative flex flex-col items-center gap-2">
          <ImageSquare size={26} className="text-plate-muted" aria-hidden="true" />
          <span className="font-mono text-3xl font-medium tracking-tight text-plate-foreground/85">
            {flatTypeLabel}
          </span>
          <span className="sign-label text-plate-muted">
            Owner has not added photos
          </span>
        </div>
      </div>
    );
  }

  const active = photos[index];

  return (
    <div
      ref={regionRef}
      // Not aria-roledescription="carousel": nothing auto-rotates, so the
      // simpler group semantics describe it more honestly.
      role="group"
      aria-label={`${count} photos`}
      tabIndex={-1}
      className="flex flex-col gap-3"
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element -- variants are
            pre-sized at upload; next/image would re-optimise for nothing. */}
        <img
          key={active.id}
          src={active.fullUrl}
          alt={`${alt}, photo ${index + 1} of ${count}`}
          width={active.width ?? 1600}
          height={active.height ?? 1000}
          className="h-full w-full object-cover"
          decoding="async"
          // The first photo is the largest thing above the fold, so it loads
          // eagerly and gets fetch priority. The rest can wait.
          loading={index === 0 ? "eager" : "lazy"}
          fetchPriority={index === 0 ? "high" : "auto"}
          style={
            active.blurDataUrl
              ? {
                  backgroundImage: `url(${active.blurDataUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        />

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-plate/75 text-plate-foreground backdrop-blur transition-colors hover:bg-plate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <CaretLeft size={17} weight="bold" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-plate/75 text-plate-foreground backdrop-blur transition-colors hover:bg-plate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <CaretRight size={17} weight="bold" aria-hidden="true" />
            </button>
            <p className="tnum absolute bottom-3 right-3 rounded-full bg-plate/75 px-2.5 py-1 text-xs text-plate-foreground backdrop-blur">
              {index + 1}/{count}
            </p>
          </>
        )}
      </div>

      {count > 1 && (
        <ul className="grid grid-cols-4 gap-2">
          {photos.map((photo, i) => (
            <li key={photo.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "block w-full overflow-hidden rounded-md border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  i === index ? "border-primary" : "border-transparent hover:border-border",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.cardUrl}
                  alt=""
                  width={160}
                  height={120}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
