import { createClient } from "./supabase/server";
import { PAGE_SIZE, RENT_CEILING, RENT_FLOOR, type Filters } from "./filters";
import {
  AMENITY_LABELS,
  FLAT_TYPE_LABELS,
  FOOD_PREF_LABELS,
  FURNISHING_LABELS,
  TENANT_PREF_LABELS,
} from "./format";
import type { Database } from "./supabase/types";

/**
 * Drops values that are not keys of the supplied label map.
 *
 * The label maps are exhaustive Records over their enums, so their keys are
 * the authoritative set of valid values. Unknown values are discarded rather
 * than rejected, so `?type=2BHK,JUNK` still filters by 2BHK instead of
 * failing the whole request.
 */
function keepValid(values: string[], validKeys: Record<string, unknown>): string[] {
  return values.filter((v) => Object.hasOwn(validKeys, v));
}

/** Guards the date filter: a malformed date errors in Postgres, same as an enum. */
function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

type Enums = Database["public"]["Enums"];
type ListingsPublicRow = Database["public"]["Views"]["listings_public"]["Row"];

/**
 * Postgres reports every view column as nullable, because a view can in
 * principle produce NULL even from a NOT NULL column (an outer join, say).
 * The generated types inherit that pessimism.
 *
 * These specific columns are NOT NULL on public.listings and reach the view
 * through inner joins only, so they cannot actually be null. Narrowing them
 * here keeps every consumer from littering `?? ""` over guaranteed values.
 * Genuinely nullable fields (cover_card_path, carpet_area_sqft, owner_name)
 * are left alone.
 */
export type ListingCardData = Omit<
  ListingsPublicRow,
  | "id"
  | "title"
  | "rent"
  | "deposit"
  | "flat_type"
  | "furnishing"
  | "food_pref"
  | "pets_allowed"
  | "city"
  | "locality"
  | "city_slug"
  | "locality_slug"
  | "available_from"
  | "photo_count"
> & {
  id: string;
  title: string;
  rent: number;
  deposit: number;
  flat_type: Enums["flat_type"];
  furnishing: Enums["furnishing"];
  food_pref: Enums["food_pref"];
  pets_allowed: boolean;
  city: string;
  locality: string;
  city_slug: string;
  locality_slug: string;
  available_from: string;
  photo_count: number;
};

export type City = Pick<
  Database["public"]["Tables"]["cities"]["Row"],
  "id" | "slug" | "name" | "state"
>;

export type Locality = {
  id: number;
  slug: string;
  name: string;
};

const CARD_COLUMNS = [
  "id",
  "title",
  "rent",
  "deposit",
  "flat_type",
  "furnishing",
  "food_pref",
  "pets_allowed",
  "tenant_prefs",
  "bedrooms",
  "bathrooms",
  "carpet_area_sqft",
  "city",
  "locality",
  "city_slug",
  "locality_slug",
  "available_from",
  "photo_count",
  "cover_card_path",
  "cover_blur",
  "owner_name",
  "published_at",
].join(",");

export type SearchResult = {
  listings: ListingCardData[];
  total: number;
  /** The page actually served, which may be clamped below the one requested. */
  page: number;
  pageCount: number;
};

/**
 * Runs the search against listings_public.
 *
 * Reads go through the view rather than the listings table on purpose: the
 * view is the security boundary that strips address_line and owner phone, and
 * anon has no grant on the base table at all (0005_rls.sql).
 *
 * Every filter is conditional. An unset filter contributes no clause, so the
 * planner is free to pick the narrowest partial index rather than being forced
 * through a fixed composite.
 */
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Builds a fully-filtered query against listings_public.
 *
 * Separated out because a PostgREST builder is single-use — once awaited it
 * cannot be re-executed — and the page-clamping path below needs a second,
 * independent copy of the same filter set. No explicit return annotation:
 * every builder method returns the same type, so inference carries it.
 */
function buildListingQuery(
  supabase: SupabaseServerClient,
  filters: Filters,
  { head = false }: { head?: boolean } = {},
) {
  let query = supabase
    .from("listings_public")
    .select(CARD_COLUMNS, { count: "exact", head });

  if (filters.city) query = query.eq("city_slug", filters.city);
  if (filters.locality.length) query = query.in("locality_slug", filters.locality);

  // Enum and date values must be whitelisted before they reach Postgres.
  // Postgres REJECTS an unknown enum label with "invalid input value for enum"
  // rather than matching zero rows, so passing the raw query string through
  // turns any hand-edited URL into a 500. Same for a malformed date.
  const types = keepValid(filters.type, FLAT_TYPE_LABELS);
  const foods = keepValid(filters.food, FOOD_PREF_LABELS);
  const furnishings = keepValid(filters.furnishing, FURNISHING_LABELS);
  const tenants = keepValid(filters.tenant, TENANT_PREF_LABELS);
  const amenities = keepValid(filters.amenities, AMENITY_LABELS);

  if (types.length) query = query.in("flat_type", types as Enums["flat_type"][]);
  if (foods.length) query = query.in("food_pref", foods as Enums["food_pref"][]);
  if (furnishings.length) {
    query = query.in("furnishing", furnishings as Enums["furnishing"][]);
  }

  if (filters.rentMin > RENT_FLOOR) query = query.gte("rent", filters.rentMin);
  // At the ceiling the slider means "and above", so no upper bound is applied.
  if (filters.rentMax < RENT_CEILING) query = query.lte("rent", filters.rentMax);

  if (filters.pets) query = query.eq("pets_allowed", true);
  if (filters.photos) query = query.gt("photo_count", 0);
  if (isIsoDate(filters.availBy)) {
    query = query.lte("available_from", filters.availBy);
  }

  // GIN-backed. contains = "has ALL of", overlaps = "has ANY of".
  // Amenities are a hard requirement list; tenant preference is a match, so
  // a listing open to STUDENTS or ANYONE should surface for a student.
  if (amenities.length) query = query.contains("amenities", amenities);
  if (tenants.length) {
    query = query.overlaps("tenant_prefs", tenants as Enums["tenant_pref"][]);
  }

  if (filters.q.trim()) {
    query = query.textSearch("search_vector", filters.q.trim(), {
      type: "websearch",
      config: "english",
    });
  }

  switch (filters.sort) {
    case "rent_asc":
      query = query.order("rent", { ascending: true });
      break;
    case "rent_desc":
      query = query.order("rent", { ascending: false });
      break;
    case "area":
      query = query.order("carpet_area_sqft", {
        ascending: false,
        nullsFirst: false,
      });
      break;
    default:
      query = query.order("published_at", { ascending: false });
  }
  // Stable tiebreaker: without it, equal-rent rows can reorder between pages
  // and the same listing appears twice while another never shows.
  query = query.order("id", { ascending: true });

  return query;
}

export async function searchListings(filters: Filters): Promise<SearchResult> {
  const supabase = await createClient();
  const requestedPage = Math.max(1, filters.page);

  // PostgREST answers 416 Range Not Satisfiable when the range starts past the
  // end of the result set, so ?page=99999 would 500 the route. Resolve the real
  // count first and clamp — but only when the user is off page 1, so the
  // overwhelming majority of requests still cost a single round trip.
  let page = requestedPage;
  if (requestedPage > 1) {
    const { count, error } = await buildListingQuery(supabase, filters, {
      head: true,
    });
    if (error) {
      throw new Error(`Listing count failed: ${error.message}`);
    }
    const maxPage = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
    page = Math.min(requestedPage, maxPage);
  }

  const from = (page - 1) * PAGE_SIZE;

  const { data, error, count } = await buildListingQuery(supabase, filters)
    .range(from, from + PAGE_SIZE - 1)
    .overrideTypes<ListingCardData[]>();

  if (error) {
    throw new Error(`Listing search failed: ${error.message}`);
  }

  const total = count ?? 0;

  return {
    listings: data ?? [],
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getCities(): Promise<City[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cities")
    .select("id,slug,name,state")
    .eq("is_active", true)
    .order("name");

  if (error) throw new Error(`Could not load cities: ${error.message}`);
  return data ?? [];
}

/**
 * Localities for the picker. Scoped to a city because the full list across six
 * metros is far too long to render as checkboxes.
 */
export async function getLocalities(citySlug: string): Promise<Locality[]> {
  if (!citySlug) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("localities_for_city", {
    p_city_slug: citySlug,
  });

  if (error) throw new Error(`Could not load localities: ${error.message}`);
  return data ?? [];
}

/**
 * Public URL for a storage object. Bucket is public, so this is a plain
 * deterministic path with no round-trip and no signing.
 */
export function storageUrl(path: string | null): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/listing-photos/${path}`;
}
