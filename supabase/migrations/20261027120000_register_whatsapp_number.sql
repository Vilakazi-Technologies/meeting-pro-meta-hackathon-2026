-- Self-service WhatsApp number linking for signed-in Clerk users (hackathon demo).

create or replace function public.register_whatsapp_number(
  p_display_phone text,
  p_phone_number_id text,
  p_waba_id text,
  p_business_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_subject text := public.jwt_subject();
  v_business_id uuid;
  v_number_id uuid;
  v_digits text;
begin
  if v_subject is null then
    raise exception 'Not signed in';
  end if;

  v_digits := regexp_replace(coalesce(p_display_phone, ''), '\D', '', 'g');
  if length(v_digits) < 8 then
    raise exception 'Enter a valid business phone number (digits only, with country code)';
  end if;
  if coalesce(trim(p_phone_number_id), '') = '' or coalesce(trim(p_waba_id), '') = '' then
    raise exception 'Phone number ID and WABA ID are required from Meta API Setup';
  end if;

  select bm.business_id
  into v_business_id
  from public.business_members bm
  where bm.clerk_user_id = v_subject
  order by bm.created_at asc nulls last
  limit 1;

  if v_business_id is null then
    insert into public.businesses (name)
    values (coalesce(nullif(trim(p_business_name), ''), 'VILATECH workspace'))
    returning id into v_business_id;

    insert into public.business_members (business_id, clerk_user_id, role)
    values (v_business_id, v_subject, 'owner');
  elsif p_business_name is not null and trim(p_business_name) <> '' then
    update public.businesses
    set name = trim(p_business_name)
    where id = v_business_id
      and public.is_business_admin(v_business_id);
  end if;

  update public.whatsapp_numbers
  set is_active = false, updated_at = now()
  where business_id = v_business_id;

  insert into public.whatsapp_numbers (
    business_id,
    waba_id,
    phone_number_id,
    display_phone_number,
    is_active
  )
  values (
    v_business_id,
    trim(p_waba_id),
    trim(p_phone_number_id),
    v_digits,
    true
  )
  on conflict (phone_number_id) do update
  set
    business_id = excluded.business_id,
    waba_id = excluded.waba_id,
    display_phone_number = excluded.display_phone_number,
    is_active = true,
    updated_at = now()
  returning id into v_number_id;

  return v_number_id;
end;
$$;

comment on function public.register_whatsapp_number is
  'Creates a workspace for new Clerk users and links a Meta Cloud API WhatsApp number.';

revoke all on function public.register_whatsapp_number from public;
grant execute on function public.register_whatsapp_number to authenticated;
