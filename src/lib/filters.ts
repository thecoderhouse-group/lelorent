import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

import {
  AMENITY_LABELS,
  FLAT_TYPE_LABELS,
  FOOD_PREF_LABELS,
  FURNISHING_LABELS,
  TENANT_PREF_LABELS,
  formatRupeesShort,
} from "./format";

export const RENT_FLOOR = 0;
export const RENT_CEILING = 100_000;
export const PAGE_SIZE = 12;

export const SORT_OPTIONS = ["recent", "rent_asc", "rent_desc", "area"] as const;
export type SortKey = (typeof SORT_OPTIONS)[number];

export const SORT_LABELS: Record<SortKey, string> = {
  recent: "Newest first",
  rent_asc: "Rent: low to high",
  rent_desc: "Rent: high to low",
  area: "Largest first",
};

/**
 * Single source of truth for the filter state.
 *
 * The same parser object drives BOTH the server (via searchParamsCache, used
 * by the RSC that runs the query) and the client (via useQueryStates in the
 * filter panel). Defining it once is what stops the URL contract from drifting
 * between the thing that writes it and the thing that reads it.
 *
 * Every parser carries a default so nuqs strips it from the URL when unset —
 * which keeps shared links short and makes "is this filter active?" a simple
 * inequality rather than a special case.
 */
export const filterParsers = {
  q: parseAsString.withDefault(""),
  city: parseAsString.withDefault(""),
  /**
   * The category tab (listings.listing_kind). Single-valued, and kept separate
   * from `type`: `kind` is the coarse cut the tabs make, `type` is the
   * flat_type checkbox list in the sidebar. They compose — "Flatmates, but
   * only private rooms" is a sentence the URL can express.
   */
  kind: parseAsString.withDefault(""),
  locality: parseAsArrayOf(parseAsString).withDefault([]),
  type: parseAsArrayOf(parseAsString).withDefault([]),
  rentMin: parseAsInteger.withDefault(RENT_FLOOR),
  rentMax: parseAsInteger.withDefault(RENT_CEILING),
  food: parseAsArrayOf(parseAsString).withDefault([]),
  furnishing: parseAsArrayOf(parseAsString).withDefault([]),
  tenant: parseAsArrayOf(parseAsString).withDefault([]),
  amenities: parseAsArrayOf(parseAsString).withDefault([]),
  pets: parseAsBoolean.withDefault(false),
  photos: parseAsBoolean.withDefault(false),
  availBy: parseAsString.withDefault(""),
  sort: parseAsStringLiteral(SORT_OPTIONS).withDefault("recent"),
  page: parseAsInteger.withDefault(1),
};

export const searchParamsCache = createSearchParamsCache(filterParsers);

export type Filters = {
  [K in keyof typeof filterParsers]: ReturnType<
    (typeof filterParsers)[K]["parseServerSide"]
  >;
};

/**
 * One active filter, flattened for the removable-chip row.
 *
 * The chip row exists because "hidden filters" is a known failure mode for
 * marketplace UI: on mobile the panel lives in a sheet, and without this row
 * the user cannot see what is narrowing their results while the sheet is shut.
 */
export type ActiveFilter = {
  /** key + value identifies exactly which chip to clear */
  key: keyof Filters;
  value?: string;
  label: string;
};

export function describeActiveFilters(
  filters: Filters,
  localityNames?: Map<string, string>,
): ActiveFilter[] {
  const chips: ActiveFilter[] = [];

  if (filters.q) chips.push({ key: "q", label: `"${filters.q}"` });

  for (const slug of filters.locality) {
    chips.push({
      key: "locality",
      value: slug,
      label: localityNames?.get(slug) ?? slug,
    });
  }

  for (const t of filters.type) {
    chips.push({ key: "type", value: t, label: FLAT_TYPE_LABELS[t as never] ?? t });
  }

  // Rent reads as one range, not two independent bounds.
  if (filters.rentMin > RENT_FLOOR || filters.rentMax < RENT_CEILING) {
    const lo = formatRupeesShort(filters.rentMin);
    const hi =
      filters.rentMax >= RENT_CEILING
        ? `${formatRupeesShort(RENT_CEILING)}+`
        : formatRupeesShort(filters.rentMax);
    chips.push({ key: "rentMin", label: `${lo} to ${hi}` });
  }

  for (const f of filters.food) {
    chips.push({ key: "food", value: f, label: FOOD_PREF_LABELS[f as never] ?? f });
  }
  for (const f of filters.furnishing) {
    chips.push({ key: "furnishing", value: f, label: FURNISHING_LABELS[f as never] ?? f });
  }
  for (const t of filters.tenant) {
    chips.push({ key: "tenant", value: t, label: TENANT_PREF_LABELS[t as never] ?? t });
  }
  for (const a of filters.amenities) {
    chips.push({ key: "amenities", value: a, label: AMENITY_LABELS[a] ?? a });
  }

  if (filters.pets) chips.push({ key: "pets", label: "Pets allowed" });
  if (filters.photos) chips.push({ key: "photos", label: "Has photos" });

  if (filters.availBy) {
    chips.push({
      key: "availBy",
      label: `By ${new Date(`${filters.availBy}T00:00:00`).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      })}`,
    });
  }

  return chips;
}

/**
 * Values that reset the whole panel. Sort is a view preference, not a filter,
 * so it survives a reset. City survives too: clearing it would dump the user
 * from "Pune" back to all six metros, which reads as a bug rather than a reset.
 * `kind` survives for the same reason — it is the tab the user is standing on,
 * and the panel's reset button is not how anyone expects to leave a tab.
 *
 * Deliberately not `as const` — that would make the arrays `readonly []`, which
 * nuqs's setter will not accept.
 */
export const CLEARED_FILTERS = {
  q: "",
  locality: [] as string[],
  type: [] as string[],
  rentMin: RENT_FLOOR,
  rentMax: RENT_CEILING,
  food: [] as string[],
  furnishing: [] as string[],
  tenant: [] as string[],
  amenities: [] as string[],
  pets: false,
  photos: false,
  availBy: "",
  page: 1,
};
