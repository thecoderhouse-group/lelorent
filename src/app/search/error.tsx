"use client";

import { useEffect } from "react";
import { WarningCircle } from "@phosphor-icons/react/ssr";

export default function SearchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Replace with the real reporter once Sentry lands in phase 6.
    console.error("Search failed:", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
      <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-secondary">
        <WarningCircle size={20} className="text-muted-foreground" aria-hidden="true" />
      </div>
      <h2 className="text-base font-semibold">Search could not load</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Something went wrong fetching listings. This is usually temporary.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:active:translate-y-0"
        >
          Try again
        </button>
        <a
          href="/search"
          className="h-10 rounded-md border border-border px-4 text-sm font-medium leading-10 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Reset filters
        </a>
      </div>
      {error.digest && (
        <p className="tnum mt-6 text-xs text-muted-foreground/70">
          Reference {error.digest}
        </p>
      )}
    </div>
  );
}
