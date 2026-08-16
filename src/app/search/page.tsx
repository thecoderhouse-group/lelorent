import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { MagnifyingGlass } from "@phosphor-icons/react/ssr";

import { ActiveFilters } from "@/components/active-filters";
import { FilterPanel } from "@/components/filter-panel";
import { ListingCard, ListingCardSkeleton } from "@/components/listing-card";
import { SearchToolbar } from "@/components/search-toolbar";
import { SiteHeader } from "@/components/site-header";
import {
  describeActiveFilters,
  searchParamsCache,
  PAGE_SIZE,
  type Filters,
} from "@/lib/filters";
import { getCities, getLocalities, searchListings } from "@/lib/listings";

export const metadata: Metadata = {
  title: "Search flats",
  description:
    "Filter flats, PGs and shared rooms by rent, locality, food preference, pets and tenant type across six Indian metros.",
};

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-20 text-center">
      <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-secondary">
        <MagnifyingGlass size={20} className="text-muted-foreground" aria-hidden="true" />
      </div>
      <h2 className="text-base font-semibold">No homes match these filters</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        {hasFilters
          ? "Try widening the rent range or removing a filter chip above. Locality and property type narrow results the fastest."
          : "There are no published listings yet. Once owners start posting, they will show up here."}
      </p>
    </div>
  );
}

function Pagination({
  page,
  pageCount,
  makeHref,
}: {
  page: number;
  pageCount: number;
  makeHref: (page: number) => string;
}) {
  if (pageCount <= 1) return null;

  return (
    <nav
      aria-label="Search results pages"
      className="mt-10 flex items-center justify-center gap-2"
    >
      {page > 1 ? (
        <Link
          href={makeHref(page - 1)}
          rel="prev"
          className="rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Previous
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="rounded-md border border-hairline px-3 py-2 text-sm font-medium text-muted-foreground/50"
        >
          Previous
        </span>
      )}

      <span className="tnum px-3 text-sm text-muted-foreground">
        {page} / {pageCount}
      </span>

      {page < pageCount ? (
        <Link
          href={makeHref(page + 1)}
          rel="next"
          className="rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Next
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="rounded-md border border-hairline px-3 py-2 text-sm font-medium text-muted-foreground/50"
        >
          Next
        </span>
      )}
    </nav>
  );
}

async function Results({ filters }: { filters: Filters }) {
  const [{ listings, total, page, pageCount }, cities, localities] =
    await Promise.all([
      searchListings(filters),
      getCities(),
      getLocalities(filters.city),
    ]);

  const localityNames = Object.fromEntries(localities.map((l) => [l.slug, l.name]));
  const chips = describeActiveFilters(filters, new Map(Object.entries(localityNames)));

  function makeHref(page: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (key === "page") continue;
      if (Array.isArray(value)) {
        if (value.length) params.set(key, value.join(","));
      } else if (value !== "" && value !== false && value !== "recent") {
        params.set(key, String(value));
      }
    }
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `/search?${qs}` : "/search";
  }

  return (
    <div className="mx-auto flex w-full max-w-[1400px] gap-8 px-4 py-6 sm:px-6 lg:py-8">
      {/* Desktop sidebar. On mobile the same panel is rendered inside the
          sheet by SearchToolbar, so there is exactly one FilterPanel mounted
          at any width. */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto pb-8 pr-2">
          <FilterPanel cities={cities} localities={localities} />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-4">
          <SearchToolbar
            total={total}
            activeCount={chips.length}
            cities={cities}
            localities={localities}
          />
          <ActiveFilters localityNames={localityNames} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {listings.length === 0 ? (
            <EmptyState hasFilters={chips.length > 0} />
          ) : (
            listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))
          )}
        </div>

        {/* `page` comes from the query, not the URL: an out-of-range request
            is clamped server-side, so the control reflects what was served. */}
        <Pagination page={page} pageCount={pageCount} makeHref={makeHref} />
      </div>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[1400px] gap-8 px-4 py-6 sm:px-6 lg:py-8">
      <aside className="hidden w-64 shrink-0 lg:block" aria-hidden="true">
        <div className="flex flex-col gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2.5">
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="h-9 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const filters = (await searchParamsCache.parse(searchParams)) as Filters;

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <h1 className="sr-only">Search flats to rent</h1>
        {/* Keyed so switching filters re-suspends and shows the skeleton
            rather than holding the previous results in place. */}
        <Suspense key={JSON.stringify(filters)} fallback={<ResultsSkeleton />}>
          <Results filters={filters} />
        </Suspense>
      </main>
    </>
  );
}
