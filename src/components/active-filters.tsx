"use client";

import { useQueryStates } from "nuqs";
import { X } from "@phosphor-icons/react/ssr";

import {
  CLEARED_FILTERS,
  describeActiveFilters,
  filterParsers,
  RENT_CEILING,
  RENT_FLOOR,
  type ActiveFilter,
  type Filters,
} from "@/lib/filters";
import { useSearchTransition } from "@/components/search-pending";

const ARRAY_KEYS = [
  "locality",
  "type",
  "food",
  "furnishing",
  "tenant",
  "amenities",
] as const satisfies readonly (keyof Filters)[];

type ArrayKey = (typeof ARRAY_KEYS)[number];

function isArrayKey(key: keyof Filters): key is ArrayKey {
  return (ARRAY_KEYS as readonly string[]).includes(key);
}

export function ActiveFilters({
  localityNames,
}: {
  /** slug -> display name, resolved server-side so chips read "Baner" not "baner" */
  localityNames: Record<string, string>;
}) {
  const startTransition = useSearchTransition();
  const [filters, setFilters] = useQueryStates(filterParsers, {
    shallow: false,
    history: "replace",
    // Lets the results show a skeleton while the server re-renders.
    startTransition,
  });

  const chips = describeActiveFilters(
    filters as Filters,
    new Map(Object.entries(localityNames)),
  );

  if (chips.length === 0) return null;

  function remove(chip: ActiveFilter) {
    // Any filter change invalidates the current page number: staying on page 3
    // of a result set that just shrank to 8 rows shows an empty grid.
    if (isArrayKey(chip.key) && chip.value) {
      const next = (filters[chip.key] as string[]).filter((v) => v !== chip.value);
      setFilters({ [chip.key]: next, page: 1 });
      return;
    }

    if (chip.key === "rentMin") {
      setFilters({ rentMin: RENT_FLOOR, rentMax: RENT_CEILING, page: 1 });
      return;
    }

    if (chip.key === "q") return setFilters({ q: "", page: 1 });
    if (chip.key === "pets") return setFilters({ pets: false, page: 1 });
    if (chip.key === "photos") return setFilters({ photos: false, page: 1 });
    if (chip.key === "availBy") return setFilters({ availBy: "", page: 1 });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="sign-label text-muted-foreground">Filtering by</span>

      <ul className="flex flex-wrap items-center gap-2">
        {chips.map((chip) => (
          <li key={`${chip.key}:${chip.value ?? ""}`}>
            <button
              type="button"
              onClick={() => remove(chip)}
              className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-accent py-1 pl-3 pr-2 text-xs font-medium text-accent-foreground transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md motion-reduce:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {chip.label}
              <X
                size={12}
                weight="bold"
                aria-hidden="true"
                className="opacity-60 transition-opacity group-hover:opacity-100"
              />
              <span className="sr-only">Remove filter</span>
            </button>
          </li>
        ))}
      </ul>

      {chips.length > 1 && (
        <button
          type="button"
          onClick={() => setFilters(CLEARED_FILTERS)}
          className="rounded-sm px-1 text-xs font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
