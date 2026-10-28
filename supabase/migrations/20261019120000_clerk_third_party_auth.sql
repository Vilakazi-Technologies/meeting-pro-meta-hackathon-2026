-- Clerk as identity provider: map JWT `sub` to business_members.clerk_user_id.
-- Legacy Supabase Auth rows keep user_id; new Clerk users use clerk_user_id (user_id null).

alter table public.business_members
  add column if not exists clerk_user_id text;

create unique index if not exists business_members_clerk_user_id_key
  on public.business_members (clerk_user_id)
  where clerk_user_id is not null;

alter table public.business_members
  alter column user_id drop not null;

create or replace function public.jwt_subject()
returns text
language sql
stable
as $$
  select nullif(trim(coalesce(auth.jwt()->>'sub', '')), '');
$$;

comment on function public.jwt_subject() is
  'Clerk (or other third-party) user id from JWT sub claim.';

create or replace function public.is_business_member(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.business_members bm
    where bm.business_id = p_business_id
      and (
        (bm.user_id is not null and bm.user_id = auth.uid())
        or (bm.clerk_user_id is not null and bm.clerk_user_id = public.jwt_subject())
      )
  );
$$;

create or replace function public.is_business_admin(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.business_members bm
    where bm.business_id = p_business_id
      and bm.role in ('owner', 'admin')
      and (
        (bm.user_id is not null and bm.user_id = auth.uid())
        or (bm.clerk_user_id is not null and bm.clerk_user_id = public.jwt_subject())
      )
  );
$$;

drop policy if exists business_members_select on public.business_members;
create policy business_members_select on public.business_members
  for select to authenticated
  using (
    (user_id is not null and user_id = auth.uid())
    or (clerk_user_id is not null and clerk_user_id = public.jwt_subject())
    or public.is_business_member(business_id)
  );

drop policy if exists business_members_self_update on public.business_members;
create policy business_members_self_update on public.business_members
  for update to authenticated
  using (
    (user_id is not null and user_id = auth.uid())
    or (clerk_user_id is not null and clerk_user_id = public.jwt_subject())
  )
  with check (
    (user_id is not null and user_id = auth.uid())
    or (clerk_user_id is not null and clerk_user_id = public.jwt_subject())
  );
