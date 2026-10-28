-- Business contacts (people you regularly work with on WhatsApp calls).
-- Matched to call counterparty_phone when transcripts arrive from Meta webhooks.

create table public.business_contacts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  display_name text not null check (btrim(display_name) <> ''),
  phone text not null check (btrim(phone) <> ''),
  email text,
  company text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, phone)
);

create index business_contacts_business_id_idx on public.business_contacts (business_id);
create index business_contacts_phone_idx on public.business_contacts (business_id, phone);

create trigger business_contacts_set_updated_at
  before update on public.business_contacts
  for each row execute function public.set_updated_at();

alter table public.business_contacts enable row level security;

create policy business_contacts_all on public.business_contacts
  for all to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

-- Email meeting minutes after each summarised call.
alter table public.business_members
  add column if not exists email_minutes_enabled boolean not null default true,
  add column if not exists meeting_minutes_email text;

comment on column public.business_members.meeting_minutes_email is
  'Override inbox for meeting minutes; null uses auth.users email.';
