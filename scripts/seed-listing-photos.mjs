#!/usr/bin/env node
/**
 * Attaches sample photos to the seed listings (supabase/seed.sql).
 *
 *   node scripts/seed-listing-photos.mjs
 *
 * Reads source images from supabase/seed-photos/<name>.png, builds the
 * same three variants the in-app uploader makes (src/lib/image-pipeline.ts):
 * a 640px card, a full image capped at 1600px, and a 20px blur placeholder,
 * all WebP. Uploads them to the `listing-photos` bucket under
 * listings/<listing_id>/ and writes the listing_photos rows.
 *
 * Needs SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) in .env.local:
 * storage and listing_photos are owner-only under RLS, and the seed owners
 * cannot sign in. The key is server-only; never prefix it NEXT_PUBLIC_.
 *
 * Idempotent: it replaces the photos of seed listings only (ids b0000000-…),
 * so it is safe to re-run after swapping an image.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC_DIR = "supabase/seed-photos";
const BUCKET = "listing-photos";

process.loadEnvFile(".env.local");
const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_BASE || !KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local",
  );
  process.exit(1);
}

// New-style secret keys go in `apikey` only; legacy service_role JWTs also
// go in Authorization.
const authHeaders = KEY.startsWith("eyJ")
  ? { apikey: KEY, Authorization: `Bearer ${KEY}` }
  : { apikey: KEY };

const id = (n) => `b0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

// Cover first (position 0), then up to three room shots. Picked to match
// each listing's type, furnishing and description in seed.sql.
const PLAN = {
  [id(1)]: ["2bhk-living", "kitchen", "bedroom", "balcony"],
  [id(2)]: ["1bhk-furnished", "bedroom", "kitchen", "bathroom"],
  [id(3)]: ["family-living", "kitchen", "bedroom", "balcony"],
  [id(4)]: ["pg-twin", "bathroom"],
  [id(5)]: ["studio-1rk", "bathroom"],
  [id(6)]: ["2bhk-living", "balcony", "bedroom", "kitchen"],
  [id(7)]: ["luxury-living", "bedroom", "kitchen", "bathroom"],
  [id(8)]: ["shared-room-women", "bathroom", "kitchen"],
  [id(9)]: ["2bhk-living", "balcony", "kitchen", "bedroom"],
  [id(10)]: ["family-living", "kitchen", "bathroom"],
  [id(11)]: ["private-room", "kitchen", "bathroom"],
  [id(12)]: ["2bhk-living", "bedroom", "balcony"],
  [id(13)]: ["1bhk-furnished", "bedroom", "kitchen"],
  [id(14)]: ["family-living", "kitchen", "bedroom", "balcony"],
  [id(15)]: ["studio-1rk", "bathroom"],
  [id(16)]: ["independent-house", "family-living", "kitchen", "bedroom"],
  [id(17)]: ["pg-twin", "bathroom"],
  [id(18)]: ["2bhk-living", "kitchen", "balcony", "bedroom"],
  [id(19)]: ["luxury-living", "bedroom", "bathroom", "balcony"],
  [id(20)]: ["family-living", "kitchen"],
  [id(21)]: ["2bhk-living", "kitchen", "bedroom"],
  [id(22)]: ["builder-floor", "2bhk-living", "kitchen", "bedroom"],
  [id(23)]: ["barsati-terrace", "studio-1rk", "bathroom"],
  [id(24)]: ["2bhk-living", "kitchen", "balcony"],
  [id(25)]: ["pg-twin", "bathroom"],
  [id(26)]: ["luxury-living", "balcony", "bedroom", "kitchen"],
  [id(27)]: ["1bhk-furnished", "kitchen", "balcony"],
  [id(28)]: ["builder-floor", "family-living", "kitchen", "bedroom"],
  // Flatmate listings
  [id(40)]: ["flatmate-living", "private-room", "kitchen"],
  [id(41)]: ["private-room", "flatmate-living", "kitchen"],
  [id(42)]: ["flatmate-living", "private-room", "balcony"],
  [id(43)]: ["pg-twin", "flatmate-living"],
  [id(44)]: ["private-room", "flatmate-living", "kitchen"],
};

/** Same settings as src/lib/image-pipeline.ts. */
async function processImage(name) {
  const file = path.join(SRC_DIR, `${name}.png`);
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);

  const fit = (max) =>
    sharp(file).resize(max, max, { fit: "inside", withoutEnlargement: true });

  const [card, full, tiny] = await Promise.all([
    fit(640).webp({ quality: 72 }).toBuffer(),
    fit(1600).webp({ quality: 80 }).toBuffer({ resolveWithObject: true }),
    fit(20).webp({ quality: 50 }).toBuffer(),
  ]);

  return {
    card,
    full: full.data,
    width: full.info.width,
    height: full.info.height,
    blurDataUrl: `data:image/webp;base64,${tiny.toString("base64")}`,
  };
}

async function upload(objectPath, body) {
  const res = await fetch(`${URL_BASE}/storage/v1/object/${BUCKET}/${objectPath}`, {
    method: "POST",
    headers: {
      ...authHeaders,
      "Content-Type": "image/webp",
      "Cache-Control": "max-age=31536000",
      "x-upsert": "true",
    },
    body,
  });
  if (!res.ok) throw new Error(`Upload ${objectPath}: ${res.status} ${await res.text()}`);
}

async function rest(method, query, body) {
  const res = await fetch(`${URL_BASE}/rest/v1/listing_photos${query}`, {
    method,
    headers: {
      ...authHeaders,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} listing_photos: ${res.status} ${await res.text()}`);
}

// ---------------------------------------------------------------------------

const names = [...new Set(Object.values(PLAN).flat())];
console.log(`Processing ${names.length} source images…`);
const processed = Object.fromEntries(
  await Promise.all(names.map(async (n) => [n, await processImage(n)])),
);

const listingIds = Object.keys(PLAN);
await rest("DELETE", `?listing_id=in.(${listingIds.join(",")})`);

let uploads = 0;
for (const [listingId, photoNames] of Object.entries(PLAN)) {
  const rows = [];
  for (const [position, name] of photoNames.entries()) {
    const img = processed[name];
    const base = `listings/${listingId}/seed-${name}`;
    const cardPath = `${base}-card.webp`;
    const fullPath = `${base}-full.webp`;

    await upload(cardPath, img.card);
    await upload(fullPath, img.full);
    uploads += 2;

    rows.push({
      listing_id: listingId,
      card_path: cardPath,
      full_path: fullPath,
      blur_data_url: img.blurDataUrl,
      width: img.width,
      height: img.height,
      bytes: img.full.length,
      position,
    });
  }
  await rest("POST", "", rows);
  process.stdout.write(".");
}

console.log(
  `\nDone: ${listingIds.length} listings, ${uploads} files uploaded.`,
);
