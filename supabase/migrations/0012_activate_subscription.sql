-- =============================================================================
-- 0012_activate_subscription.sql — turn a paid gateway order into access
--
-- Called by the server after Razorpay confirms a payment, from two places that
-- can race: the browser's post-checkout verify call and Razorpay's webhook.
-- So it must be idempotent and safe under concurrency:
--
--   * The order row is locked FOR UPDATE; the second caller waits, then sees
--     it already ACTIVE (or superseded) and returns ALREADY_ACTIVE.
--   * Only a PENDING or FAILED order can be activated.
--
-- Renewals. subscriptions_one_active_idx allows one ACTIVE row per user. Each
-- payment keeps its own row (so its amount and gateway ids stay on record):
-- the new row becomes ACTIVE and its window starts where the current one
-- ends, and the previous ACTIVE row is closed off as EXPIRED at the moment of
-- renewal. Remaining days carry over; nothing is lost or double counted.
--
-- Not callable by anon/authenticated: activating a row grants paid access.
-- =============================================================================

create or replace function public.activate_subscription(
  p_provider          text,
  p_provider_order_id text,
  p_provider_payment_id text
)
returns table (result text, subscription_id uuid, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_sub        public.subscriptions%rowtype;
  v_current    public.subscriptions%rowtype;
  v_days       integer;
  v_start      timestamptz := now();
  v_expires    timestamptz;
begin
  select * into v_sub
    from public.subscriptions s
   where s.provider = p_provider
     and s.provider_order_id = p_provider_order_id
   for update;

  if not found then
    return query select 'NOT_FOUND'::text, null::uuid, null::timestamptz;
    return;
  end if;

  if v_sub.status = 'ACTIVE' or v_sub.provider_payment_id is not null then
    return query select 'ALREADY_ACTIVE'::text, v_sub.id, v_sub.expires_at;
    return;
  end if;

  if v_sub.status not in ('PENDING', 'FAILED') then
    return query select 'NOT_ACTIVATABLE'::text, v_sub.id, v_sub.expires_at;
    return;
  end if;

  select p.duration_days into v_days
    from public.plans p
   where p.code = v_sub.plan_code;

  if v_days is null then
    raise exception 'Plan % has no duration', v_sub.plan_code;
  end if;

  -- The user's current live window, if any. Locked so two renewals cannot
  -- both read the same end date.
  select * into v_current
    from public.subscriptions s
   where s.user_id = v_sub.user_id
     and s.status = 'ACTIVE'
   for update;

  if found and v_current.expires_at > v_start then
    v_expires := v_current.expires_at + make_interval(days => v_days);
  else
    v_expires := v_start + make_interval(days => v_days);
  end if;

  if found then
    -- Close the previous window at the earlier of its real end and now
    -- (never before it started, to satisfy window_ordered).
    update public.subscriptions
       set status = 'EXPIRED',
           expires_at = greatest(
             least(v_current.expires_at, v_start),
             v_current.started_at + interval '1 second'
           )
     where id = v_current.id;
  end if;

  update public.subscriptions
     set status = 'ACTIVE',
         started_at = v_start,
         expires_at = v_expires,
         provider_payment_id = p_provider_payment_id
   where id = v_sub.id;

  return query select 'ACTIVATED'::text, v_sub.id, v_expires;
end;
$$;

revoke all on function public.activate_subscription(text, text, text)
  from public, anon, authenticated;
grant execute on function public.activate_subscription(text, text, text)
  to service_role;
