"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/**
 * The OS "reduce motion" setting, hydration-safe.
 *
 * motion's own useReducedMotion reads the media query during the first client
 * render, so anything derived from it can differ from the server HTML and
 * trigger a hydration mismatch. useSyncExternalStore renders with the server
 * snapshot (false) while hydrating, then re-renders with the real value.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
