import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { MagnifyingGlass } from "@phosphor-icons/react/ssr";

import { ActiveFilters } from "@/components/active-filters";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CategoryTabs } from "@/components/category-tabs";
import { FilterPanel } from "@/components/filter-panel";
import { Reveal } from "@/components/home/reveal";
import { ListingCard } from "@/components/listing-card";
import { PendingSwap, SearchPendingProvider } from "@/components/search-pending";
import { ResultsGridSkeleton, SearchResultsSkeleton } from "@/components/search-skeleton";
import { SearchToolbar } from "@/components/search-toolbar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  describeActiveFilters,
  searchParamsCache,
  type Filters,
} from "@/lib/filters";
import {
  getCities,
  getLocalities,
  searchListings,
  type City,
} from "@/lib/listings";

const DEFAULT_DESCRIPTION =
  "Filter flats, PGs and shared rooms by rent, locality, food preference, pets and tenant type across six Indian metros.";

/**
 * The city page is the shareable artefact of this route, so its title and
 * description name the city rather than describing the search tool. getCities
 * is memoised per request, so this costs nothing beyond the query the page
 * already runs.
 */
export async function generateMetadata({
  searchParams,
}: PageProps<"/search">): Promise<Metadata> {
  const params = await searchParams;
  const citySlug = typeof params.city === "string" ? params.city : "";

  if (citySlug) {
    const city = (await getCities()).find((c) => c.slug === citySlug);
    if (city) {
      return {
        title: `Flats for rent in ${city.name}`,
        description: `Flats, PGs and shared rooms to rent in ${city.name}, ${city.state}. Listed by owners, filterable by rent, locality, furnishing and food preference.`,
      };
    }
  }

  return { title: "Search flats", description: DEFAULT_DESCRIPTION };
}

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

        {/* While a filter change is loading, the grid shows a shimmer
            skeleton instead of the stale results. */}
        <PendingSwap skeleton={<ResultsGridSkeleton />}>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {listings.length === 0 ? (
            <EmptyState hasFilters={chips.length > 0} />
          ) : (
            // Results remount whenever the filters change (the Suspense
            // boundary below is keyed), so the entrance replays per search.
            listings.map((listing, index) => (
              <Reveal key={listing.id} index={index} once className="h-full">
                <ListingCard listing={listing} />
              </Reveal>
            ))
          )}
        </div>

        {/* `page` comes from the query, not the URL: an out-of-range request
            is clamped server-side, so the control reflects what was served. */}
        <Pagination page={page} pageCount={pageCount} makeHref={makeHref} />
        </PendingSwap>
      </div>
    </div>
  );
}

/**
 * Breadcrumb, page title and category tabs.
 *
 * Rendered outside the results Suspense boundary on purpose: none of it
 * depends on the search query, so the chrome that tells the user where they
 * are should not blink out and back every time a filter changes.
 */
function SearchMasthead({ city }: { city: City | null }) {
  return (
    <div className="border-b border-border bg-card/50">
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-4 sm:px-6">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Property", href: "/search" },
            ...(city ? [{ label: city.name }] : []),
          ]}
        />

        <h1 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
          {city ? (
            <>
              Homes to rent in {city.name}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {city.state}
              </span>
            </>
          ) : (
            "Homes to rent across India"
          )}
        </h1>

        <div className="mt-3">
          <CategoryTabs />
        </div>
      </div>
    </div>
  );
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const filters = (await searchParamsCache.parse(searchParams)) as Filters;

  // Resolved here rather than inside Results so the masthead can name the city
  // in the static part of the page. Memoised, so Results reuses this result.
  const cities = await getCities();
  const city = cities.find((c) => c.slug === filters.city) ?? null;

  return (
    <SearchPendingProvider>
      <SiteHeader />
      <main className="flex-1">
        <SearchMasthead city={city} />
        {/* Keyed so switching filters re-suspends and shows the skeleton
            rather than holding the previous results in place. */}
        <Suspense key={JSON.stringify(filters)} fallback={<SearchResultsSkeleton />}>
          <Results filters={filters} />
        </Suspense>
      </main>
      <SiteFooter />
    </SearchPendingProvider>
  );
}
