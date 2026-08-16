-- =============================================================================
-- 0002_indexes.sql
--
-- Partial indexes on status='PUBLISHED' keep the hot indexes small: drafts,
-- rented and expired rows never bloat them. Roughly half the rows in a mature
-- rental database are not published.
--
-- Multi-select filters (amenities, tenant_prefs) use GIN so that @> ("has all
-- of") and && ("has any of") are index-backed. Postgres combines several of
-- these via bitmap index scans, so we do NOT need one composite index per
-- filter combination — that is exactly the Firestore problem we avoided.
-- =============================================================================

-- --- multi-select filters ----------------------------------------------------
create index listings_amenities_gin    on public.listings using gin (amenities);
create index listings_tenant_prefs_gin on public.listings using gin (tenant_prefs);

-- --- free-text search --------------------------------------------------------
create index listings_search_gin on public.listings using gin (search_vector);

-- --- the main browse paths ---------------------------------------------------
-- "flats in Pune, cheapest first" / "…within a rent range"
create index listings_browse_idx
  on public.listings (city_id, rent)
  where status = 'PUBLISHED';

-- "newest first" — the default sort
create index listings_recent_idx
  on public.listings (city_id, published_at desc)
  where status = 'PUBLISHED';

-- "available by <date>"
create index listings_available_idx
  on public.listings (city_id, available_from)
  where status = 'PUBLISHED';

-- locality landing pages: /pune/baner
create index listings_locality_idx
  on public.listings (locality_id, published_at desc)
  where status = 'PUBLISHED';

-- the single most common enum filter, worth its own partial index
create index listings_flat_type_idx
  on public.listings (city_id, flat_type)
  where status = 'PUBLISHED';

-- --- dashboard ---------------------------------------------------------------
create index listings_owner_idx on public.listings (owner_id, status, updated_at desc);

-- --- cron: expiry sweep and abandoned-draft cleanup --------------------------
create index listings_expiry_idx
  on public.listings (expires_at)
  where status = 'PUBLISHED';

create index listings_stale_drafts_idx
  on public.listings (created_at)
  where status = 'DRAFT';

-- --- supporting tables -------------------------------------------------------
create index listing_photos_listing_idx on public.listing_photos (listing_id, position);
create index localities_city_idx        on public.localities (city_id) where is_active;
create index saved_listings_listing_idx on public.saved_listings (listing_id);

-- moderation queue: unresolved reports, oldest first
create index listing_reports_open_idx
  on public.listing_reports (created_at)
  where not resolved;

-- rate limiting inside reveal_contact()
create index contact_reveals_viewer_idx
  on public.contact_reveals (viewer_id, created_at desc);
