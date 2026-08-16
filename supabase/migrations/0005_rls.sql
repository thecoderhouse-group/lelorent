-- =============================================================================
-- 0005_rls.sql — row level security
--
-- The model in one paragraph:
--   Anonymous visitors never touch public.listings directly. They read
--   listings_public (0004), which is a definer view that strips address_line
--   and owner phone. Signed-in users additionally get direct access to THEIR
--   OWN listings — every status, every column — for the dashboard.
--
-- Why the helper functions: a policy's USING clause is evaluated as the
-- calling user, so `exists (select 1 from listings ...)` inside a policy is
-- itself filtered by listings' own RLS and silently returns false. Definer
-- helpers break that recursion. This is the single most common way Supabase
-- RLS quietly denies everything.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
create or replace function public.listing_is_published(p_listing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.listings
     where id = p_listing_id and status = 'PUBLISHED'
  );
$$;

create or replace function public.owns_listing(p_listing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.listings
     where id = p_listing_id and owner_id = auth.uid()
  );
$$;

grant execute on function public.listing_is_published(uuid) to anon, authenticated;
grant execute on function public.owns_listing(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- cities / localities — public reference data, read-only.
-- Writes are service-role only (no policy = no access under RLS).
-- -----------------------------------------------------------------------------
alter table public.cities     enable row level security;
alter table public.localities enable row level security;

create policy "active cities are public"
  on public.cities for select
  to anon, authenticated
  using (is_active);

create policy "active localities are public"
  on public.localities for select
  to anon, authenticated
  using (is_active);

-- -----------------------------------------------------------------------------
-- profiles — owner-only. Public display name/avatar reach the UI through
-- listings_public, never through this table.
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;

revoke select on public.profiles from anon;

create policy "users read own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "users update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Normally the on_auth_user_created trigger (0003) creates this row as
-- definer. This policy is the fallback for a profile repaired client-side.
create policy "users insert own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- -----------------------------------------------------------------------------
-- listings
-- -----------------------------------------------------------------------------
alter table public.listings enable row level security;

-- Anonymous users get NOTHING from the base table — address_line lives here.
-- Their read path is listings_public.
revoke select on public.listings from anon;

create policy "owners read own listings"
  on public.listings for select
  to authenticated
  using (owner_id = auth.uid());

create policy "owners create listings"
  on public.listings for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "owners update own listings"
  on public.listings for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "owners delete own listings"
  on public.listings for delete
  to authenticated
  using (owner_id = auth.uid());

-- -----------------------------------------------------------------------------
-- listing_photos — every column here is safe to expose (paths, dimensions,
-- blur placeholder), so photos of published listings are world-readable.
-- That is what lets the detail-page gallery load all four without a view.
-- -----------------------------------------------------------------------------
alter table public.listing_photos enable row level security;

create policy "photos of published listings are public"
  on public.listing_photos for select
  to anon, authenticated
  using (public.listing_is_published(listing_id));

create policy "owners read own listing photos"
  on public.listing_photos for select
  to authenticated
  using (public.owns_listing(listing_id));

create policy "owners add listing photos"
  on public.listing_photos for insert
  to authenticated
  with check (public.owns_listing(listing_id));

create policy "owners update own listing photos"
  on public.listing_photos for update
  to authenticated
  using (public.owns_listing(listing_id))
  with check (public.owns_listing(listing_id));

create policy "owners delete own listing photos"
  on public.listing_photos for delete
  to authenticated
  using (public.owns_listing(listing_id));

-- -----------------------------------------------------------------------------
-- saved_listings — strictly private to the user
-- -----------------------------------------------------------------------------
alter table public.saved_listings enable row level security;

revoke all on public.saved_listings from anon;

create policy "users manage own saved listings"
  on public.saved_listings for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- listing_reports — a user may file and see their own reports. The moderation
-- queue is service-role only.
-- -----------------------------------------------------------------------------
alter table public.listing_reports enable row level security;

revoke all on public.listing_reports from anon;

create policy "users file reports"
  on public.listing_reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

create policy "users read own reports"
  on public.listing_reports for select
  to authenticated
  using (reporter_id = auth.uid());

-- -----------------------------------------------------------------------------
-- contact_reveals — append-only audit log. No direct access for anyone;
-- reveal_contact() writes it as definer. RLS on with zero policies = closed.
-- -----------------------------------------------------------------------------
alter table public.contact_reveals enable row level security;

revoke all on public.contact_reveals from anon, authenticated;
