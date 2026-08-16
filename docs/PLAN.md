# Lelorent — Flat Renting Platform: Build Plan

Two-sided listing site: **post a property** and **search properties by filters**.
Stack: **Next.js (App Router) full-stack on Vercel + Supabase (Postgres/Auth/Storage)**.
Media scope for v1: **up to 4 photos per listing, no video.**

---

## 1. Backend decision: no separate Node server

Your instinct is right. Next.js Route Handlers + Server Actions **are** the Node backend. A separate
Express service would mean a second deploy, second cold-start, CORS, and duplicated auth — with zero
benefit at this scale.

- Mutations (create/edit/delete listing) → **Server Actions**
- Search/read → **React Server Components** hitting Supabase directly (filters live in the URL)
- Cron, cleanup, webhooks → **Route Handlers** (`app/api/*`)
- Photo bytes → **browser uploads straight to Supabase Storage via signed URLs**, never through Vercel

---

## 2. Firebase vs Supabase — recommendation: **Supabase**

Three reasons, in order of how much they matter here.

### 2.1 Your app is a filter engine. Firestore is bad at filter engines.

You will filter on ~12 optional dimensions simultaneously (type, rent range, food pref, pets, tenant
type, furnishing, city, locality, amenities, availability date, deposit, gender). In Postgres this is
one `WHERE` clause. In Firestore:

| Need | Postgres | Firestore |
|---|---|---|
| Arbitrary combos of 12 optional filters | one query, planner picks index | needs a **composite index per filter combination** — combinatorial explosion |
| Two range filters (`rent BETWEEN` + `available_from >=`) | trivial | supported since 2024 but forces index intersection and scans |
| Multi-select amenities (`has all of [wifi, parking]`) | `text[] @> array[...]` + GIN index | one `array-contains-any` per query, max 30 values, can't combine two |
| Full-text on locality/title | built-in `tsvector` | not supported — bolt on Algolia/Typesense |
| Radius search ("within 3 km") | PostGIS `ST_DWithin` | geohash prefix hack, manual |
| Sort by rent, then filter | free | needs the sort field in every index |
| "142 results found" | `count(*)` | costs 1 read per counted doc |

This alone decides it.

### 2.2 Firebase Storage is no longer free for new projects

Cloud Storage for Firebase and Cloud Functions both require the **Blaze (pay-as-you-go) plan** on
projects created since late 2024. Photos are core to your product, so "Firebase free tier" doesn't
really exist for this app — you'd be attaching a credit card on day one.

### 2.3 Free-tier limits side by side

*Verify current numbers at the pricing pages before you commit — these move.*

| | Supabase Free | Firebase Spark |
|---|---|---|
| Database | 500 MB Postgres | 1 GiB Firestore |
| Reads | unlimited API requests | **50k doc reads/day** ← a search returning 20 cards = 20 reads |
| Writes | unlimited | 20k/day |
| File storage | 1 GB | **requires Blaze** |
| Egress | 5 GB/mo | 10 GiB/mo (Firestore) |
| Auth | 50k MAU | 50k MAU |
| Server functions | 500k edge fn invocations | **requires Blaze** |
| Gotcha | **project pauses after 7 days of inactivity**; 2 projects/org; no daily backups | storage/functions paywalled |

**Mitigation for the 7-day pause:** a daily Vercel Cron pinging a trivial query keeps the project warm.

**Escape hatch:** when you outgrow it, Supabase Pro is $25/mo → 8 GB DB, 100 GB storage, 250 GB egress.
Same code, no migration.

---

## 3. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15, App Router, TypeScript | RSC for search pages = filters render server-side, SEO-friendly |
| UI | Tailwind + shadcn/ui | filter sidebars/sheets/comboboxes are the bulk of the UI |
| DB/Auth/Storage | Supabase | §2 |
| Validation | Zod, shared between client form and Server Action | one schema, no drift |
| Forms | react-hook-form + zodResolver | multi-step post wizard |
| URL filter state | `nuqs` (or hand-rolled `searchParams`) | shareable/bookmarkable filtered URLs, back-button works |
| Image compression | `browser-image-compression` (+ `heic2any` fallback) | see §5 |
| Photo reorder | `dnd-kit` | drag to set cover photo |
| Rate limiting | Postgres table, or Upstash Redis free tier | abuse control on posting |
| Hosting | Vercel Hobby | 100 GB bandwidth, cron included |

**Auth:** Google OAuth + email magic link. **Avoid phone OTP** — Supabase phone auth proxies to
Twilio/MessageBird and costs real money per SMS. Collect phone as a profile field instead and verify
later only if you actually need it.

---

## 4. Data model

Denormalized-but-typed: enums for single-choice filters, `text[]` + GIN for multi-select. This keeps
search to a single indexed query with no joins.

```sql
-- Enums (single-choice filters)
create type flat_type as enum (
  '1RK','1BHK','2BHK','3BHK','4BHK','4BHK_PLUS',
  'PG_BED','SHARED_ROOM','PRIVATE_ROOM','INDEPENDENT_HOUSE'
);
create type food_pref as enum ('VEG_ONLY','EGGETARIAN','NON_VEG_ALLOWED','NO_PREFERENCE');
create type tenant_pref as enum ('FAMILY','BACHELOR_MALE','BACHELOR_FEMALE','STUDENTS','WORKING_PROFESSIONALS','ANYONE');
create type furnishing as enum ('UNFURNISHED','SEMI_FURNISHED','FULLY_FURNISHED');
create type parking_type as enum ('NONE','TWO_WHEELER','FOUR_WHEELER','BOTH');
create type listing_status as enum ('DRAFT','PUBLISHED','RENTED','EXPIRED','REMOVED');

create table profiles (
  id            uuid primary key references auth.users on delete cascade,
  full_name     text,
  phone         text,
  avatar_url    text,
  created_at    timestamptz default now()
);

create table listings (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references profiles(id) on delete cascade,
  status          listing_status not null default 'DRAFT',

  -- core
  title           text not null,
  description     text,
  flat_type       flat_type not null,
  furnishing      furnishing not null default 'UNFURNISHED',

  -- money (integers, whole rupees — pick one unit and never mix)
  rent            integer not null,
  deposit         integer not null default 0,
  maintenance     integer not null default 0,
  maintenance_included boolean not null default false,

  -- preferences  ← your "posting options" become "search filters" 1:1
  food_pref       food_pref not null default 'NO_PREFERENCE',
  pets_allowed    boolean not null default false,
  smoking_allowed boolean not null default false,
  drinking_allowed boolean not null default false,
  tenant_prefs    tenant_pref[] not null default '{ANYONE}',
  couples_allowed boolean not null default false,

  -- physical
  bedrooms        smallint,
  bathrooms       smallint,
  balconies       smallint,
  floor_number    smallint,
  total_floors    smallint,
  carpet_area_sqft integer,
  parking         parking_type not null default 'NONE',
  amenities       text[] not null default '{}',   -- lift, power_backup, wifi, gym, ...

  -- location
  city            text not null,
  locality        text not null,
  address_line    text,               -- never exposed publicly
  pincode         text,
  geo             geography(point,4326),

  -- availability
  available_from  date not null,
  min_stay_months smallint,

  -- housekeeping
  photo_count     smallint not null default 0,    -- denormalized, kept by trigger (§4.1)
  views_count     integer not null default 0,
  published_at    timestamptz,
  expires_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(locality,'') || ' ' || coalesce(city,''))
  ) stored,

  constraint rent_positive check (rent > 0),
  constraint sane_floors check (floor_number is null or total_floors is null or floor_number <= total_floors)
);

create table listing_photos (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid not null references listings(id) on delete cascade,
  card_path     text not null,          -- listings/{id}/{uuid}-card.webp   (640px)
  full_path     text not null,          -- listings/{id}/{uuid}-full.webp   (1600px)
  blur_data_url text,                   -- ~20px base64 LQIP, inlined into the card
  width         integer,                -- of the full variant
  height        integer,
  bytes         integer,
  position      smallint not null default 0,   -- 0 = cover photo
  created_at    timestamptz default now(),
  unique (listing_id, position)
);

create table saved_listings (
  user_id    uuid references profiles(id) on delete cascade,
  listing_id uuid references listings(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, listing_id)
);

create table listing_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete cascade,
  reporter_id uuid references profiles(id),
  reason text not null,
  created_at timestamptz default now()
);
```

> **Adding video later** is a small migration: add a `listing_videos` table (or a `kind` column here)
> plus a second storage prefix. Nothing in this schema blocks it.

### 4.1 The 4-photo cap, enforced in the database

Don't trust the UI for "max 4 photos":

```sql
create or replace function enforce_photo_limit() returns trigger language plpgsql as $$
declare n int;
begin
  select count(*) into n from listing_photos where listing_id = new.listing_id;
  if n >= 4 then raise exception 'max 4 photos per listing'; end if;
  return new;
end $$;

create trigger photo_limit before insert on listing_photos
  for each row execute function enforce_photo_limit();

-- keep listings.photo_count in sync so search results don't need a join
create or replace function sync_photo_count() returns trigger language plpgsql as $$
begin
  update listings set photo_count = (
    select count(*) from listing_photos
    where listing_id = coalesce(new.listing_id, old.listing_id)
  ) where id = coalesce(new.listing_id, old.listing_id);
  return null;
end $$;

create trigger photo_count_sync after insert or delete on listing_photos
  for each row execute function sync_photo_count();
```

### 4.2 Indexes

```sql
create index on listings using gin (amenities);
create index on listings using gin (tenant_prefs);
create index on listings using gin (search_vector);
create index on listings using gist (geo);
create index listings_browse_idx on listings (status, city, rent)      where status='PUBLISHED';
create index listings_recent_idx on listings (status, published_at desc) where status='PUBLISHED';
create index listings_avail_idx  on listings (status, available_from)   where status='PUBLISHED';
create index on listings (owner_id, status);
create index on listing_photos (listing_id, position);
```

Partial indexes on `status='PUBLISHED'` keep them small — draft/rented rows never bloat the index.

### 4.3 RLS (turn it on for every table)

- `listings`: anyone can `select` rows where `status='PUBLISHED'`; owner can select/insert/update/delete their own.
- `address_line` and owner contact must **not** be in the public-select path. Expose search results through a
  view (`listings_public`) with an explicit column list; reveal contact only via an authenticated RPC
  (which also logs the reveal).
- `listing_photos`: select allowed if the parent listing is visible; write only by the owner.
- Storage bucket policies mirror this — write path must start with `listings/{id}/` where the caller owns `{id}`.

---

## 5. Photo pipeline (max 4 per listing)

Principle: **compress in the browser, upload the compressed bytes directly to Supabase Storage via
signed URLs.** Originals never touch your server — zero Vercel function time, zero Vercel bandwidth,
and the free tier only ever stores the small version.

### 5.1 Three artifacts per photo

| Variant | Longest edge | Quality | Target | Used on |
|---|---|---|---|---|
| `card` | 640 px | 0.72 | ~30 KB | search results grid |
| `full` | 1600 px | 0.80 | ~180 KB | detail page / lightbox |
| `blur` | 20 px | 0.5 | ~400 B | inlined base64 LQIP, stored in the DB row not Storage |

```ts
import imageCompression from 'browser-image-compression';

const opts = { useWebWorker: true, fileType: 'image/webp' as const };
const card = await imageCompression(file, { ...opts, maxWidthOrHeight: 640,  initialQuality: 0.72 });
const full = await imageCompression(file, { ...opts, maxWidthOrHeight: 1600, initialQuality: 0.80 });
```

Upload with a long cache header. You already produced the exact display size, so `next/image`
re-optimization would only burn Vercel's transformation quota — render these with
`<Image unoptimized>` or a plain `<img>`:

```ts
await supabase.storage.from('listing-photos')
  .upload(path, blob, { contentType: 'image/webp', cacheControl: '31536000', upsert: true });
```

### 5.2 Four things that will actually bite you

1. **HEIC from iPhones.** Photos picked from the iOS Files app arrive as `.heic`, which Chrome and
   Firefox cannot decode to a canvas — compression silently fails. Detect the type and route through
   `heic2any` before compressing. (The iOS camera picker usually hands over JPEG, so this only shows up
   for a subset of users, which makes it easy to miss in testing.)
2. **EXIF GPS leaks the exact flat address.** `browser-image-compression` re-encodes via canvas, which
   drops EXIF — but verify it on a real geotagged photo, and never echo `address_line` from the public view.
3. **EXIF orientation.** Apply rotation *before* stripping metadata or portrait photos upload sideways.
   Pass `exifOrientation` / let the library handle it, then confirm with a phone photo.
4. **Validate server-side too.** Check `content-type` and byte length in the Server Action before
   inserting the `listing_photos` row. A signed upload URL is a write primitive — treat anything the
   client claims about the file as untrusted.

Reject inputs over ~25 MB before compressing, cap at 4 files per selection, and show per-file progress.

### 5.3 Upload flow (avoids orphaned files)

1. User completes step 1 of the wizard → Server Action inserts a `DRAFT` listing, returns `listing_id`.
2. Client compresses each photo into card + full + blur.
3. Client requests **signed upload URLs** for `listings/{listing_id}/...`.
4. Browser `PUT`s bytes straight to Supabase Storage, with a progress bar per file.
5. Server Action inserts `listing_photos` rows (trigger enforces the cap of 4).
6. User drags to reorder; `position = 0` is the cover photo shown on search cards.
7. Final step → `status='PUBLISHED'`, `published_at=now()`, `expires_at=now()+60 days`.

Daily Vercel Cron: delete `DRAFT` listings older than 24 h plus their storage objects, expire listings
past `expires_at`, and sweep storage objects with no matching `listing_photos` row. The same cron keeps
the Supabase project from auto-pausing.

---

## 6. Free-tier budget

**Per listing:** 4 × card (~30 KB) + 4 × full (~180 KB) ≈ **840 KB**

| Scenario | Listings that fit in 1 GB |
|---|---|
| 4 photos each | **~1,200** |
| 8 photos each (see §9.6) | ~600 |
| Average 2.5 photos (realistic) | ~1,900 |

Dropping video roughly **quadrupled** the listing capacity — it was ~270 listings with video, and the
storage cap is no longer the thing you'll hit first.

**Egress, 5 GB/month:**

| Page | Weight | Views before 5 GB |
|---|---|---|
| Search results, 12 cards | ~360 KB | ~14,000 |
| Detail page, 4 full photos | ~750 KB | ~6,900 |

Both are comfortable for launch. Levers if you approach the cap, cheapest first:

1. Lazy-load card images below the fold (`loading="lazy"`); the blur LQIP covers the gap
2. Paginate at 12–20 results with keyset pagination, not offset
3. Load the full-size photo only on lightbox open — show `card` upscaled behind the blur until then
4. Put a Cloudflare-proxied custom domain in front of the storage bucket
5. Supabase Pro at $25/mo → 250 GB egress

**Set up usage alerts in the Supabase dashboard from day one.** Hitting the storage cap silently fails
uploads.

---

## 7. Search implementation

Filters live in the URL: `/search?city=pune&type=2BHK,3BHK&rent_max=25000&food=VEG_ONLY&pets=1&amenities=lift,parking`

Parse → Zod → one Supabase query. Every filter is conditional; unset filters add no clause.

```ts
let q = supabase.from('listings_public')       // view: excludes address_line, owner contact
  .select('id,title,rent,flat_type,locality,city,food_pref,pets_allowed,available_from,cover_card_path,blur_data_url',
          { count: 'exact' })
  .eq('status', 'PUBLISHED');

if (f.city)        q = q.eq('city', f.city);
if (f.types)       q = q.in('flat_type', f.types);
if (f.rentMin)     q = q.gte('rent', f.rentMin);
if (f.rentMax)     q = q.lte('rent', f.rentMax);
if (f.food)        q = q.in('food_pref', f.food);
if (f.pets)        q = q.eq('pets_allowed', true);
if (f.furnishing)  q = q.in('furnishing', f.furnishing);
if (f.amenities)   q = q.contains('amenities', f.amenities);     // GIN, "has ALL of"
if (f.tenant)      q = q.overlaps('tenant_prefs', f.tenant);     // GIN, "has ANY of"
if (f.availBy)     q = q.lte('available_from', f.availBy);
if (f.withPhotos)  q = q.gt('photo_count', 0);
if (f.text)        q = q.textSearch('search_vector', f.text);

q = q.order(sortColumn, { ascending: sortAsc }).range(offset, offset + 19);
```

Build `listings_public` as a view that already joins in the cover photo (`position = 0`), so search
never needs a second round-trip for images.

Radius search ("within 3 km of X") needs PostGIS `ST_DWithin`, which PostgREST can't express — write
that one as a `search_listings(...)` SQL function and call it via `.rpc()`. Ship the flat version
first; add geo in Phase 6.

**Filter UX:** sidebar on desktop, bottom-sheet on mobile. Active filters as removable chips with a live
result count. Debounce the rent slider ~300 ms. Because state is in the URL, RSC re-renders handle it
with no client fetch layer.

---

## 8. Phased build

| Phase | Scope | Done when |
|---|---|---|
| **0. Foundation** | Next.js + TS + Tailwind + shadcn scaffold, Supabase project, env wiring, deploy an empty app to Vercel | CI green, prod URL live |
| **1. Auth** | Google OAuth + magic link, `profiles` row on signup, middleware-protected routes, header/avatar | can sign in on prod |
| **2. Schema** | All migrations, enums, indexes, RLS policies, photo triggers, `listings_public` view, storage bucket + policies, seed ~30 fake listings with photos | RLS verified: signed-out user cannot read `address_line` |
| **3. Search (read path first)** | `/search` with the full filter set, cards, pagination, sort, empty state, `/listing/[id]` detail with gallery + lightbox | every filter works against seed data |
| **4. Post a property** | Multi-step wizard, Zod schema shared with the Server Action, draft autosave, photo upload (compress → signed URL → reorder → cover), `/dashboard` to edit / mark rented / delete | can post a real listing with 4 photos from a phone |
| **5. Polish** | Saved listings, contact-reveal RPC behind login, report listing, share, SEO metadata + sitemap + JSON-LD `Offer`, OG images | Lighthouse ≥ 90 |
| **6. Hardening** | Rate limit posting (e.g. 5 listings/day/user), report queue + admin view, cron for drafts/expiry/orphans/keep-alive, Sentry, usage monitoring | abuse paths covered |
| *(later)* | Map + radius search, in-app messaging, video | — |

Two sequencing notes:

- **Ship Phase 3 against seed data before building Phase 4.** The search page is what tells you whether
  your filter set is actually right, and changing the schema is far cheaper before a form is bound to it.
- **Test the photo pipeline on a real phone during Phase 4, not at the end.** HEIC and EXIF orientation
  (§5.2) are invisible on a desktop dev machine.

---

## 9. Decisions to make before Phase 2

1. **Geography** — one city or many? Determines whether `city` is an enum, a lookup table, or free text,
   and whether you need locality autocomplete. (Plan assumes multi-city with a `cities`/`localities`
   lookup added in Phase 3.)
2. **Contact model** — reveal phone after login, or in-app messaging? Messaging is a whole extra
   subsystem (Supabase Realtime, notifications). **Recommend: gated phone reveal for v1.**
3. **Who posts** — owners only, or brokers too? Changes moderation and whether you need a "posted by"
   badge, which is one of the most-used filters on Indian rental sites.
4. **Listing lifetime** — the plan assumes 60-day auto-expiry with a renew prompt. Keeps the free tier
   from filling with stale listings.
5. **Monetization** — none in v1, but if featured listings are coming, add `is_featured boolean` +
   `featured_until timestamptz` in Phase 2 rather than migrating later.
6. **Is 4 photos enough?** Worth revisiting now that video is gone. Rental sites typically allow 8–10,
   and renters skip listings that don't show the bathroom and kitchen. At 8 photos you'd still fit ~600
   listings in the free tier. Keeping the cap at 4 as specified — flagging it because the constraint
   that motivated it no longer applies.

## 10. Known risks

| Risk | Mitigation |
|---|---|
| HEIC uploads silently fail on non-Safari browsers | `heic2any` fallback, tested with a real iPhone file (§5.2) |
| GPS EXIF leaking exact addresses | Strip client-side, verify on a geotagged photo, never return `address_line` publicly |
| Photos sideways from phone cameras | Handle EXIF orientation before re-encode; test in Phase 4 |
| Supabase project auto-pauses after 7 idle days | Daily keep-alive cron (also does draft/orphan cleanup) |
| Fake or spam listings | Rate limit, require verified email, report queue; phone-verify before publish if it gets bad |
| Orphaned storage objects from abandoned drafts | Nightly sweep of objects with no `listing_photos` row |
| Listings with no photos rank/convert poorly | Require ≥ 1 photo to publish, and offer a "has photos" filter |
