-- =============================================================================
-- Meeting Pro — initial schema
-- =============================================================================
-- Multi-business (multi-tenant) from day one. Every business-owned table carries
-- business_id and is protected by row-level security.
--
-- Data flow this schema models:
--   WhatsApp call on a business number
--     -> Meta Cloud API transcribes it server-side after the call ends
--     -> Meta POSTs a `call_transcription_available` webhook to our Edge Function
--     -> we log the raw event, then fetch the transcript JSON (5-minute URL)
--     -> we normalise it into transcripts + transcript_segments
--
-- The mobile app is a read-only client. It never records or uploads audio.
-- v1 is transcription only: no recording is enabled, so no audio file is stored.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
-- pg_trgm powers fuzzy / substring search on transcript text. Installed into the
-- `extensions` schema per Supabase convention rather than into public.
create extension if not exists pg_trgm with schema extensions;


-- -----------------------------------------------------------------------------
-- Enum types
-- -----------------------------------------------------------------------------
-- Only values we control or that Meta documents explicitly are modelled as enums.
-- Anything whose vocabulary comes from Meta and is not yet confirmed is left as
-- text with a TODO, rather than guessed at.

create type public.member_role as enum ('owner', 'admin', 'member');

-- Meta documents exactly two call directions: business-initiated and user-initiated.
-- 'unknown' is ours, not Meta's. The call_transcription_available webhook carries
-- no direction field, and Meta gives no ordering guarantee between the lifecycle
-- and transcription webhooks (it retries for up to seven days). A transcript must
-- never be blocked from landing just because its lifecycle event has not arrived,
-- so the call row is created with 'unknown' and upgraded in place when the
-- lifecycle event turns up.
create type public.call_direction as enum ('business_initiated', 'user_initiated', 'unknown');

-- Our own pipeline state for a transcript, not Meta's.
create type public.transcript_status as enum (
  'pending',    -- webhook seen, transcript not fetched yet
  'fetching',   -- download in progress
  'ready',      -- text + segments stored
  'failed'      -- download or parse failed, see error on webhook_events
);

-- Our own workflow state for an action item, not Meta's.
create type public.action_item_status as enum ('open', 'done', 'cancelled');


-- -----------------------------------------------------------------------------
-- updated_at trigger helper
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- =============================================================================
-- 1. businesses — the tenant
-- =============================================================================
create table public.businesses (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (btrim(name) <> ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.businesses is
  'Tenant root. One row per customer business using Meeting Pro. Every other '
  'business-owned table references this via business_id. Created by us during '
  'onboarding; no Meta data lands here.';

create trigger businesses_set_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();


-- =============================================================================
-- 2. business_members — auth.users <-> businesses
-- =============================================================================
create table public.business_members (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        public.member_role not null default 'member',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (business_id, user_id)
);

comment on table public.business_members is
  'Membership join between Supabase auth users and businesses, with a role. This '
  'table is the source of truth for every RLS policy in the schema: a user can '
  'see a row only if they have a membership row for that row''s business_id.';

create index business_members_business_id_idx on public.business_members (business_id);
create index business_members_user_id_idx     on public.business_members (user_id);

create trigger business_members_set_updated_at
  before update on public.business_members
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- RLS helpers
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER so that policies on business_members can consult
-- business_members without triggering infinite RLS recursion.

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
      and bm.user_id = auth.uid()
  );
$$;

comment on function public.is_business_member(uuid) is
  'True when the current authenticated user is a member of the given business. '
  'SECURITY DEFINER to avoid recursive RLS evaluation on business_members.';

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
      and bm.user_id = auth.uid()
      and bm.role in ('owner', 'admin')
  );
$$;

comment on function public.is_business_admin(uuid) is
  'True when the current authenticated user is an owner or admin of the business. '
  'Used to gate membership and WhatsApp number management.';


-- =============================================================================
-- 3. whatsapp_numbers — Meta Cloud API numbers owned by a business
-- =============================================================================
create table public.whatsapp_numbers (
  id                      uuid primary key default gen_random_uuid(),
  business_id             uuid not null references public.businesses(id) on delete cascade,

  -- Identifiers from Meta. phone_number_id is the value used in the calling
  -- endpoint path: POST /<PHONE_NUMBER_ID>/calls
  waba_id                 text not null,
  phone_number_id         text not null unique,
  display_phone_number    text not null,

  -- The access token itself is NEVER stored here. This column holds the id of a
  -- secret in Supabase Vault (vault.secrets.id). Deliberately no foreign key:
  -- the vault schema is Supabase-managed and should not be coupled to app DDL.
  access_token_secret_id  uuid,

  is_active               boolean not null default true,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

comment on table public.whatsapp_numbers is
  'One row per WhatsApp Business phone number registered on Meta Cloud API for a '
  'business. Identifiers come from the Meta app configuration, not from webhooks. '
  'Access tokens are held in Supabase Vault and referenced by id only.';

comment on column public.whatsapp_numbers.access_token_secret_id is
  'vault.secrets.id of the Meta access token. Raw tokens must never be written to '
  'this table. Resolve via vault.decrypted_secrets from a service-role context only.';

comment on column public.whatsapp_numbers.phone_number_id is
  'Meta phone number id. Used as the path parameter for POST /<PHONE_NUMBER_ID>/calls '
  'and as the key for routing inbound webhooks to the owning business.';

create index whatsapp_numbers_business_id_idx on public.whatsapp_numbers (business_id);
create index whatsapp_numbers_waba_id_idx     on public.whatsapp_numbers (waba_id);

create trigger whatsapp_numbers_set_updated_at
  before update on public.whatsapp_numbers
  for each row execute function public.set_updated_at();


-- =============================================================================
-- 4. webhook_events — raw inbound Meta webhook log
-- =============================================================================
create table public.webhook_events (
  id                  uuid primary key default gen_random_uuid(),

  -- Nullable on purpose. A webhook is logged before the tenant is resolved, and
  -- an event for an unknown phone_number_id may never resolve to a business.
  -- Rows with a null business_id are invisible to every end user under RLS and
  -- are reachable only with the service role.
  business_id         uuid references public.businesses(id) on delete cascade,
  whatsapp_number_id  uuid references public.whatsapp_numbers(id) on delete set null,

  event_type          text not null,
  payload             jsonb not null,
  signature_verified  boolean not null default false,

  -- Routing identifiers lifted out of the envelope so an event can be attributed
  -- to a tenant without digging through jsonb.
  --   meta_waba_id         <- entry[].id
  --   meta_phone_number_id <- entry[].changes[].value.metadata.phone_number_id
  -- phone_number_id is the value that actually resolves the owning business, via
  -- whatsapp_numbers.phone_number_id.
  meta_waba_id         text,
  meta_phone_number_id text,

  received_at         timestamptz not null default now(),
  processed_at        timestamptz,
  error               text,

  -- Idempotency. Meta retries webhooks on non-2xx or timeout, and a retry resends
  -- an identical payload. The key is composed from three fields of the same call
  -- object:  <call id> ':' <event> ':' <timestamp>
  -- That is stable across retries while still allowing several distinct events
  -- (each with its own timestamp) to be recorded against one call.
  -- Meta's calls webhook carries no event id of its own, so this composite is the
  -- identity. The Edge Function builds it before insert and treats the unique
  -- violation as "already seen".
  dedupe_key          text not null unique
);

comment on table public.webhook_events is
  'Append-only log of every inbound webhook POST from Meta, stored before any '
  'interpretation. Holds the raw body verbatim so events can be replayed or '
  'audited. Written exclusively by the whatsapp-webhook Edge Function under the '
  'service role.';

comment on column public.webhook_events.dedupe_key is
  'Idempotency key, composed as <calls[].id>:<event>:<timestamp> from the call '
  'object. Meta''s calls webhook has no event id of its own; retries resend an '
  'identical payload, so this composite is stable per event while still allowing '
  'multiple distinct events on the same call. Populated by the Edge Function.';

comment on column public.webhook_events.meta_phone_number_id is
  'From value.metadata.phone_number_id. The routing key: joins to '
  'whatsapp_numbers.phone_number_id to attribute the event to a business.';

comment on column public.webhook_events.meta_waba_id is
  'From entry[].id — the WhatsApp Business Account id the event belongs to.';

comment on column public.webhook_events.signature_verified is
  'Whether the X-Hub-Signature-256 header validated against the app secret. '
  'Unverified events are recorded for forensics but must never be acted on.';

comment on column public.webhook_events.processed_at is
  'Set when the event has been fully handled. Null means still queued or failed; '
  'check the error column to distinguish.';

create index webhook_events_business_id_idx  on public.webhook_events (business_id);
create index webhook_events_number_id_idx    on public.webhook_events (whatsapp_number_id);
-- Routing lookup performed on every inbound event.
create index webhook_events_phone_number_idx on public.webhook_events (meta_phone_number_id);
create index webhook_events_waba_id_idx      on public.webhook_events (meta_waba_id);
create index webhook_events_event_type_idx   on public.webhook_events (event_type);
create index webhook_events_received_at_idx  on public.webhook_events (received_at desc);
create index webhook_events_payload_gin_idx  on public.webhook_events using gin (payload);

-- Partial index for the worker that drains unprocessed events.
create index webhook_events_unprocessed_idx
  on public.webhook_events (received_at)
  where processed_at is null;


-- =============================================================================
-- 5. calls — one row per WhatsApp call
-- =============================================================================
create table public.calls (
  id                    uuid primary key default gen_random_uuid(),
  business_id           uuid not null references public.businesses(id) on delete cascade,
  whatsapp_number_id    uuid references public.whatsapp_numbers(id) on delete set null,

  -- entry[].changes[].value.calls[].id — format "wacid.…".
  -- Globally unique across tenants: a Meta call id identifies exactly one call.
  meta_call_id          text not null unique,

  -- Not nullable: a row always states what is known, including that nothing is.
  -- 'unknown' means the lifecycle webhook has not been seen yet, not that the
  -- call had no direction. Expect it to be transient.
  direction             public.call_direction not null,

  -- The other party. For a user-initiated call this is the customer calling in.
  --   counterparty_bsuid        <- calls[].from_user_id
  --   counterparty_parent_bsuid <- calls[].from_parent_user_id
  --   counterparty_phone        <- calls[].from
  -- The phone number is NOT reliable: Meta omits `from` when the user has adopted
  -- a WhatsApp username. The business-scoped user id is the stable identifier and
  -- is what we index and join on.
  counterparty_bsuid        text,
  counterparty_parent_bsuid text,
  counterparty_phone        text,

  started_at            timestamptz,
  ended_at              timestamptz,
  duration_seconds      integer check (duration_seconds is null or duration_seconds >= 0),

  -- TODO(meta): call status vocabulary still unconfirmed. Deliberately free text
  -- rather than an invented enum — the enum will be derived from real payloads
  -- once we have observed them, then added in a follow-up migration.
  status                text,

  -- Whether we asked Meta to transcribe / record this call, i.e. what we sent in
  -- the `transcription` and `recording` objects on the call request.
  -- v1 sends transcription only; recording_enabled stays false.
  transcription_enabled boolean not null default false,
  recording_enabled     boolean not null default false,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  check (ended_at is null or started_at is null or ended_at >= started_at)
);

comment on table public.calls is
  'One row per WhatsApp call handled through the Meta Calling API. Populated from '
  'call lifecycle webhooks. The transcript arrives separately and later, via the '
  'call_transcription_available event. '
  'NOTE FOR INGEST: entry[].changes[].value.calls is an ARRAY — a single webhook '
  'POST can carry several call objects. The Edge Function must loop over it and '
  'upsert one row per element, not read calls[0].';

comment on column public.calls.direction is
  'business_initiated / user_initiated come from Meta. ''unknown'' is ours: it '
  'marks a call row created from a call_transcription_available webhook, which '
  'carries no direction field. The lifecycle webhook upgrades it in place when it '
  'arrives. A row left on ''unknown'' for long means a lifecycle event was lost.';

comment on column public.calls.meta_call_id is
  'Meta''s identifier for the call, from entry[].changes[].value.calls[].id, '
  'formatted "wacid.…". Unique across all tenants; correlates the lifecycle '
  'webhooks with the transcription webhook.';

comment on column public.calls.counterparty_bsuid is
  'Business-scoped user id from calls[].from_user_id. The reliable identifier for '
  'the other party — prefer this over the phone number everywhere.';

comment on column public.calls.counterparty_parent_bsuid is
  'From calls[].from_parent_user_id.';

comment on column public.calls.counterparty_phone is
  'From calls[].from. Nullable by design: Meta omits this field when the user has '
  'adopted a WhatsApp username. Never treat it as the primary identifier.';

comment on column public.calls.transcription_enabled is
  'Reflects the transcription object sent on the call request. Meta plays a '
  'mandatory audible consent announcement whenever this is true; it cannot be '
  'suppressed.';

comment on column public.calls.recording_enabled is
  'Reflects the recording object sent on the call request. False for all of v1 — '
  'we do not record audio, so no media is stored.';

create index calls_business_id_idx      on public.calls (business_id);
create index calls_number_id_idx        on public.calls (whatsapp_number_id);
create index calls_status_idx           on public.calls (status);
create index calls_direction_idx        on public.calls (direction);
-- Primary archive sort: a business's calls, newest first.
create index calls_business_started_idx on public.calls (business_id, started_at desc);
-- Indexed on the business-scoped user id, not the phone, since `from` may be absent.
create index calls_counterparty_bsuid_idx on public.calls (business_id, counterparty_bsuid);

create trigger calls_set_updated_at
  before update on public.calls
  for each row execute function public.set_updated_at();


-- =============================================================================
-- 6. transcripts — one per call
-- =============================================================================
create table public.transcripts (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references public.businesses(id) on delete cascade,
  call_id           uuid not null unique references public.calls(id) on delete cascade,

  -- From the webhook envelope: call_transcript.document.{id,sha256}
  -- The download URL is intentionally not stored: it expires in 5 minutes and a
  -- fresh one is obtained from the Media API using meta_media_id when needed.
  meta_media_id     text,
  media_sha256      text,

  -- From the transcript JSON body: transcript.{language,confidence,duration,text}
  language          text,
  confidence        numeric(5, 4) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  duration_seconds  numeric(10, 3) check (duration_seconds is null or duration_seconds >= 0),
  full_text         text,

  -- The complete document exactly as Meta returned it, including metadata.audio.*
  -- and the untouched segments array. Kept so we can re-derive normalised rows
  -- without re-fetching, which matters because Meta deletes media after 7 days.
  raw               jsonb,

  fetched_at        timestamptz,
  status            public.transcript_status not null default 'pending',

  -- Summaries are ours, not Meta's. Meta returns transcripts only.
  summary           text,
  summary_model     text,
  summarized_at     timestamptz,

  -- Full-text search over the transcript body and summary, powering the archive.
  -- Uses the 'simple' configuration, not 'english': the SA market is English and
  -- Afrikaans with heavy code-switching, and English stemming produces wrong stems
  -- on Afrikaans. 'simple' does no stemming, so it treats both fairly.
  search_vector     tsvector generated always as (
                      to_tsvector(
                        'simple',
                        coalesce(full_text, '') || ' ' || coalesce(summary, '')
                      )
                    ) stored,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.transcripts is
  'One transcript per call, produced server-side by Meta and delivered via the '
  'call_transcription_available webhook. Holds both the flattened fields we query '
  'and the complete raw document. Meta deletes the source media after 7 days, so '
  'this table is the durable copy.';

comment on column public.transcripts.raw is
  'Verbatim transcript document from Meta: metadata (processed_at, audio duration, '
  'sample_rate, channels, audio_format) plus the full transcript object including '
  'the segments array with word-level timings.';

comment on column public.transcripts.meta_media_id is
  'Media asset id from call_transcript.document.id. Use with the Media API to mint '
  'a fresh download URL; the URL in the webhook expires after 5 minutes.';

comment on column public.transcripts.summary is
  'LLM-generated summary. Meta does not provide summaries — this is produced by a '
  'later pipeline step, which is why summary_model and summarized_at are tracked.';

comment on column public.transcripts.search_vector is
  'Generated tsvector over full_text and summary for archive search. Uses the '
  '''simple'' configuration deliberately: the market is English/Afrikaans with heavy '
  'code-switching, and English stemming mangles Afrikaans. ''simple'' does no '
  'stemming. A generated column also requires an immutable expression, so the '
  'config cannot vary by the detected language column in any case.';

create index transcripts_business_id_idx    on public.transcripts (business_id);
create index transcripts_call_id_idx        on public.transcripts (call_id);
create index transcripts_status_idx         on public.transcripts (status);
create index transcripts_language_idx       on public.transcripts (language);
create index transcripts_business_created_idx on public.transcripts (business_id, created_at desc);
create index transcripts_search_idx         on public.transcripts using gin (search_vector);
-- Trigram index for fuzzy and substring matching, complementing the tsvector
-- above. Handles partial words, misspellings and mid-word matches that
-- token-based full-text search cannot.
create index transcripts_full_text_trgm_idx on public.transcripts
  using gin (full_text extensions.gin_trgm_ops);

create trigger transcripts_set_updated_at
  before update on public.transcripts
  for each row execute function public.set_updated_at();


-- =============================================================================
-- 7. transcript_segments — Meta's segments array, normalised
-- =============================================================================
create table public.transcript_segments (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references public.businesses(id) on delete cascade,
  transcript_id  uuid not null references public.transcripts(id) on delete cascade,

  -- Ordinal position within the segments array, assigned by us on ingest.
  segment_index  integer not null check (segment_index >= 0),
  -- Meta's own id for the segment, from segments[].id.
  meta_segment_id text,

  -- segments[].speaker and segments[].channel. Meta documents channel 0 as the
  -- business side and channel 1 as the WhatsApp user.
  speaker        text,
  channel        smallint check (channel is null or channel in (0, 1)),

  start_seconds  numeric(10, 3) check (start_seconds is null or start_seconds >= 0),
  end_seconds    numeric(10, 3) check (end_seconds is null or end_seconds >= 0),
  text           text,
  confidence     numeric(5, 4) check (confidence is null or (confidence >= 0 and confidence <= 1)),

  -- segments[].words kept whole: per-word text, timings and confidence scores.
  -- Not normalised further because we only ever read it as a block, for playback
  -- alignment and highlighting.
  words          jsonb,

  created_at     timestamptz not null default now(),

  unique (transcript_id, segment_index),
  check (end_seconds is null or start_seconds is null or end_seconds >= start_seconds)
);

comment on table public.transcript_segments is
  'Normalised rows from the segments array of Meta''s transcript document. One row '
  'per spoken segment, carrying speaker attribution and timing. Enables speaker '
  'filtering and seeking without parsing the raw jsonb on every read.';

comment on column public.transcript_segments.channel is
  'Meta channel index: 0 = business side, 1 = WhatsApp user. This is how speaker '
  'separation is delivered — we do not run diarization ourselves.';

comment on column public.transcript_segments.words is
  'The segments[].words array verbatim: word-level text, start/end timings and '
  'per-word confidence scores.';

create index transcript_segments_transcript_idx on public.transcript_segments (transcript_id, segment_index);
create index transcript_segments_business_idx   on public.transcript_segments (business_id);
create index transcript_segments_channel_idx    on public.transcript_segments (transcript_id, channel);


-- =============================================================================
-- 8. action_items
-- =============================================================================
create table public.action_items (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references public.businesses(id) on delete cascade,
  transcript_id   uuid not null references public.transcripts(id) on delete cascade,

  text            text not null check (btrim(text) <> ''),
  -- Free text rather than a user reference: these come out of an LLM reading a
  -- transcript, where the owner is typically a spoken name with no account.
  owner           text,
  due_date        date,
  status          public.action_item_status not null default 'open',

  -- True when extracted by the LLM pass, false when a person typed it in the app.
  is_ai_generated boolean not null default false,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.action_items is
  'Follow-up tasks attached to a transcript. Either extracted by the LLM '
  'summarisation pass or added by a user in the app; is_ai_generated distinguishes '
  'them. Meta provides nothing here.';

comment on column public.action_items.owner is
  'Free-text owner, usually a name spoken during the call. Not a user reference, '
  'because the named person generally has no account.';

create index action_items_business_id_idx   on public.action_items (business_id);
create index action_items_transcript_id_idx on public.action_items (transcript_id);
create index action_items_status_idx        on public.action_items (business_id, status);
create index action_items_due_date_idx      on public.action_items (business_id, due_date)
  where due_date is not null;

create trigger action_items_set_updated_at
  before update on public.action_items
  for each row execute function public.set_updated_at();


-- =============================================================================
-- 9. tags + transcript_tags
-- =============================================================================
create table public.tags (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name        text not null check (btrim(name) <> ''),
  -- Optional display colour for the tag chips in the app UI.
  color       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (business_id, name)
);

comment on table public.tags is
  'Per-business tag vocabulary. Tags are scoped to a business so two tenants can '
  'independently use the same label. Created by users, not derived from Meta.';

create index tags_business_id_idx on public.tags (business_id);

create trigger tags_set_updated_at
  before update on public.tags
  for each row execute function public.set_updated_at();


create table public.transcript_tags (
  transcript_id uuid not null references public.transcripts(id) on delete cascade,
  tag_id        uuid not null references public.tags(id) on delete cascade,
  -- Denormalised from the parent rows purely so RLS can be evaluated on this
  -- table without a join.
  business_id   uuid not null references public.businesses(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (transcript_id, tag_id)
);

comment on table public.transcript_tags is
  'Many-to-many join between transcripts and tags. business_id is denormalised '
  'from both parents so row-level security can be enforced directly.';

create index transcript_tags_tag_id_idx      on public.transcript_tags (tag_id);
create index transcript_tags_business_id_idx on public.transcript_tags (business_id);


-- =============================================================================
-- Row-level security
-- =============================================================================
-- Enabled on every table. The service role used by Edge Functions bypasses RLS,
-- so ingestion is unaffected; these policies govern what the app's authenticated
-- users can reach.

alter table public.businesses          enable row level security;
alter table public.business_members    enable row level security;
alter table public.whatsapp_numbers    enable row level security;
alter table public.webhook_events      enable row level security;
alter table public.calls               enable row level security;
alter table public.transcripts         enable row level security;
alter table public.transcript_segments enable row level security;
alter table public.action_items        enable row level security;
alter table public.tags                enable row level security;
alter table public.transcript_tags     enable row level security;


-- businesses ------------------------------------------------------------------
create policy businesses_select on public.businesses
  for select to authenticated
  using (public.is_business_member(id));

create policy businesses_update on public.businesses
  for update to authenticated
  using (public.is_business_admin(id))
  with check (public.is_business_admin(id));

-- No insert/delete policy: businesses are created and removed by the service role
-- during onboarding, never by an end user.


-- business_members ------------------------------------------------------------
-- A user always sees their own membership rows, plus all members of any business
-- they belong to. Both branches go through the SECURITY DEFINER helper to keep
-- the policy from recursing into this same table.
create policy business_members_select on public.business_members
  for select to authenticated
  using (user_id = auth.uid() or public.is_business_member(business_id));

create policy business_members_admin_write on public.business_members
  for all to authenticated
  using (public.is_business_admin(business_id))
  with check (public.is_business_admin(business_id));


-- whatsapp_numbers ------------------------------------------------------------
create policy whatsapp_numbers_select on public.whatsapp_numbers
  for select to authenticated
  using (public.is_business_member(business_id));

create policy whatsapp_numbers_admin_write on public.whatsapp_numbers
  for all to authenticated
  using (public.is_business_admin(business_id))
  with check (public.is_business_admin(business_id));


-- webhook_events --------------------------------------------------------------
-- Read-only for users, and only for events already attributed to their business.
-- Unattributed rows (null business_id) are visible to the service role alone.
-- Writes are service-role only: no insert/update/delete policy exists.
create policy webhook_events_select on public.webhook_events
  for select to authenticated
  using (business_id is not null and public.is_business_member(business_id));


-- calls -----------------------------------------------------------------------
-- Ingested by Edge Functions under the service role, so users get read-only access.
create policy calls_select on public.calls
  for select to authenticated
  using (public.is_business_member(business_id));


-- transcripts -----------------------------------------------------------------
create policy transcripts_select on public.transcripts
  for select to authenticated
  using (public.is_business_member(business_id));

-- Row-level check for updates. Which COLUMNS may be written is enforced separately
-- by column-level privileges at the foot of this file — RLS policies cannot express
-- that on their own.
create policy transcripts_update on public.transcripts
  for update to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));


-- transcript_segments ---------------------------------------------------------
create policy transcript_segments_select on public.transcript_segments
  for select to authenticated
  using (public.is_business_member(business_id));


-- action_items ----------------------------------------------------------------
-- Full CRUD: users manage these directly in the app.
create policy action_items_all on public.action_items
  for all to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));


-- tags ------------------------------------------------------------------------
create policy tags_all on public.tags
  for all to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));


-- transcript_tags -------------------------------------------------------------
create policy transcript_tags_all on public.transcript_tags
  for all to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));


-- =============================================================================
-- Column-level privileges
-- =============================================================================
-- RLS decides WHICH ROWS a user may touch; it cannot restrict WHICH COLUMNS.
-- Transcript ingest fields (full_text, raw, segments metadata, Meta identifiers)
-- are written only by Edge Functions under the service role and must be immutable
-- from the client, otherwise a user with a valid session could overwrite the
-- record of what was actually said.
--
-- Supabase grants ALL on new public tables to `authenticated` by default, so the
-- table-wide UPDATE is revoked and re-granted on the summary columns alone. The
-- transcripts_update RLS policy above still applies on top of this, so a user can
-- write these columns only on rows belonging to their own business.
revoke update on public.transcripts from authenticated;
grant  update (summary, summary_model, summarized_at)
  on public.transcripts to authenticated;
