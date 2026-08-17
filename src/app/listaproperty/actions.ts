"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  AMENITY_LABELS,
  FLAT_TYPE_LABELS,
  FOOD_PREF_LABELS,
  FURNISHING_LABELS,
  PARKING_LABELS,
  TENANT_PREF_LABELS,
} from "@/lib/format";
import type { Database } from "@/lib/supabase/types";

type Enums = Database["public"]["Enums"];

export type CreateDraftResult =
  | { ok: true; listingId: string }
  | { ok: false; error: string; field?: string };

export type PublishResult = { ok: true; listingId: string } | { ok: false; error: string };

function oneOf<T extends string>(
  value: FormDataEntryValue | null,
  valid: Record<string, unknown>,
): T | null {
  const v = typeof value === "string" ? value : "";
  return Object.hasOwn(valid, v) ? (v as T) : null;
}

function manyOf(values: FormDataEntryValue[], valid: Record<string, unknown>): string[] {
  return values
    .map((v) => String(v))
    .filter((v) => Object.hasOwn(valid, v));
}

function toInt(value: FormDataEntryValue | null): number | null {
  const n = Number.parseInt(String(value ?? "").replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Phase one of publishing: writes a DRAFT and returns its id.
 *
 * Photos cannot be uploaded before this exists, because the storage path is
 * `listings/{listing_id}/…` and the storage policy checks that the caller owns
 * that listing (0006_storage.sql). So the row has to come first, then bytes,
 * then the flip to PUBLISHED in `publishListing`.
 *
 * Everything is validated here regardless of what the client already checked.
 * The browser is not a trustworthy validator.
 */
export async function createDraftListing(
  formData: FormData,
): Promise<CreateDraftResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "You need to sign in first." };

  const title = String(formData.get("title") ?? "").trim();
  if (title.length < 10) {
    return { ok: false, error: "Give the listing a title of at least 10 characters.", field: "title" };
  }
  if (title.length > 120) {
    return { ok: false, error: "Keep the title under 120 characters.", field: "title" };
  }

  const flatType = oneOf<Enums["flat_type"]>(formData.get("flat_type"), FLAT_TYPE_LABELS);
  if (!flatType) return { ok: false, error: "Choose a property type.", field: "flat_type" };

  /**
   * listing_kind is only a real question for room types. The check constraint
   * in 0010 pins PG to PG_BED and FLAT to the whole-unit types, so for those
   * the answer is already determined. Only ROOM vs FLATMATE is genuinely new
   * information the poster has to supply.
   *
   * The value is derived here rather than left to derive_listing_kind, because
   * the column is NOT NULL with no default and so is required by the generated
   * Insert type. A column default cannot fix that: the trigger only fires when
   * the value is NULL, so a default would suppress derivation entirely and
   * then fail listing_kind_matches_flat_type. The trigger still guards every
   * other insert path (seeds, SQL editor); this just satisfies the contract.
   */
  const isRoom = flatType === "PRIVATE_ROOM" || flatType === "SHARED_ROOM";
  const rawKind = String(formData.get("listing_kind") ?? "");
  const listingKind: Enums["listing_kind"] = isRoom
    ? rawKind === "FLATMATE"
      ? "FLATMATE"
      : "ROOM"
    : flatType === "PG_BED"
      ? "PG"
      : "FLAT";

  const furnishing =
    oneOf<Enums["furnishing"]>(formData.get("furnishing"), FURNISHING_LABELS) ?? "UNFURNISHED";
  const foodPref =
    oneOf<Enums["food_pref"]>(formData.get("food_pref"), FOOD_PREF_LABELS) ?? "NO_PREFERENCE";
  const parking =
    oneOf<Enums["parking_type"]>(formData.get("parking"), PARKING_LABELS) ?? "NONE";

  const cityId = toInt(formData.get("city_id"));
  const localityId = toInt(formData.get("locality_id"));
  if (!cityId) return { ok: false, error: "Choose a city.", field: "city_id" };
  if (!localityId) return { ok: false, error: "Choose a locality.", field: "locality_id" };

  const rent = toInt(formData.get("rent"));
  if (!rent || rent <= 0) {
    return { ok: false, error: "Enter the monthly rent.", field: "rent" };
  }
  if (rent > 10_000_000) {
    return { ok: false, error: "That rent looks wrong. Check the amount.", field: "rent" };
  }

  const availableFrom = String(formData.get("available_from") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(availableFrom)) {
    return { ok: false, error: "Pick an availability date.", field: "available_from" };
  }

  const tenantPrefs = manyOf(formData.getAll("tenant_prefs"), TENANT_PREF_LABELS);
  const amenities = manyOf(formData.getAll("amenities"), AMENITY_LABELS);

  const { data, error } = await supabase
    .from("listings")
    .insert({
      owner_id: user.id,
      status: "DRAFT",
      title,
      description: String(formData.get("description") ?? "").trim() || null,
      flat_type: flatType,
      listing_kind: listingKind,
      furnishing,
      rent,
      deposit: toInt(formData.get("deposit")) ?? 0,
      maintenance: toInt(formData.get("maintenance")) ?? 0,
      maintenance_included: formData.get("maintenance_included") === "on",
      food_pref: foodPref,
      pets_allowed: formData.get("pets_allowed") === "on",
      smoking_allowed: formData.get("smoking_allowed") === "on",
      drinking_allowed: formData.get("drinking_allowed") === "on",
      couples_allowed: formData.get("couples_allowed") === "on",
      tenant_prefs: (tenantPrefs.length
        ? tenantPrefs
        : ["ANYONE"]) as Enums["tenant_pref"][],
      bedrooms: toInt(formData.get("bedrooms")),
      bathrooms: toInt(formData.get("bathrooms")),
      balconies: toInt(formData.get("balconies")),
      floor_number: toInt(formData.get("floor_number")),
      total_floors: toInt(formData.get("total_floors")),
      carpet_area_sqft: toInt(formData.get("carpet_area_sqft")),
      parking,
      amenities,
      city_id: cityId,
      locality_id: localityId,
      address_line: String(formData.get("address_line") ?? "").trim() || null,
      pincode: String(formData.get("pincode") ?? "").trim() || null,
      available_from: availableFrom,
      min_stay_months: toInt(formData.get("min_stay_months")),
    })
    .select("id")
    .single();

  if (error) {
    // The composite FK on (locality_id, city_id) rejects a locality that does
    // not belong to the chosen city, which is the one mismatch a user can
    // actually produce by changing city after picking a locality.
    if (error.code === "23503") {
      return { ok: false, error: "That locality is not in the selected city.", field: "locality_id" };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true, listingId: data.id };
}

/**
 * Phase two: records the uploaded photos and flips the listing live.
 *
 * The DB trigger caps photos at 4 and `position` is CHECKed to 0-3, so a
 * client that tries to register a fifth is rejected by the database rather
 * than by trust.
 */
export async function publishListing(
  listingId: string,
  photos: {
    cardPath: string;
    fullPath: string;
    blurDataUrl: string | null;
    width: number;
    height: number;
    bytes: number;
  }[],
): Promise<PublishResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You need to sign in first." };

  if (photos.length > 0) {
    const { error: photoError } = await supabase.from("listing_photos").insert(
      photos.slice(0, 4).map((p, i) => ({
        listing_id: listingId,
        card_path: p.cardPath,
        full_path: p.fullPath,
        blur_data_url: p.blurDataUrl,
        width: p.width,
        height: p.height,
        bytes: p.bytes,
        position: i,
      })),
    );

    if (photoError) {
      return { ok: false, error: `Could not save photos: ${photoError.message}` };
    }
  }

  // RLS restricts this to the owner's own rows, so a forged listingId here
  // updates nothing rather than someone else's listing.
  const { error } = await supabase
    .from("listings")
    .update({ status: "PUBLISHED" })
    .eq("id", listingId)
    .eq("owner_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/search");
  revalidatePath("/");

  return { ok: true, listingId };
}

/** Cleans up the draft if the user abandons the flow after photos failed. */
export async function discardDraft(listingId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("listings")
    .delete()
    .eq("id", listingId)
    .eq("owner_id", user.id)
    .eq("status", "DRAFT");
}
