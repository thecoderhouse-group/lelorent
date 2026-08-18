"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CaretDown, MagnifyingGlass, MapPin } from "@phosphor-icons/react/ssr";

import type { City } from "@/lib/listings";

/**
 * The hero's primary action: pick a city, optionally name an area, go.
 *
 * Written as a real GET form pointing at /search, then upgraded with
 * router.push. Field names match the filter parsers exactly, so with
 * JavaScript unavailable the browser's own submit still lands on a correctly
 * filtered results page — this is the front door, and it should never depend
 * on a hydrated bundle.
 *
 * The city control is a native <select> rather than the Base UI one used
 * elsewhere: on a phone it opens the OS picker, which is both faster and more
 * accessible than anything a custom listbox gets to be.
 */
export function HeroSearch({ cities }: { cities: City[] }) {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [query, setQuery] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (query.trim()) params.set("q", query.trim());

    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : "/search");
  }

  return (
    <form
      action="/search"
      method="get"
      onSubmit={handleSubmit}
      role="search"
      className="flex w-full flex-col gap-2 rounded-xl border border-border bg-card p-2 shadow-lift sm:flex-row sm:items-center"
    >
      <div className="relative flex-1 sm:max-w-52">
        <label htmlFor="hero-city" className="sr-only">
          City
        </label>
        <MapPin
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary"
        />
        <select
          id="hero-city"
          name="city"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          className="h-12 w-full appearance-none rounded-lg border border-input bg-background pl-10 pr-9 text-sm font-medium text-foreground focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <option value="">All cities</option>
          {cities.map((option) => (
            <option key={option.slug} value={option.slug}>
              {option.name}
            </option>
          ))}
        </select>
        <CaretDown
          size={13}
          weight="bold"
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
      </div>

      <div className="relative flex-1">
        <label htmlFor="hero-query" className="sr-only">
          Locality, area or landmark
        </label>
        <MagnifyingGlass
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          id="hero-query"
          name="q"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Locality, area or landmark"
          className="h-12 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&::-webkit-search-cancel-button]:hidden"
        />
      </div>

      <button
        type="submit"
        className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-transform hover:brightness-105 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card motion-reduce:active:translate-y-0"
      >
        <MagnifyingGlass size={16} weight="bold" aria-hidden="true" />
        Search homes
      </button>
    </form>
  );
}
