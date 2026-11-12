-- Billing: 5 free transcribed calls, then R50/month through Paystack, with a
-- fair-use cap of 30 calls or 300 minutes per billing period.
--
-- The gate is applied when a call is answered (call-control): past the limit
-- the call is still answered, because it is the business's customer, but Meta
-- is not asked to transcribe it. Counting therefore uses
-- calls.transcription_enabled, which call-control sets on accept.
--
-- Subscription rows are written only by the paystack-webhook and
-- billing-checkout functions (service role). Members can read their own.

create table if not exists public.business_subscriptions (
  business_id                 uuid primary key references public.businesses(id) on delete cascade,
  -- pending: checkout started, not paid. active: paid up. non_renewing: cancelled
  -- but paid to period end. attention: a renewal charge failed. cancelled: over.
  status                      text not null default 'pending'
    check (status in ('pending', 'active', 'non_renewing', 'attention', 'cancelled')),
  billing_email               text,
  paystack_customer_code      text unique,
  paystack_subscription_code  text unique,
  paystack_email_token        text,
  plan_code                   text,
  current_period_start        timestamptz,
  current_period_end          timestamptz,
  updated_at                  timestamptz not null default now()
);

comment on table public.business_subscriptions is
  'One Paystack subscription per business. Written by service-role functions only.';

alter table public.business_subscriptions enable row level security;

create policy business_subscriptions_select on public.business_subscriptions
  for select to authenticated using (public.is_business_member(business_id));

create trigger business_subscriptions_set_updated_at
  before update on public.business_subscriptions
  for each row execute function public.set_updated_at();

-- The single source of truth for "may the next call be transcribed?".
-- Internal: call-control reads it with the service role; the app uses my_plan().
create or replace function public.business_plan(p_business_id uuid)
returns table (
  plan               text,     -- 'free' | 'paid'
  status             text,     -- subscription status, or 'none'
  free_limit         integer,
  free_used          integer,
  period_call_limit  integer,
  period_calls_used  integer,
  period_minute_limit integer,
  period_minutes_used integer,
  period_end         timestamptz,
  can_transcribe     boolean
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  c_free_limit   constant integer := 5;
  c_call_limit   constant integer := 30;
  c_minute_limit constant integer := 300;
  v_sub          public.business_subscriptions%rowtype;
  v_paid         boolean;
  v_free_used    integer;
  v_calls        integer := 0;
  v_minutes      integer := 0;
begin
  select * into v_sub from public.business_subscriptions s where s.business_id = p_business_id;
  -- non_renewing and attention keep access until the paid period runs out;
  -- Paystack retries failed renewals before disabling the subscription.
  v_paid := found
    and v_sub.status in ('active', 'non_renewing', 'attention')
    and coalesce(v_sub.current_period_end, now()) >= now();

  select count(*) into v_free_used
    from public.calls c where c.business_id = p_business_id and c.transcription_enabled;

  if v_paid then
    select count(*), coalesce(sum(c.duration_seconds), 0) / 60
      into v_calls, v_minutes
      from public.calls c
     where c.business_id = p_business_id
       and c.transcription_enabled
       and c.answered_at >= coalesce(v_sub.current_period_start, now() - interval '1 month');
  end if;

  return query select
    case when v_paid then 'paid' else 'free' end,
    coalesce(v_sub.status, 'none'),
    c_free_limit,
    v_free_used,
    c_call_limit,
    v_calls,
    c_minute_limit,
    v_minutes,
    v_sub.current_period_end,
    case when v_paid then v_calls < c_call_limit and v_minutes < c_minute_limit
         else v_free_used < c_free_limit end;
end;
$$;

revoke all on function public.business_plan(uuid) from public, authenticated, anon;
grant execute on function public.business_plan(uuid) to service_role;

-- The caller's own plan, for the app. Demo viewers have no business, so no row.
create or replace function public.my_plan()
returns table (
  business_id        uuid,
  plan               text,
  status             text,
  free_limit         integer,
  free_used          integer,
  period_call_limit  integer,
  period_calls_used  integer,
  period_minute_limit integer,
  period_minutes_used integer,
  period_end         timestamptz,
  can_transcribe     boolean
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select bm.business_id, p.*
    from public.business_members bm
    cross join lateral public.business_plan(bm.business_id) p
   where bm.clerk_user_id = public.jwt_subject()
   order by bm.created_at
   limit 1;
$$;

revoke all on function public.my_plan() from public;
grant execute on function public.my_plan() to authenticated;
