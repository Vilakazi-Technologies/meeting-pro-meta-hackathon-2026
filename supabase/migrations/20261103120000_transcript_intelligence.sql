-- Structured meeting intelligence + processing jobs (P1 intelligence pipeline).

create type public.decision_kind as enum ('decision', 'agreement', 'unresolved', 'commitment');

create type public.ai_job_status as enum ('pending', 'running', 'ready', 'failed');
create type public.ai_job_type as enum ('summarize');

alter table public.transcripts
  add column if not exists executive_summary text,
  add column if not exists topics jsonb not null default '[]'::jsonb,
  add column if not exists sentiment_note text;

comment on column public.transcripts.executive_summary is
  'Short executive summary from the intelligence pass; null until summarisation succeeds.';
comment on column public.transcripts.topics is
  'Main discussion topics as a JSON array of strings from the intelligence pass.';
comment on column public.transcripts.sentiment_note is
  'Optional inferred sentiment read — not objective fact; shown with disclaimer in UI.';

create table if not exists public.meeting_decisions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  transcript_id uuid not null references public.transcripts(id) on delete cascade,
  text text not null check (btrim(text) <> ''),
  kind public.decision_kind not null default 'decision',
  is_ai_generated boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists meeting_decisions_transcript_id_idx
  on public.meeting_decisions (transcript_id);

create table if not exists public.meeting_follow_ups (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  transcript_id uuid not null references public.transcripts(id) on delete cascade,
  text text not null check (btrim(text) <> ''),
  owner text,
  due_hint text,
  status text not null default 'open' check (status in ('open', 'done')),
  is_ai_generated boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists meeting_follow_ups_transcript_id_idx
  on public.meeting_follow_ups (transcript_id);

create table if not exists public.ai_processing_jobs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  transcript_id uuid references public.transcripts(id) on delete cascade,
  job_type public.ai_job_type not null,
  status public.ai_job_status not null default 'pending',
  model text,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ai_processing_jobs_transcript_id_idx
  on public.ai_processing_jobs (transcript_id, created_at desc);

alter table public.meeting_decisions enable row level security;
alter table public.meeting_follow_ups enable row level security;
alter table public.ai_processing_jobs enable row level security;

create policy meeting_decisions_all on public.meeting_decisions
  for all to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy meeting_follow_ups_all on public.meeting_follow_ups
  for all to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy ai_processing_jobs_select on public.ai_processing_jobs
  for select to authenticated
  using (public.is_business_member(business_id));

drop function if exists public.apply_transcript_summary(uuid, text, text, text, jsonb);

create or replace function public.apply_transcript_summary(
  p_transcript_id uuid,
  p_title text,
  p_summary text,
  p_model text,
  p_action_items jsonb,
  p_executive_summary text default null,
  p_topics jsonb default '[]'::jsonb,
  p_decisions jsonb default '[]'::jsonb,
  p_follow_ups jsonb default '[]'::jsonb,
  p_sentiment_note text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
begin
  select business_id into v_business_id
    from public.transcripts
   where id = p_transcript_id
   for update;

  if v_business_id is null then
    raise exception 'transcript % not found', p_transcript_id
      using errcode = 'no_data_found';
  end if;

  delete from public.action_items
   where transcript_id = p_transcript_id
     and is_ai_generated;

  insert into public.action_items
    (business_id, transcript_id, text, owner, status, is_ai_generated)
  select v_business_id,
         p_transcript_id,
         btrim(item ->> 'text'),
         nullif(btrim(coalesce(item ->> 'owner', '')), ''),
         'open',
         true
    from jsonb_array_elements(coalesce(p_action_items, '[]'::jsonb)) as item
   where coalesce(btrim(item ->> 'text'), '') <> '';

  delete from public.meeting_decisions
   where transcript_id = p_transcript_id
     and is_ai_generated;

  insert into public.meeting_decisions (business_id, transcript_id, text, kind, is_ai_generated)
  select v_business_id,
         p_transcript_id,
         btrim(d ->> 'text'),
         (
           case lower(coalesce(nullif(btrim(d ->> 'kind'), ''), 'decision'))
             when 'agreement' then 'agreement'::public.decision_kind
             when 'unresolved' then 'unresolved'::public.decision_kind
             when 'commitment' then 'commitment'::public.decision_kind
             else 'decision'::public.decision_kind
           end
         ),
         true
    from jsonb_array_elements(coalesce(p_decisions, '[]'::jsonb)) as d
   where coalesce(btrim(d ->> 'text'), '') <> '';

  delete from public.meeting_follow_ups
   where transcript_id = p_transcript_id
     and is_ai_generated;

  insert into public.meeting_follow_ups
    (business_id, transcript_id, text, owner, due_hint, status, is_ai_generated)
  select v_business_id,
         p_transcript_id,
         btrim(f ->> 'text'),
         nullif(btrim(coalesce(f ->> 'owner', '')), ''),
         nullif(btrim(coalesce(f ->> 'due_hint', '')), ''),
         'open',
         true
    from jsonb_array_elements(coalesce(p_follow_ups, '[]'::jsonb)) as f
   where coalesce(btrim(f ->> 'text'), '') <> '';

  update public.transcripts
     set title = p_title,
         summary = p_summary,
         executive_summary = nullif(btrim(coalesce(p_executive_summary, '')), ''),
         topics = coalesce(p_topics, '[]'::jsonb),
         sentiment_note = nullif(btrim(coalesce(p_sentiment_note, '')), ''),
         summary_model = p_model,
         summarized_at = now(),
         summary_status = 'ready',
         summary_error = null
   where id = p_transcript_id;
end;
$$;

revoke all on function public.apply_transcript_summary(uuid, text, text, text, jsonb, text, jsonb, jsonb, jsonb, text) from public;
revoke all on function public.apply_transcript_summary(uuid, text, text, text, jsonb, text, jsonb, jsonb, jsonb, text) from anon;
revoke all on function public.apply_transcript_summary(uuid, text, text, text, jsonb, text, jsonb, jsonb, jsonb, text) from authenticated;
grant execute on function public.apply_transcript_summary(uuid, text, text, text, jsonb, text, jsonb, jsonb, jsonb, text) to service_role;
