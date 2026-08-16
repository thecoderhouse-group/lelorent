-- =============================================================================
-- 0003_triggers.sql
--
-- All functions are SECURITY DEFINER with an empty search_path, per Supabase
-- hardening guidance: an empty search_path means every identifier must be
-- schema-qualified, which is what stops search_path injection.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Generic updated_at
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Create a profile row whenever an auth user signs up.
-- Without this, the very first insert a new user attempts fails on the
-- listings.owner_id foreign key.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- listings: denormalize location, stamp publish/expiry, bump updated_at.
--
-- One function rather than three triggers, because BEFORE triggers on the same
-- table fire in alphabetical order by trigger name and relying on that is a
-- trap. Explicit ordering here instead.
-- -----------------------------------------------------------------------------
create or replace function public.listings_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_city text;
  v_locality text;
begin
  -- 1. denormalize city/locality names from the FKs
  if tg_op = 'INSERT'
     or new.city_id is distinct from old.city_id
     or new.locality_id is distinct from old.locality_id
  then
    select c.name, l.name
      into v_city, v_locality
      from public.localities l
      join public.cities c on c.id = l.city_id
     where l.id = new.locality_id
       and l.city_id = new.city_id;

    if v_city is null then
      raise exception
        'locality % does not belong to city %', new.locality_id, new.city_id;
    end if;

    new.city := v_city;
    new.locality := v_locality;
  end if;

  -- 2. stamp publish and expiry on the transition into PUBLISHED
  if new.status = 'PUBLISHED'
     and (tg_op = 'INSERT' or old.status is distinct from 'PUBLISHED')
  then
    new.published_at := coalesce(new.published_at, now());
    new.expires_at   := coalesce(new.expires_at, now() + interval '60 days');
  end if;

  -- 3. updated_at
  if tg_op = 'UPDATE' then
    new.updated_at := now();
  end if;

  return new;
end;
$$;

create trigger listings_before_write_trg
  before insert or update on public.listings
  for each row execute function public.listings_before_write();

-- -----------------------------------------------------------------------------
-- Photo cap: max 4 per listing.
--
-- The real guarantee is structural, not procedural: position is CHECKed to
-- 0..3 and UNIQUE per listing, so at most four rows can ever exist and there
-- is no insert race to lose. This trigger exists only to fail with a message a
-- human can read instead of a constraint-violation dump.
-- -----------------------------------------------------------------------------
create or replace function public.enforce_photo_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  select count(*) into n
    from public.listing_photos
   where listing_id = new.listing_id;

  if n >= 4 then
    raise exception 'max 4 photos per listing (listing %)', new.listing_id
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger listing_photos_limit_trg
  before insert on public.listing_photos
  for each row execute function public.enforce_photo_limit();

-- -----------------------------------------------------------------------------
-- Keep listings.photo_count accurate so search results can filter on
-- "has photos" and render cards without joining listing_photos.
-- -----------------------------------------------------------------------------
create or replace function public.sync_photo_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_listing uuid := coalesce(new.listing_id, old.listing_id);
begin
  update public.listings
     set photo_count = (
       select count(*) from public.listing_photos where listing_id = v_listing
     )
   where id = v_listing;

  return null;   -- AFTER trigger, return value ignored
end;
$$;

create trigger listing_photos_count_trg
  after insert or delete on public.listing_photos
  for each row execute function public.sync_photo_count();
