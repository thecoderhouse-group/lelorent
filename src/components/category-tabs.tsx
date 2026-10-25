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
import { motion } from "motion/react";
import { useSearchTransition } from "@/components/search-pending";

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
  const startTransition = useSearchTransition();
  const [filters, setFilters] = useQueryStates(filterParsers, {
    shallow: false,
    history: "replace",
    // Lets the results show a skeleton while the server re-renders.
    startTransition,
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
                  "group relative flex h-16 w-22 flex-col items-center justify-center gap-1.5 rounded-t-md px-2",
                  "transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                <Icon
                  size={22}
                  weight={isActive ? "fill" : "regular"}
                  aria-hidden="true"
                  className={cn(
                    "transition-[transform,color] duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-110 motion-reduce:group-hover:translate-y-0 motion-reduce:group-hover:scale-100",
                    isActive ? "text-primary" : "group-hover:text-primary",
                  )}
                />
                <span className="text-xs font-medium leading-none">
                  {category.label}
                </span>
                {/* Sits on the section's bottom rule, so the active tab reads
                    as connected to the results below it. */}
                {isActive ? (
                  // Shared layoutId: the underline slides to the new tab.
                  <motion.span
                    layoutId="category-tab-underline"
                    aria-hidden="true"
                    className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                ) : (
                  // Hover preview: a faint underline grows from the centre.
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-2 bottom-0 h-0.5 origin-center scale-x-0 rounded-full bg-primary/45 transition-transform duration-300 ease-out group-hover:scale-x-100"
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
