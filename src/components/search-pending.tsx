"use client";

import { createContext, useContext, useTransition, type TransitionStartFunction } from "react";

type SearchPending = {
  isPending: boolean;
  startTransition: TransitionStartFunction;
};

const SearchPendingContext = createContext<SearchPending | null>(null);

/**
 * Shares one transition across every control that changes the search URL
 * (filters, tabs, sort, chips, header search).
 *
 * Filter changes re-render the page on the server. Without a transition the
 * old results simply stay on screen until the new ones arrive, with no sign
 * that anything is happening. Passing this `startTransition` to nuqs makes
 * `isPending` true for the whole round trip, so the results can show a
 * skeleton instead.
 */
export function SearchPendingProvider({ children }: { children: React.ReactNode }) {
  const [isPending, startTransition] = useTransition();
  return (
    <SearchPendingContext value={{ isPending, startTransition }}>
      {children}
    </SearchPendingContext>
  );
}

/**
 * The shared `startTransition`, for nuqs's `startTransition` option.
 * Undefined outside the search page (e.g. the header search elsewhere), where
 * nuqs then behaves as before.
 */
export function useSearchTransition(): TransitionStartFunction | undefined {
  return useContext(SearchPendingContext)?.startTransition;
}

/** Shows `skeleton` in place of `children` while a search update is loading. */
export function PendingSwap({
  skeleton,
  children,
}: {
  skeleton: React.ReactNode;
  children: React.ReactNode;
}) {
  const pending = useContext(SearchPendingContext)?.isPending ?? false;
  return (
    <div aria-busy={pending}>
      {pending ? skeleton : children}
    </div>
  );
}
