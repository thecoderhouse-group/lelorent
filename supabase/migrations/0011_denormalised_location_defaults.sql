-- =============================================================================
-- 0010_denormalised_location_defaults.sql
--
-- listings.city and listings.locality are NOT NULL and are filled by the
-- listings_before_write trigger from city_id / locality_id. They are outputs,
-- never inputs.
--
-- Without a DEFAULT, Postgres reports them as required on insert, so the
-- generated TypeScript Insert type demands two values the caller is explicitly
-- told not to supply (and could only supply by duplicating the lookup the
-- trigger already performs).
--
-- An empty-string default makes the column optional to the type generator
-- while leaving NOT NULL intact. The trigger overwrites the default on every
-- insert and update, so no row can actually persist an empty value.
-- =============================================================================

alter table public.listings
  alter column city set default '',
  alter column locality set default '';

comment on column public.listings.city is
  'Denormalized from cities.name by listings_before_write. Do not supply on '
  'insert; the empty-string default exists only so the column is optional to '
  'client type generators.';

comment on column public.listings.locality is
  'Denormalized from localities.name by listings_before_write. Do not supply '
  'on insert; see listings.city.';
