import type { Database } from "./supabase/types";

type Enums = Database["public"]["Enums"];

/**
 * Rupees, Indian digit grouping (₹1,20,000 not ₹120,000).
 * Amounts are stored as whole-rupee integers, so no fraction digits ever.
 */
const rupeeFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatRupees(amount: number): string {
  return rupeeFormatter.format(amount);
}

/**
 * Compact form for filter chips and slider ends, where "₹1,20,000" is too
 * wide. Uses Indian units because "1.2L" is what the audience actually says,
 * not "120K".
 */
export function formatRupeesShort(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(1).replace(/\.0$/, "")}Cr`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1).replace(/\.0$/, "")}L`;
  if (amount >= 1_000) return `₹${Math.round(amount / 1_000)}k`;
  return `₹${amount}`;
}

export const FLAT_TYPE_LABELS: Record<Enums["flat_type"], string> = {
  "1RK": "1 RK",
  "1BHK": "1 BHK",
  "2BHK": "2 BHK",
  "3BHK": "3 BHK",
  "4BHK": "4 BHK",
  "4BHK_PLUS": "4+ BHK",
  PG_BED: "PG bed",
  SHARED_ROOM: "Shared room",
  PRIVATE_ROOM: "Private room",
  INDEPENDENT_HOUSE: "Independent house",
};

export const FOOD_PREF_LABELS: Record<Enums["food_pref"], string> = {
  VEG_ONLY: "Veg only",
  EGGETARIAN: "Eggetarian",
  NON_VEG_ALLOWED: "Non-veg allowed",
  NO_PREFERENCE: "No food rule",
};

export const FURNISHING_LABELS: Record<Enums["furnishing"], string> = {
  UNFURNISHED: "Unfurnished",
  SEMI_FURNISHED: "Semi furnished",
  FULLY_FURNISHED: "Fully furnished",
};

export const TENANT_PREF_LABELS: Record<Enums["tenant_pref"], string> = {
  FAMILY: "Families",
  BACHELOR_MALE: "Bachelor men",
  BACHELOR_FEMALE: "Bachelor women",
  STUDENTS: "Students",
  WORKING_PROFESSIONALS: "Working professionals",
  ANYONE: "Anyone",
};

export const PARKING_LABELS: Record<Enums["parking_type"], string> = {
  NONE: "No parking",
  TWO_WHEELER: "Two wheeler",
  FOUR_WHEELER: "Four wheeler",
  BOTH: "Two and four wheeler",
};

/** Mirrors the amenities_valid check constraint in 0001_init.sql. */
export const AMENITY_LABELS: Record<string, string> = {
  lift: "Lift",
  power_backup: "Power backup",
  wifi: "Wi-Fi",
  gym: "Gym",
  swimming_pool: "Swimming pool",
  security: "Security",
  cctv: "CCTV",
  water_supply_24x7: "24x7 water",
  gas_pipeline: "Piped gas",
  ac: "Air conditioning",
  geyser: "Geyser",
  washing_machine: "Washing machine",
  refrigerator: "Refrigerator",
  modular_kitchen: "Modular kitchen",
  wardrobe: "Wardrobe",
  tv: "TV",
  sofa: "Sofa",
  bed: "Bed",
  dining_table: "Dining table",
  balcony: "Balcony",
  park: "Park",
  play_area: "Play area",
  clubhouse: "Clubhouse",
  visitor_parking: "Visitor parking",
  housekeeping: "Housekeeping",
  rain_water_harvesting: "Rainwater harvesting",
  fire_safety: "Fire safety",
  intercom: "Intercom",
  servant_room: "Servant room",
  study_room: "Study room",
};

/** The subset surfaced as filters. The full list is too long for a sidebar. */
export const FILTERABLE_AMENITIES = [
  "lift",
  "power_backup",
  "wifi",
  "gym",
  "swimming_pool",
  "security",
  "water_supply_24x7",
  "ac",
  "washing_machine",
  "modular_kitchen",
  "balcony",
  "visitor_parking",
] as const;

/**
 * "Available now" vs "Available 12 Sep" — renters read availability as a
 * yes/no before they read it as a date.
 */
export function formatAvailability(availableFrom: string): string {
  const date = new Date(`${availableFrom}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date <= today) return "Available now";

  const days = Math.ceil((date.getTime() - today.getTime()) / 86_400_000);
  if (days <= 7) return `Available in ${days} day${days === 1 ? "" : "s"}`;

  return `Available ${date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  })}`;
}
