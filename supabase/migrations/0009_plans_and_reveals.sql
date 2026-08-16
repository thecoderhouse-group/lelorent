-- =============================================================================
-- 0009_plans_and_reveals.sql — contact reveal quota, plans, subscriptions
--
-- Model:
--   * Signed-in users unlock 3 owner contacts, ONCE, for the lifetime of the
--     account. No refill.
--   * Premium (Rs 500 / 30 days) unlocks contacts without limit.
--   * A contact already unlocked stays unlocked forever, including after a
--     premium subscription lapses. Re-viewing never costs a credit.
--
-- Money is stored in PAISE as integers throughout. Rs 500 is 50000. Currency
-- in floating point eventually produces a rounding dispute with a customer.
--
-- Tax: the displayed price is what the user pays. GST is carved OUT of it, not
-- added on top, so the checkout total always equals the advertised number.
-- =============================================================================

create type public.plan_code as enum ('FREE', 'PREMIUM_1M');

create type public.subscription_status as enum (
  'PENDING',    -- order created, payment not confirmed
  'ACTIVE',
  'EXPIRED',
  'CANCELLED',
  'FAILED'
);

/**
 * Outcome of a reveal attempt.
 *
 * Returned as a value rather than raised as an exception: the client has to
 * branch on "out of credits" to show the paywall, and branching on Postgres
 * SQLSTATE strings across PostgREST is brittle. Only genuine faults raise.
 */
create type public.reveal_result as enum (
  'OK',
  'NOT_AUTHENTICATED',
  'NOT_FOUND',
  'QUOTA_EXCEEDED',
  'RATE_LIMITED'
);

-- -----------------------------------------------------------------------------
-- plans — pricing lives in data, not in code, so changing the free allowance
-- or the price does not need a deploy.
-- -----------------------------------------------------------------------------
create table public.plans (
  code           public.plan_code primary key,
  name           text not null,
  description    text not null,
  price_paise    integer not null,
  /** GST in basis points. 1800 = 18%. Carved out of price_paise. */
  gst_rate_bp    integer not null default 1800,
  /** null = never expires (the FREE plan) */
  duration_days  integer,
  /** null = unlimited reveals */
  reveal_quota   integer,
  is_active      boolean not null default true,
  sort_order     smallint not null default 0,
  created_at     timestamptz not null default now(),

  constraint price_non_negative check (price_paise >= 0),
  constraint gst_rate_sane check (gst_rate_bp between 0 and 10000),
  constraint quota_non_negative check (reveal_quota is null or reveal_quota >= 0),
  constraint duration_positive check (duration_days is null or duration_days > 0)
);

insert into public.plans
  (code, name, description, price_paise, duration_days, reveal_quota, sort_order)
values
  ('FREE', 'Free',
   'Unlock 3 owner contacts. One time, no expiry.',
   0, null, 3, 0),
  ('PREMIUM_1M', 'Premium',
   'Unlock every owner contact for 30 days.',
   50000, 30, null, 1);

/** Splits an inclusive price into base + tax. Rs 500 -> 42373 + 7627 paise. */
create or replace function public.gst_split(p_price_paise integer, p_rate_bp integer)
returns table (base_paise integer, tax_paise integer)
language sql
immutable
as $$
  select
    round(p_price_paise::numeric * 10000 / (10000 + p_rate_bp))::integer,
    p_price_paise - round(p_price_paise::numeric * 10000 / (10000 + p_rate_bp))::integer;
$$;

-- -----------------------------------------------------------------------------
-- subscriptions
--
-- provider_* columns are the payment seam. Nothing else in the schema knows or
-- cares which gateway is used, so wiring Razorpay later touches only the route
-- that writes these three fields.
-- -----------------------------------------------------------------------------
create table public.subscriptions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  plan_code           public.plan_code not null references public.plans(code),
  status              public.subscription_status not null default 'PENDING',

  amount_paise        integer not null,
  tax_paise           integer not null default 0,

  started_at          timestamptz,
  expires_at          timestamptz,

  provider            text,
  provider_order_id   text,
  provider_payment_id text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint amount_non_negative check (amount_paise >= 0 and tax_paise >= 0),
  constraint active_has_window check (
    status <> 'ACTIVE' or (started_at is not null and expires_at is not null)
  ),
  constraint window_ordered check (
    expires_at is null or started_at is null or expires_at > started_at
  )
);

/**
 * At most one live subscription per user. A renewal extends expires_at on the
 * existing row rather than stacking a second ACTIVE one, which would make
 * "when does this person's access end" ambiguous.
 */
create unique index subscriptions_one_active_idx
  on public.subscriptions (user_id)
  where status = 'ACTIVE';

/** Gateway order ids must be unique per provider so a replayed webhook cannot
    activate the same order twice. */
create unique index subscriptions_provider_order_idx
  on public.subscriptions (provider, provider_order_id)
  where provider_order_id is not null;

create index subscriptions_user_idx on public.subscriptions (user_id, created_at desc);
create index subscriptions_expiry_idx
  on public.subscriptions (expires_at)
  where status = 'ACTIVE';

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- contact_reveals becomes the unlock ledger rather than an append-only log.
--
-- One row per (viewer, listing). This is what makes "re-viewing a number does
-- not burn a credit" true by construction instead of by careful counting.
-- -----------------------------------------------------------------------------
alter table public.contact_reveals
  add column reveal_count integer not null default 1,
  add column last_revealed_at timestamptz not null default now();

alter table public.contact_reveals
  add constraint contact_reveals_one_per_listing unique (viewer_id, listing_id);

comment on table public.contact_reveals is
  'Unlock ledger. Row count per viewer IS their consumed quota.';

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
create or replace function public.has_active_premium(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.subscriptions
     where user_id = p_user
       and status = 'ACTIVE'
       and expires_at > now()
  );
$$;

create or replace function public.free_reveal_quota()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select reveal_quota from public.plans where code = 'FREE'), 3);
$$;

-- -----------------------------------------------------------------------------
-- reveal_status — read-only. Lets the UI render the right button state
-- WITHOUT consuming a credit, which a naive implementation gets wrong by
-- calling the mutating function just to find out whether it would succeed.
-- -----------------------------------------------------------------------------
create or replace function public.reveal_status(p_listing_id uuid)
returns table (
  is_authenticated boolean,
  is_premium       boolean,
  already_unlocked boolean,
  used             integer,
  quota            integer,
  remaining        integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_viewer  uuid := auth.uid();
  v_premium boolean;
  v_used    integer;
  v_quota   integer := public.free_reveal_quota();
begin
  if v_viewer is null then
    return query select false, false, false, 0, v_quota, 0;
    return;
  end if;

  v_premium := public.has_active_premium(v_viewer);

  select count(*)::integer into v_used
    from public.contact_reveals
   where viewer_id = v_viewer;

  return query
    select
      true,
      v_premium,
      exists (
        select 1 from public.contact_reveals
         where viewer_id = v_viewer and listing_id = p_listing_id
      ),
      v_used,
      v_quota,
      greatest(0, v_quota - v_used);
end;
$$;

-- -----------------------------------------------------------------------------
-- reveal_contact — the metered action.
-- Replaces the 0004 version, which had no quota concept.
-- -----------------------------------------------------------------------------
drop function if exists public.reveal_contact(uuid);

create or replace function public.reveal_contact(p_listing_id uuid)
returns table (
  result      public.reveal_result,
  owner_name  text,
  owner_phone text,
  remaining   integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_viewer      uuid := auth.uid();
  v_quota       integer := public.free_reveal_quota();
  v_used        integer;
  v_recent      integer;
  v_premium     boolean;
  v_owner_name  text;
  v_owner_phone text;
begin
  if v_viewer is null then
    return query select 'NOT_AUTHENTICATED'::public.reveal_result, null::text, null::text, 0;
    return;
  end if;

  select pr.full_name, pr.phone
    into v_owner_name, v_owner_phone
    from public.listings l
    join public.profiles pr on pr.id = l.owner_id
   where l.id = p_listing_id
     and l.status = 'PUBLISHED';

  if not found then
    return query select 'NOT_FOUND'::public.reveal_result, null::text, null::text, 0;
    return;
  end if;

  select count(*)::integer into v_used
    from public.contact_reveals
   where viewer_id = v_viewer;

  -- Already unlocked: free forever, and it never costs another credit.
  if exists (
    select 1 from public.contact_reveals
     where viewer_id = v_viewer and listing_id = p_listing_id
  ) then
    update public.contact_reveals
       set reveal_count = reveal_count + 1,
           last_revealed_at = now()
     where viewer_id = v_viewer and listing_id = p_listing_id;

    return query select 'OK'::public.reveal_result, v_owner_name, v_owner_phone,
                        greatest(0, v_quota - v_used);
    return;
  end if;

  -- Abuse guard, independent of the commercial quota: caps how fast NEW
  -- unlocks can be taken even by a premium account, so a scraper with a paid
  -- login cannot drain the whole database in a minute.
  select count(*)::integer into v_recent
    from public.contact_reveals
   where viewer_id = v_viewer
     and created_at > now() - interval '1 hour';

  if v_recent >= 20 then
    return query select 'RATE_LIMITED'::public.reveal_result, null::text, null::text,
                        greatest(0, v_quota - v_used);
    return;
  end if;

  v_premium := public.has_active_premium(v_viewer);

  if not v_premium and v_used >= v_quota then
    return query select 'QUOTA_EXCEEDED'::public.reveal_result, null::text, null::text, 0;
    return;
  end if;

  insert into public.contact_reveals (listing_id, viewer_id)
  values (p_listing_id, v_viewer)
  on conflict (viewer_id, listing_id) do nothing;

  return query select 'OK'::public.reveal_result, v_owner_name, v_owner_phone,
                      case when v_premium then null::integer
                           else greatest(0, v_quota - v_used - 1) end;
end;
$$;

revoke all on function public.reveal_contact(uuid) from public, anon;
revoke all on function public.reveal_status(uuid) from public;
grant execute on function public.reveal_contact(uuid) to authenticated;
grant execute on function public.reveal_status(uuid) to anon, authenticated;
grant execute on function public.has_active_premium(uuid) to authenticated;
grant execute on function public.free_reveal_quota() to anon, authenticated;
grant execute on function public.gst_split(integer, integer) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;

create policy "active plans are public"
  on public.plans for select
  to anon, authenticated
  using (is_active);

-- Users may read their own subscriptions. They may NOT insert or update them:
-- writing a row here grants paid access, so only the service role (the payment
-- webhook) can create or activate one.
revoke all on public.subscriptions from anon, authenticated;
grant select on public.subscriptions to authenticated;

create policy "users read own subscriptions"
  on public.subscriptions for select
  to authenticated
  using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Expiry sweep, called by the nightly cron.
-- -----------------------------------------------------------------------------
create or replace function public.expire_subscriptions()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  update public.subscriptions
     set status = 'EXPIRED'
   where status = 'ACTIVE'
     and expires_at <= now();
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.expire_subscriptions() from public, anon, authenticated;
