-- =============================================================================
-- 0008_view_search_vector.sql
--
-- Found while verifying the seed data: listings_public omitted search_vector,
-- so PostgREST could not serve the free-text filter at all — the planned
--   .textSearch('search_vector', q)
-- call would have failed with "column does not exist" the moment the search
-- box was wired up.
--
-- CREATE OR REPLACE VIEW permits appending columns to the end of the select
-- list, so this keeps the existing grants rather than dropping and recreating.
-- The column list below is identical to 0004 with search_vector appended.
-- =============================================================================

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

  -- appended: enables ?search_vector=fts.<query> through PostgREST
  l.search_vector
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
