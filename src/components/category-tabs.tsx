"use client";

import { useQueryStates } from "nuqs";
import {
  Bed,
  Buildings,
  SquaresFour,
  UserCirclePlus,
  UsersThree,
} from "@phosphor-icons/react/ssr";

import { CATEGORIES, categoryFromKind, type CategoryKey } from "@/lib/categories";
import { filterParsers } from "@/lib/filters";
import { cn } from "@/lib/utils";

const ICONS = {
  all: SquaresFour,
  flats: Buildings,
  rooms: Bed,
  flatmates: UserCirclePlus,
  pg: UsersThree,
} satisfies Record<CategoryKey, typeof SquaresFour>;

/**
 * The coarse cut across the results — the control most people use before they
 * open the filter panel at all.
 *
 * Buttons with aria-pressed rather than a real tablist: these do not swap
 * panels, they rewrite the `kind` query param and re-run the same server
 * search, so tab semantics would promise keyboard behaviour (arrow-key
 * roving, a linked tabpanel) that does not exist here.
 */
export function CategoryTabs() {
  const [filters, setFilters] = useQueryStates(filterParsers, {
    shallow: false,
    history: "replace",
  });

  const active = categoryFromKind(filters.kind);

  return (
    <nav
      aria-label="Property category"
      // Bleeds to the viewport edge on phones so the row scrolls without a
      // cut-off gutter, and the last tab is visibly reachable.
      className="-mx-4 scrollbar-none overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      <ul className="flex min-w-max items-stretch gap-0.5 sm:gap-1">
        {CATEGORIES.map((category) => {
          const Icon = ICONS[category.key];
          const isActive = active === category.key;

          return (
            <li key={category.key}>
              <button
                type="button"
                aria-pressed={isActive}
                onClick={() =>
                  // Changing tab clears the flat_type checkboxes: they are
                  // scoped to the kind you were on, so carrying "2BHK" into
                  // the Flatmates tab would guarantee zero results.
                  setFilters({ kind: category.kind, type: [], page: 1 })
                }
                className={cn(
                  "relative flex h-16 w-22 flex-col items-center justify-center gap-1.5 rounded-t-md px-2",
                  "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                <Icon
                  size={22}
                  weight={isActive ? "fill" : "regular"}
                  aria-hidden="true"
                />
                <span className="text-xs font-medium leading-none">
                  {category.label}
                </span>
                {/* Sits on the section's bottom rule, so the active tab reads
                    as connected to the results below it. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-2 bottom-0 h-0.5 rounded-full transition-colors",
                    isActive ? "bg-primary" : "bg-transparent",
                  )}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
