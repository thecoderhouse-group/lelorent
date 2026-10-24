import { ListingCardSkeleton } from "@/components/listing-card";
import { PAGE_SIZE } from "@/lib/filters";

/** Placeholder for the results grid only. */
export function ResultsGridSkeleton() {
  return (
    <div
      className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
      aria-hidden="true"
    >
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Filter sidebar + toolbar + grid: the whole results area. */
export function SearchResultsSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[1400px] gap-8 px-4 py-6 sm:px-6 lg:py-8">
      <span className="sr-only" role="status">
        Loading homes…
      </span>
      <aside className="hidden w-64 shrink-0 lg:block" aria-hidden="true">
        <div className="flex flex-col gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2.5">
              <div className="h-3 w-20 shimmer rounded" />
              <div className="h-4 w-full shimmer rounded" />
              <div className="h-4 w-4/5 shimmer rounded" />
            </div>
          ))}
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-4" aria-hidden="true">
          <div className="h-9 w-40 shimmer rounded-md" />
          <div className="h-9 w-32 shimmer rounded-md" />
        </div>
        <ResultsGridSkeleton />
      </div>
    </div>
  );
}

/** Breadcrumb, title and category tabs, for the route-level loading screen. */
export function SearchMastheadSkeleton() {
  return (
    <div className="border-b border-border bg-card/50" aria-hidden="true">
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-4 sm:px-6">
        <div className="h-3 w-40 shimmer rounded" />
        <div className="mt-4 h-7 w-72 max-w-full shimmer rounded" />
        <div className="mt-4 flex gap-2 pb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 w-20 shimmer rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}
