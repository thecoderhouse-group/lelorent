-- =============================================================================
-- 0010_listing_kind.sql — what KIND of listing this is
--
-- flat_type describes the property. It cannot describe the offer, and those
-- are different questions: a private room let out by a landlord and a private
-- room offered by someone already living in the flat carry the same flat_type
-- and are completely different things to answer an ad for. One comes with a
-- tenancy, the other comes with a flatmate.
--
-- That distinction is the whole "Flatmates" category, and no existing column
-- can express it — which is why it needs a column rather than a mapping.
--
-- Its own enum rather than extra flat_type values on purpose: ALTER TYPE ...
-- ADD VALUE cannot be used by the same transaction that adds it, and a
-- migration that backfills has to do exactly that. Migrations run in a
-- transaction, so that route deadlocks against itself.
-- =============================================================================

create type public.listing_kind as enum ('FLAT','ROOM','FLATMATE','PG');

alter table public.listings
  add column listing_kind public.listing_kind;

-- -----------------------------------------------------------------------------
-- Derivation, following the trigger pattern 0003 already uses for the
-- denormalized city/locality text.
--
-- Deliberately no column DEFAULT: any fixed default is wrong for most rows and
-- would fail the check constraint below the moment a PG bed is inserted
-- without naming its kind. Deriving from flat_type is right for every listing
-- except a flatmate ad, and that is the one case a poster must state — it is
-- new information, never something inferable from the shape of the property.
-- -----------------------------------------------------------------------------
create or replace function public.derive_listing_kind()
returns trigger
language plpgsql
as $$
begin
  if new.listing_kind is null then
    new.listing_kind := case
      when new.flat_type = 'PG_BED' then 'PG'
      when new.flat_type in ('PRIVATE_ROOM','SHARED_ROOM') then 'ROOM'
      else 'FLAT'
    end::public.listing_kind;
  end if;
  return new;
end;
$$;

-- BEFORE triggers run ahead of NOT NULL and CHECK validation, so an insert
-- that omits the column still succeeds.
create trigger listings_derive_kind
  before insert or update of flat_type, listing_kind
  on public.listings
  for each row
  execute function public.derive_listing_kind();

update public.listings
   set listing_kind = case
     when flat_type = 'PG_BED' then 'PG'
     when flat_type in ('PRIVATE_ROOM','SHARED_ROOM') then 'ROOM'
     else 'FLAT'
   end::public.listing_kind
 where listing_kind is null;

alter table public.listings
  alter column listing_kind set not null;

-- FLAT and PG are fully determined by flat_type, so a disagreement there is a
-- data-entry bug worth rejecting outright. ROOM and FLATMATE share the same
-- flat_types by design — telling those two apart is the entire reason this
-- column exists, so the constraint must not try to separate them.
alter table public.listings
  add constraint listing_kind_matches_flat_type check (
    case listing_kind
      when 'PG'   then flat_type = 'PG_BED'
      when 'FLAT' then flat_type in (
        '1RK','1BHK','2BHK','3BHK','4BHK','4BHK_PLUS','INDEPENDENT_HOUSE'
      )
      else flat_type in ('PRIVATE_ROOM','SHARED_ROOM')   -- ROOM, FLATMATE
    end
  );

comment on column public.listings.listing_kind is
  'Category dimension for the search tabs. ROOM = a room being let out; FLATMATE = someone already living there looking to share. Derived from flat_type by trigger when not supplied.';

-- Partial index mirroring 0002: the category tab is the first cut almost every
-- session makes, and only PUBLISHED rows are ever searched.
create index if not exists listings_kind_idx
  on public.listings (listing_kind)
  where status = 'PUBLISHED';

-- -----------------------------------------------------------------------------
-- Republish the view with listing_kind appended.
--
-- CREATE OR REPLACE VIEW only permits adding columns at the end of the select
-- list, so this reproduces 0008 verbatim with one column added. Replacing
-- rather than dropping keeps the existing grants from 0005 intact.
-- -----------------------------------------------------------------------------
create or replace view public.listings_public
with (security_invoker = off) as
select
  l.id,
  l.status,
  l.title,
  l.description,

  l.flat_type,
  l.furnishing,

  l.rent,
  l.deposit,
  l.maintenance,
  l.maintenance_included,

  l.food_pref,
  l.pets_allowed,
  l.smoking_allowed,
  l.drinking_allowed,
  l.couples_allowed,
  l.tenant_prefs,

  l.bedrooms,
  l.bathrooms,
  l.balconies,
  l.floor_number,
  l.total_floors,
  l.carpet_area_sqft,
  l.parking,
  l.amenities,

  l.city_id,
  l.locality_id,
  l.city,
  l.locality,
  l.pincode,
  c.slug   as city_slug,
  loc.slug as locality_slug,

  l.available_from,
  l.min_stay_months,

  l.photo_count,
  l.views_count,
  l.published_at,
  l.created_at,

  p.full_name  as owner_name,
  p.avatar_url as owner_avatar,

  cover.card_path     as cover_card_path,
  cover.blur_data_url as cover_blur,

  l.search_vector,

  -- appended by 0010
  l.listing_kind
from public.listings l
join public.cities     c   on c.id   = l.city_id
join public.localities loc on loc.id = l.locality_id
join public.profiles   p   on p.id   = l.owner_id
left join lateral (
  select ph.card_path, ph.blur_data_url
    from public.listing_photos ph
   where ph.listing_id = l.id
   order by ph.position
   limit 1
) cover on true
where l.status = 'PUBLISHED';
