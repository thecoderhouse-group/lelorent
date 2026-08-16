-- =============================================================================
-- 0001_init.sql — extensions, enums, lookup tables, core tables
-- Lelorent: flat renting platform
--
-- Design notes
--   * Every single-choice search filter is a Postgres enum.
--   * Every multi-choice filter is an array with a GIN index (see 0002).
--   * listings carries denormalized city/locality TEXT alongside the FKs, so
--     search never joins and so search_vector (a generated column, which cannot
--     reference other tables) can index them. Kept in sync by trigger in 0003.
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.flat_type as enum (
  '1RK','1BHK','2BHK','3BHK','4BHK','4BHK_PLUS',
  'PG_BED','SHARED_ROOM','PRIVATE_ROOM','INDEPENDENT_HOUSE'
);

create type public.food_pref as enum (
  'VEG_ONLY','EGGETARIAN','NON_VEG_ALLOWED','NO_PREFERENCE'
);

create type public.tenant_pref as enum (
  'FAMILY','BACHELOR_MALE','BACHELOR_FEMALE','STUDENTS','WORKING_PROFESSIONALS','ANYONE'
);

create type public.furnishing as enum (
  'UNFURNISHED','SEMI_FURNISHED','FULLY_FURNISHED'
);

create type public.parking_type as enum (
  'NONE','TWO_WHEELER','FOUR_WHEELER','BOTH'
);

create type public.listing_status as enum (
  'DRAFT','PUBLISHED','RENTED','EXPIRED','REMOVED'
);

-- -----------------------------------------------------------------------------
-- Location lookups
-- Canonical city/locality so filtering never fragments across "Baner",
-- "baner" and "Baner West". Slugs are the URL segments: /pune/baner
-- -----------------------------------------------------------------------------
create table public.cities (
  id          smallint generated always as identity primary key,
  slug        text not null unique,
  name        text not null,
  state       text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),

  constraint city_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create table public.localities (
  id          integer generated always as identity primary key,
  city_id     smallint not null references public.cities(id) on delete cascade,
  slug        text not null,
  name        text not null,
  pincode     text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),

  constraint locality_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  unique (city_id, slug)
);

-- Needed so listings can FK the (id, city_id) pair and guarantee at the schema
-- level that a listing's locality actually belongs to its city.
alter table public.localities add constraint localities_id_city_key unique (id, city_id);

-- -----------------------------------------------------------------------------
-- profiles — one row per auth user, created automatically by trigger (0003)
-- phone is PRIVATE: never exposed by listings_public, only by reveal_contact()
-- -----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  full_name   text,
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint phone_format check (phone is null or phone ~ '^\+?[0-9]{10,15}$')
);

comment on column public.profiles.phone is
  'PRIVATE. Never select into a public view. Reveal only via public.reveal_contact().';

-- -----------------------------------------------------------------------------
-- listings
-- -----------------------------------------------------------------------------
create table public.listings (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references public.profiles(id) on delete cascade,
  status          public.listing_status not null default 'DRAFT',

  -- core
  title           text not null,
  description     text,
  flat_type       public.flat_type not null,
  furnishing      public.furnishing not null default 'UNFURNISHED',

  -- money: whole rupees, integers only. Never mix units.
  rent            integer not null,
  deposit         integer not null default 0,
  maintenance     integer not null default 0,
  maintenance_included boolean not null default false,

  -- preferences — the "posting options" and the search filters are the same set
  food_pref       public.food_pref not null default 'NO_PREFERENCE',
  pets_allowed    boolean not null default false,
  smoking_allowed boolean not null default false,
  drinking_allowed boolean not null default false,
  couples_allowed boolean not null default false,
  tenant_prefs    public.tenant_pref[] not null default '{ANYONE}'::public.tenant_pref[],

  -- physical
  bedrooms        smallint,
  bathrooms       smallint,
  balconies       smallint,
  floor_number    smallint,
  total_floors    smallint,
  carpet_area_sqft integer,
  parking         public.parking_type not null default 'NONE',
  amenities       text[] not null default '{}',

  -- location: FKs are canonical, text columns are denormalized copies
  city_id         smallint not null references public.cities(id) on delete restrict,
  locality_id     integer  not null,
  city            text not null,   -- set by sync_listing_location() in 0003
  locality        text not null,   -- set by sync_listing_location() in 0003
  address_line    text,            -- PRIVATE: excluded from listings_public
  pincode         text,

  -- availability
  available_from  date not null,
  min_stay_months smallint,

  -- housekeeping
  photo_count     smallint not null default 0,   -- kept in sync by trigger (0003)
  views_count     integer not null default 0,
  published_at    timestamptz,
  expires_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  search_vector tsvector generated always as (
    to_tsvector('english',
      coalesce(title,'') || ' ' || coalesce(locality,'') || ' ' || coalesce(city,''))
  ) stored,

  -- a locality must belong to the listing's city — enforced, not assumed
  constraint listings_locality_in_city
    foreign key (locality_id, city_id)
    references public.localities(id, city_id) on delete restrict,

  constraint rent_positive  check (rent > 0),
  constraint money_sane     check (deposit >= 0 and maintenance >= 0),
  constraint sane_floors    check (
    floor_number is null or total_floors is null or floor_number <= total_floors
  ),
  constraint counts_sane    check (
    (bedrooms  is null or bedrooms  between 0 and 20) and
    (bathrooms is null or bathrooms between 0 and 20) and
    (balconies is null or balconies between 0 and 20)
  ),
  constraint tenant_prefs_nonempty check (array_length(tenant_prefs, 1) >= 1),
  constraint published_has_timestamp check (
    status <> 'PUBLISHED' or published_at is not null
  ),
  constraint amenities_valid check (
    amenities <@ array[
      'lift','power_backup','wifi','gym','swimming_pool','security','cctv',
      'water_supply_24x7','gas_pipeline','ac','geyser','washing_machine',
      'refrigerator','modular_kitchen','wardrobe','tv','sofa','bed','dining_table',
      'balcony','park','play_area','clubhouse','visitor_parking','housekeeping',
      'rain_water_harvesting','fire_safety','intercom','servant_room','study_room'
    ]::text[]
  )
);

comment on column public.listings.address_line is
  'PRIVATE. Excluded from listings_public. The exact address leaks the flat location.';
comment on column public.listings.city is
  'Denormalized from cities.name by trigger. Do not write directly.';
comment on column public.listings.locality is
  'Denormalized from localities.name by trigger. Do not write directly.';
comment on column public.listings.amenities is
  'Constrained to the canonical list in amenities_valid. Extend by altering that check.';

-- -----------------------------------------------------------------------------
-- listing_photos — MAX 4 per listing, enforced by trigger in 0003
-- The browser uploads two pre-compressed WebP variants; the blur placeholder is
-- a ~400 byte data URI stored inline rather than as a third Storage object.
-- -----------------------------------------------------------------------------
create table public.listing_photos (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid not null references public.listings(id) on delete cascade,
  card_path     text not null,   -- listings/{listing_id}/{uuid}-card.webp   (640px)
  full_path     text not null,   -- listings/{listing_id}/{uuid}-full.webp   (1600px)
  blur_data_url text,
  width         integer,         -- of the full variant
  height        integer,
  bytes         integer,
  position      smallint not null default 0,   -- 0 = cover photo
  created_at    timestamptz not null default now(),

  -- hard cap of 4 lives here as well as in the trigger; positions are 0..3
  constraint position_range check (position between 0 and 3),
  constraint blur_is_data_uri check (
    blur_data_url is null or blur_data_url like 'data:image/%'
  ),
  unique (listing_id, position)
);

-- -----------------------------------------------------------------------------
-- saved_listings — favourites
-- -----------------------------------------------------------------------------
create table public.saved_listings (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

-- -----------------------------------------------------------------------------
-- listing_reports — moderation queue. One report per user per listing.
-- -----------------------------------------------------------------------------
create table public.listing_reports (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason      text not null,
  resolved    boolean not null default false,
  created_at  timestamptz not null default now(),

  unique (listing_id, reporter_id)
);

-- -----------------------------------------------------------------------------
-- contact_reveals — audit log, and the rate-limit source for reveal_contact()
-- -----------------------------------------------------------------------------
create table public.contact_reveals (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings(id) on delete cascade,
  viewer_id   uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now()
);
