"use client";

import { useEffect, useState } from "react";
import { useQueryStates } from "nuqs";
import { MagnifyingGlass, X } from "@phosphor-icons/react/ssr";

import { filterParsers } from "@/lib/filters";
import { cn } from "@/lib/utils";
import { useSearchTransition } from "@/components/search-pending";

/**
 * Free-text search over title, locality and city (the search_vector column
 * added in migration 0008).
 *
 * Submits on Enter rather than per keystroke. Debounced live search would fire
 * a server round-trip mid-word and make the result count flicker while the
 * user is still typing a locality name.
 */
export function SearchInput({ className }: { className?: string }) {
  const startTransition = useSearchTransition();
  const [filters, setFilters] = useQueryStates(filterParsers, {
    shallow: false,
    history: "replace",
    // Lets the results show a skeleton while the server re-renders.
    startTransition,
  });
  const [draft, setDraft] = useState(filters.q);

  useEffect(() => setDraft(filters.q), [filters.q]);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        setFilters({ q: draft.trim(), page: 1 });
      }}
      className={cn("relative", className)}
    >
      <MagnifyingGlass
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Search locality, area or listing"
        aria-label="Search listings"
        className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&::-webkit-search-cancel-button]:hidden"
      />
      {draft && (
        <button
          type="button"
          onClick={() => {
            setDraft("");
            setFilters({ q: "", page: 1 });
          }}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X size={14} weight="bold" aria-hidden="true" />
        </button>
      )}
    </form>
  );
}
