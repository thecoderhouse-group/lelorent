"use client";

import { useState } from "react";
import { useQueryStates } from "nuqs";
import { SlidersHorizontal } from "@phosphor-icons/react/ssr";

import { FilterPanel } from "@/components/filter-panel";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  filterParsers,
  SORT_LABELS,
  SORT_OPTIONS,
  type SortKey,
} from "@/lib/filters";
import type { City, Locality } from "@/lib/listings";

export function SearchToolbar({
  total,
  activeCount,
  cities,
  localities,
}: {
  total: number;
  activeCount: number;
  cities: City[];
  localities: Locality[];
}) {
  const [filters, setFilters] = useQueryStates(filterParsers, {
    shallow: false,
    history: "replace",
  });
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="flex items-center justify-between gap-3">
      <p
        className="text-sm text-muted-foreground"
        // The count changes without the user moving focus, so it has to be
        // announced rather than silently swapped.
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="tnum font-semibold text-foreground">{total}</span>{" "}
        {total === 1 ? "home" : "homes"}
      </p>

      <div className="flex items-center gap-2">
        {/* Mobile only. The count badge is the other half of the hidden-filter
            fix: even with the sheet shut, the trigger states how many filters
            are narrowing the results. */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          {/* Base UI's Trigger already renders a <button>, so it takes the
              classes directly. It has no asChild prop (that is a Radix API). */}
          <SheetTrigger className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden">
            <SlidersHorizontal size={15} aria-hidden="true" />
            Filters
            {activeCount > 0 && (
              <span className="tnum inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[0.6875rem] font-semibold leading-none text-primary-foreground">
                {activeCount}
              </span>
            )}
          </SheetTrigger>

          <SheetContent
            side="bottom"
            className="flex h-[85dvh] flex-col rounded-t-xl p-0"
          >
            <SheetHeader className="border-b border-hairline px-5 py-4 text-left">
              <SheetTitle className="text-base">Filters</SheetTitle>
              <SheetDescription className="text-xs">
                {total} {total === 1 ? "home" : "homes"} match right now
              </SheetDescription>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <FilterPanel cities={cities} localities={localities} />
            </div>

            <div className="border-t border-hairline p-4">
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="h-11 w-full rounded-md bg-primary text-sm font-semibold text-primary-foreground transition-transform active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:active:translate-y-0"
              >
                Show {total} {total === 1 ? "home" : "homes"}
              </button>
            </div>
          </SheetContent>
        </Sheet>

        <Select
          value={filters.sort}
          onValueChange={(v) => setFilters({ sort: v as SortKey, page: 1 })}
        >
          <SelectTrigger
            className="h-9 w-[9.5rem] text-sm"
            aria-label="Sort results"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {SORT_OPTIONS.map((key) => (
              <SelectItem key={key} value={key} className="text-sm">
                {SORT_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
