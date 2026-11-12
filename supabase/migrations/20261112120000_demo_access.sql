-- Read-only demo workspace for anyone who signs in without a business.
--
-- Before this, a new sign-in landed on an empty app: the only way to get a
-- business was registering a real Meta WhatsApp number. Visitors (judges,
-- investors, pilots) could never see the product working.
--
-- A visitor opts in with enter_demo(). While they belong to no business of
-- their own, extra SELECT policies let them read the Khaya demo business. Write
-- policies are untouched, so the demo data cannot be changed by visitors. The
-- moment they register their own number they become a member elsewhere and the
-- demo drops out of view automatically.

create table if not exists public.demo_access (
  clerk_user_id text primary key,
  created_at timestamptz not null default now()
);

comment on table public.demo_access is
  'Signed-in users who opted into the read-only Khaya demo workspace.';

alter table public.demo_access enable row level security;

create policy demo_access_self_select on public.demo_access
  for select to authenticated
  using (clerk_user_id = public.jwt_subject());

create or replace function public.is_demo_viewer(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p_business_id = 'dbdbdbdb-0000-4000-8000-000000000001'::uuid
     and exists (
       select 1 from public.demo_access d
        where d.clerk_user_id = public.jwt_subject()
     )
     and not exists (
       select 1 from public.business_members bm
        where bm.clerk_user_id = public.jwt_subject()
     );
$$;

comment on function public.is_demo_viewer(uuid) is
  'True when the caller opted into the demo and has no business of their own.';

revoke all on function public.is_demo_viewer(uuid) from public;
grant execute on function public.is_demo_viewer(uuid) to authenticated;

create or replace function public.enter_demo()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_subject text := public.jwt_subject();
begin
  if v_subject is null then
    raise exception 'Not signed in';
  end if;
  insert into public.demo_access (clerk_user_id) values (v_subject)
  on conflict (clerk_user_id) do nothing;
end;
$$;

create or replace function public.leave_demo()
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  delete from public.demo_access where clerk_user_id = public.jwt_subject();
$$;

revoke all on function public.enter_demo() from public;
revoke all on function public.leave_demo() from public;
grant execute on function public.enter_demo() to authenticated;
grant execute on function public.leave_demo() to authenticated;

-- Additive read policies. Postgres ORs permissive policies per command, so
-- these only widen SELECT; every insert/update/delete rule stays members-only.
create policy businesses_demo_select on public.businesses
  for select to authenticated using (public.is_demo_viewer(id));

create policy whatsapp_numbers_demo_select on public.whatsapp_numbers
  for select to authenticated using (public.is_demo_viewer(business_id));

create policy calls_demo_select on public.calls
  for select to authenticated using (public.is_demo_viewer(business_id));

create policy transcripts_demo_select on public.transcripts
  for select to authenticated using (public.is_demo_viewer(business_id));

create policy transcript_segments_demo_select on public.transcript_segments
  for select to authenticated using (public.is_demo_viewer(business_id));

create policy action_items_demo_select on public.action_items
  for select to authenticated using (public.is_demo_viewer(business_id));

create policy tags_demo_select on public.tags
  for select to authenticated using (public.is_demo_viewer(business_id));

create policy transcript_tags_demo_select on public.transcript_tags
  for select to authenticated using (public.is_demo_viewer(business_id));

create policy meeting_decisions_demo_select on public.meeting_decisions
  for select to authenticated using (public.is_demo_viewer(business_id));

create policy meeting_follow_ups_demo_select on public.meeting_follow_ups
  for select to authenticated using (public.is_demo_viewer(business_id));

create policy business_contacts_demo_select on public.business_contacts
  for select to authenticated using (public.is_demo_viewer(business_id));
