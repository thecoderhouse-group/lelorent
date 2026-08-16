-- =============================================================================
-- 0004_views_rpc.sql — the public read surface
--
-- listings_public is the ONLY thing anonymous visitors query. It is the
-- security boundary: an explicit column list that omits address_line, omits
-- owner phone, and hard-filters status='PUBLISHED'.
--
-- The view runs with security_invoker = off (the default) ON PURPOSE. It needs
-- to read public.profiles, which RLS restricts to the owner. Running as the
-- view owner lets it join that table and surface only full_name/avatar_url.
-- Supabase's linter flags definer views generically — this one is deliberate,
-- and its safety comes from the column list plus the WHERE clause below.
-- =============================================================================

create view public.listings_public
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
  l.pincode,                 -- area-level only; address_line is NOT exposed
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
  cover.blur_data_url as cover_blur
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

comment on view public.listings_public is
  'Public read surface. Excludes listings.address_line and profiles.phone by '
  'construction. Do not add columns here without checking they are safe to '
  'expose to anonymous users.';

grant select on public.listings_public to anon, authenticated;

-- -----------------------------------------------------------------------------
-- reveal_contact — the only path to an owner's phone number.
--
-- Requires a signed-in user, rate limits to 20 reveals per rolling hour, and
-- writes an audit row every time. Gating this behind login is what stops the
-- listings from being scraped into a phone-number list.
-- -----------------------------------------------------------------------------
create or replace function public.reveal_contact(p_listing_id uuid)
returns table (owner_name text, owner_phone text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_viewer uuid := auth.uid();
  v_recent integer;
  v_exists boolean;
begin
  if v_viewer is null then
    raise exception 'You must be signed in to see contact details.'
      using errcode = '42501';
  end if;

  select exists (
    select 1 from public.listings
     where id = p_listing_id and status = 'PUBLISHED'
  ) into v_exists;

  if not v_exists then
    raise exception 'Listing not found or no longer published.'
      using errcode = 'P0002';
  end if;

  select count(*) into v_recent
    from public.contact_reveals
   where viewer_id = v_viewer
     and created_at > now() - interval '1 hour';

  if v_recent >= 20 then
    raise exception
      'You have viewed too many contact details in the last hour. Try again later.';
  end if;

  insert into public.contact_reveals (listing_id, viewer_id)
  values (p_listing_id, v_viewer);

  return query
    select pr.full_name, pr.phone
      from public.listings l
      join public.profiles pr on pr.id = l.owner_id
     where l.id = p_listing_id;
end;
$$;

revoke all on function public.reveal_contact(uuid) from public, anon;
grant execute on function public.reveal_contact(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Location lookups for the city/locality pickers and filter dropdowns.
-- -----------------------------------------------------------------------------
create or replace function public.localities_for_city(p_city_slug text)
returns table (id integer, slug text, name text)
language sql
stable
security definer
set search_path = ''
as $$
  select l.id, l.slug, l.name
    from public.localities l
    join public.cities c on c.id = l.city_id
   where c.slug = p_city_slug
     and c.is_active
     and l.is_active
   order by l.name;
$$;

grant execute on function public.localities_for_city(text) to anon, authenticated;
