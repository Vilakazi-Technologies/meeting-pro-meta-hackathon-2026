-- Browser softphone: answer WhatsApp calls from the Meeting Pro web app.
--
-- Meta only transcribes a user-initiated call when the business accepts it
-- through the Calling API with a WebRTC SDP answer. Until now nothing answered,
-- so no real call could ever produce a transcript.
--
-- Flow: the webhook stores Meta's SDP offer on the call row and marks it
-- ringing. Realtime pushes the row to every signed-in member's browser. One
-- member claims it (claim is atomic, so two people cannot both answer), the
-- browser builds the answer, and the call-control function relays it to Meta.

alter table public.calls
  add column if not exists sdp_offer text,
  add column if not exists ring_state text
    check (ring_state is null or ring_state in ('ringing', 'answering', 'connected', 'ended')),
  add column if not exists answered_by text,
  add column if not exists answered_at timestamptz,
  add column if not exists counterparty_name text;

comment on column public.calls.sdp_offer is
  'SDP offer from the connect webhook. Meta only accepts an answer to its own offer.';
comment on column public.calls.ring_state is
  'Softphone state. null for calls that never rang in the app (history, business-initiated).';
comment on column public.calls.answered_by is
  'Clerk user id of the member who answered in the browser.';

create index if not exists calls_ringing_idx
  on public.calls (business_id, created_at desc) where ring_state = 'ringing';

-- Members receive ringing calls over Realtime; RLS (calls_select) still applies.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'calls'
  ) then
    alter publication supabase_realtime add table public.calls;
  end if;
end $$;

-- Authorise a call action for the caller and return what call-control needs to
-- reach Meta. With p_claim, atomically move ringing -> answering so only one
-- member can answer. Demo viewers are not members, so they can never control a call.
create or replace function public.call_control_target(p_call_id uuid, p_claim boolean default false)
returns table (meta_call_id text, phone_number_id text, business_id uuid, ring_state text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_subject text := public.jwt_subject();
  v_row public.calls%rowtype;
begin
  if v_subject is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;

  select * into v_row from public.calls c where c.id = p_call_id;
  if not found or not public.is_business_member(v_row.business_id) then
    raise exception 'Call not found' using errcode = 'P0002';
  end if;

  if p_claim then
    update public.calls c
       set ring_state = 'answering', answered_by = v_subject
     where c.id = p_call_id and c.ring_state = 'ringing'
    returning * into v_row;
    if not found then
      raise exception 'This call was already answered or has ended' using errcode = 'P0001';
    end if;
  end if;

  return query
    select v_row.meta_call_id, w.phone_number_id, v_row.business_id, v_row.ring_state
      from public.whatsapp_numbers w
     where w.id = v_row.whatsapp_number_id;
end;
$$;

revoke all on function public.call_control_target(uuid, boolean) from public;
grant execute on function public.call_control_target(uuid, boolean) to authenticated;
