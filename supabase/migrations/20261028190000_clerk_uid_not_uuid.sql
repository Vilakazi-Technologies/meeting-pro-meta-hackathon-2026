-- Clerk user ids (user_…) are not UUIDs. auth.uid() casts JWT sub to uuid and
-- raises "invalid input syntax for type uuid" on every RLS check. Compare
-- clerk_user_id to the text subject, and only cast when sub is actually a uuid.

create or replace function public.auth_user_id()
returns uuid
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  sub text;
begin
  sub := public.jwt_subject();
  if sub is null
     or sub !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return null;
  end if;
  return sub::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

comment on function public.auth_user_id() is
  'auth.uid() that returns null for Clerk subjects instead of raising.';

revoke all on function public.auth_user_id() from public;
grant execute on function public.auth_user_id() to authenticated, service_role;

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
        (bm.clerk_user_id is not null and bm.clerk_user_id = public.jwt_subject())
        or (bm.user_id is not null and bm.user_id = public.auth_user_id())
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
        (bm.clerk_user_id is not null and bm.clerk_user_id = public.jwt_subject())
        or (bm.user_id is not null and bm.user_id = public.auth_user_id())
      )
  );
$$;

drop policy if exists business_members_select on public.business_members;
create policy business_members_select on public.business_members
  for select to authenticated
  using (
    (clerk_user_id is not null and clerk_user_id = public.jwt_subject())
    or (user_id is not null and user_id = public.auth_user_id())
    or public.is_business_member(business_id)
  );

drop policy if exists business_members_self_update on public.business_members;
create policy business_members_self_update on public.business_members
  for update to authenticated
  using (
    (clerk_user_id is not null and clerk_user_id = public.jwt_subject())
    or (user_id is not null and user_id = public.auth_user_id())
  )
  with check (
    (clerk_user_id is not null and clerk_user_id = public.jwt_subject())
    or (user_id is not null and user_id = public.auth_user_id())
  );
