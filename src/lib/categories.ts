import type { Database } from "./supabase/types";

export type ListingKind = Database["public"]["Enums"]["listing_kind"];

/** Guard for the `kind` query param before it reaches Postgres. */
export const LISTING_KINDS: readonly ListingKind[] = [
  "FLAT",
  "ROOM",
  "FLATMATE",
  "PG",
];

export const CATEGORY_KEYS = ["all", "flats", "rooms", "flatmates", "pg"] as const;
export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export type Category = {
  key: CategoryKey;
  label: string;
  /** Longer form for the landing page cards, where there is room for it. */
  blurb: string;
  /**
   * The listing_kind this category selects, or "" for no kind filter.
   *
   * Categories map to listing_kind rather than to sets of flat_type because
   * Rooms and Flatmates are the *same* flat types — a private room is a
   * private room whether a landlord is letting it or a resident is sharing it.
   * Only the kind column separates them, which is why 0010 added it.
   */
  kind: "" | ListingKind;
};

export const CATEGORIES: Category[] = [
  {
    key: "all",
    label: "All listings",
    blurb: "Everything currently on the market, newest first.",
    kind: "",
  },
  {
    key: "flats",
    label: "Flats",
    blurb: "A whole place to yourself — 1 RK through 4+ BHK and independent houses.",
    kind: "FLAT",
  },
  {
    key: "rooms",
    label: "Rooms",
    blurb: "A private or shared room let out to you, with its own tenancy.",
    kind: "ROOM",
  },
  {
    key: "flatmates",
    label: "Flatmates",
    blurb:
      "Someone already living there wants to share. You are joining a household, not signing for a unit.",
    kind: "FLATMATE",
  },
  {
    key: "pg",
    label: "PG",
    blurb: "Paying-guest beds with meals, housekeeping and bills usually bundled.",
    kind: "PG",
  },
];

/**
 * The tab a `kind` param selects. Unlike the flat_type sets this replaced,
 * every value maps to exactly one tab, so an unrecognised kind falls back to
 * "All" — which is also what the server does with it, since the value is
 * whitelisted away before it reaches the query.
 */
export function categoryFromKind(kind: string): CategoryKey {
  return CATEGORIES.find((category) => category.kind === kind)?.key ?? "all";
}

/** Href for a category outside the client filter context (landing, footer). */
export function categoryHref(category: Category, citySlug?: string): string {
  const params = new URLSearchParams();
  if (citySlug) params.set("city", citySlug);
  if (category.kind) params.set("kind", category.kind);

  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}
