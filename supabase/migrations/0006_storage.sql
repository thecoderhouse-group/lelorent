-- =============================================================================
-- 0006_storage.sql — the listing-photos bucket
--
-- Two things here are load-bearing beyond ordinary access control:
--
--   1. allowed_mime_types is image/webp ONLY. The browser is supposed to
--      compress to WebP before upload; this makes that a server-enforced fact
--      rather than a client-side promise. A raw 8 MB JPEG straight off a phone
--      is rejected by Storage itself.
--
--   2. file_size_limit is 600 KB. The 1600px "full" variant targets ~180 KB,
--      so this is generous headroom while still making it impossible for one
--      listing to eat a meaningful slice of the 1 GB free tier.
--
-- Path convention: listings/{listing_id}/{uuid}-card.webp
--                  listings/{listing_id}/{uuid}-full.webp
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-photos',
  'listing-photos',
  true,
  600000,
  array['image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- Path ownership check.
--
-- Deliberately a plpgsql function with an explicit exception block rather than
-- an inline `((storage.foldername(name))[2])::uuid` in the policy. SQL does not
-- guarantee left-to-right AND short-circuiting, so a regex guard in front of a
-- cast is not actually safe — a malformed path could raise instead of simply
-- being denied. Parsing defensively here means a bad path is always just false.
-- -----------------------------------------------------------------------------
create or replace function public.owns_listing_path(p_object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  parts text[];
  v_listing_id uuid;
begin
  if auth.uid() is null then
    return false;
  end if;

  parts := storage.foldername(p_object_name);

  if parts is null
     or array_length(parts, 1) < 2
     or parts[1] <> 'listings'
  then
    return false;
  end if;

  begin
    v_listing_id := parts[2]::uuid;
  exception when others then
    return false;
  end;

  return exists (
    select 1 from public.listings
     where id = v_listing_id
       and owner_id = auth.uid()
  );
end;
$$;

grant execute on function public.owns_listing_path(text) to authenticated;

-- -----------------------------------------------------------------------------
-- Policies on storage.objects, scoped to this bucket
-- -----------------------------------------------------------------------------
create policy "listing photos are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'listing-photos');

create policy "owners upload listing photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listing-photos'
    and public.owns_listing_path(name)
  );

create policy "owners replace own listing photos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'listing-photos'
    and public.owns_listing_path(name)
  )
  with check (
    bucket_id = 'listing-photos'
    and public.owns_listing_path(name)
  );

create policy "owners delete own listing photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'listing-photos'
    and public.owns_listing_path(name)
  );
