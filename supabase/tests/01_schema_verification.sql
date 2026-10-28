-- =============================================================================
-- Meeting Pro — schema verification
-- =============================================================================
-- Covers: RLS tenant isolation, column-level privilege split, webhook idempotency,
-- and full-text + trigram search.
--
-- SAFE TO RUN AGAINST A REAL PROJECT. Everything happens inside a single
-- transaction that ends in ROLLBACK, so no seed data survives. The temp table
-- holding results is ON COMMIT DROP and dies with the rollback too.
--
-- Run with:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/01_schema_verification.sql
--
-- Must connect as a superuser/owner role (postgres). Seeding deliberately relies
-- on BYPASSRLS; the isolation checks then drop to the real `authenticated` role.
-- =============================================================================

\set ON_ERROR_STOP on
\timing off

begin;

-- -----------------------------------------------------------------------------
-- Result collector
-- -----------------------------------------------------------------------------
create temp table _results (
  seq      serial,
  section  text,
  check_name text,
  passed   boolean,
  detail   text
) on commit drop;

-- The isolation checks run as `authenticated`, which must be able to record its
-- own results.
grant all on _results to public;
grant all on sequence _results_seq_seq to public;

create or replace function pg_temp.record(
  p_section text, p_check text, p_passed boolean, p_detail text default null
) returns void language sql as $$
  insert into _results (section, check_name, passed, detail)
  values (p_section, p_check, p_passed, p_detail);
$$;

grant execute on function pg_temp.record(text, text, boolean, text) to public;


-- =============================================================================
-- SEED  (as the connecting superuser — bypasses RLS by design)
-- =============================================================================
-- Two fully independent tenants. Every business-owned table gets a row for each,
-- so "zero rows from the other tenant" is a meaningful assertion everywhere.

-- Deterministic ids so assertions can reference them directly.
--   A = business A / user A,  B = business B / user B
insert into auth.users (id, instance_id, aud, role, email)
values
  ('aaaaaaaa-1111-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'user-a@meetingpro-test.invalid'),
  ('bbbbbbbb-1111-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'user-b@meetingpro-test.invalid');

insert into public.businesses (id, name) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Test Business A'),
  ('bbbbbbbb-0000-4000-8000-000000000001', 'Test Business B');

insert into public.business_members (business_id, user_id, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001', 'owner'),
  ('bbbbbbbb-0000-4000-8000-000000000001', 'bbbbbbbb-1111-4000-8000-000000000001', 'owner');

insert into public.whatsapp_numbers
  (id, business_id, waba_id, phone_number_id, display_phone_number)
values
  ('aaaaaaaa-2222-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001',
   'WABA_A', 'PNID_A', '+27110000001'),
  ('bbbbbbbb-2222-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001',
   'WABA_B', 'PNID_B', '+27110000002');

insert into public.webhook_events
  (business_id, whatsapp_number_id, meta_waba_id, meta_phone_number_id,
   event_type, payload, signature_verified, dedupe_key)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-2222-4000-8000-000000000001',
   'WABA_A', 'PNID_A', 'call_transcription_available', '{"seed":"A"}'::jsonb, true,
   'wacid.AAA:call_transcription_available:1700000000'),
  ('bbbbbbbb-0000-4000-8000-000000000001', 'bbbbbbbb-2222-4000-8000-000000000001',
   'WABA_B', 'PNID_B', 'call_transcription_available', '{"seed":"B"}'::jsonb, true,
   'wacid.BBB:call_transcription_available:1700000000');

insert into public.calls
  (id, business_id, whatsapp_number_id, meta_call_id, direction,
   counterparty_bsuid, counterparty_parent_bsuid, counterparty_phone,
   started_at, ended_at, duration_seconds, status, transcription_enabled)
values
  ('aaaaaaaa-3333-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001',
   'aaaaaaaa-2222-4000-8000-000000000001', 'wacid.AAA', 'user_initiated',
   'BSUID_A', 'PARENT_BSUID_A', '+27820000001',
   now() - interval '1 hour', now() - interval '30 minutes', 1800, 'COMPLETED', true),
  ('bbbbbbbb-3333-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001',
   'bbbbbbbb-2222-4000-8000-000000000001', 'wacid.BBB', 'business_initiated',
   'BSUID_B', 'PARENT_BSUID_B', null,
   now() - interval '2 hour', now() - interval '90 minutes', 1800, 'COMPLETED', true);

-- Transcript A carries the search fixtures:
--   'reconciliation' lives in full_text
--   'zebra'          lives in summary   (proves the summary is in search_vector)
--   'conciliat'      is a substring of reconciliation that tokenised FTS cannot match
insert into public.transcripts
  (id, business_id, call_id, meta_media_id, media_sha256, language, confidence,
   duration_seconds, full_text, raw, fetched_at, status, summary, summary_model,
   summarized_at)
values
  ('aaaaaaaa-4444-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001',
   'aaaaaaaa-3333-4000-8000-000000000001', 'MEDIA_A', 'sha256-A', 'en', 0.9412,
   1800.000,
   'The quarterly reconciliation with Ntokozo covered outstanding invoices.',
   '{"seed":"A"}'::jsonb, now(), 'ready',
   'Follow up on the outstanding zebra payment.', 'test-model', now()),
  ('bbbbbbbb-4444-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001',
   'bbbbbbbb-3333-4000-8000-000000000001', 'MEDIA_B', 'sha256-B', 'en', 0.8800,
   1800.000,
   'Business B private transcript text.',
   '{"seed":"B"}'::jsonb, now(), 'ready',
   'Business B private summary.', 'test-model', now());

insert into public.transcript_segments
  (business_id, transcript_id, segment_index, meta_segment_id, speaker, channel,
   start_seconds, end_seconds, text, confidence, words)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-4444-4000-8000-000000000001',
   0, 'seg-a-0', 'Business', 0, 0.000, 5.500, 'Good morning, thanks for calling.',
   0.9700, '[{"word":"Good","start":0.0,"end":0.4,"confidence":0.99}]'::jsonb),
  ('aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-4444-4000-8000-000000000001',
   1, 'seg-a-1', 'Customer', 1, 5.500, 11.250, 'Morning, I am calling about the invoice.',
   0.9500, '[{"word":"Morning","start":5.5,"end":6.0,"confidence":0.98}]'::jsonb),
  ('bbbbbbbb-0000-4000-8000-000000000001', 'bbbbbbbb-4444-4000-8000-000000000001',
   0, 'seg-b-0', 'Business', 0, 0.000, 4.000, 'Business B segment one.',
   0.9100, '[]'::jsonb),
  ('bbbbbbbb-0000-4000-8000-000000000001', 'bbbbbbbb-4444-4000-8000-000000000001',
   1, 'seg-b-1', 'Customer', 1, 4.000, 9.000, 'Business B segment two.',
   0.9200, '[]'::jsonb);

insert into public.action_items
  (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-4444-4000-8000-000000000001',
   'Send revised invoice', 'Sarah', current_date + 3, 'open', true),
  ('bbbbbbbb-0000-4000-8000-000000000001', 'bbbbbbbb-4444-4000-8000-000000000001',
   'Business B action item', 'Thabo', current_date + 5, 'open', true);

insert into public.tags (id, business_id, name, color) values
  ('aaaaaaaa-5555-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'invoices', '#22C55E'),
  ('bbbbbbbb-5555-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', 'invoices', '#EF4444');

insert into public.transcript_tags (transcript_id, tag_id, business_id) values
  ('aaaaaaaa-4444-4000-8000-000000000001', 'aaaaaaaa-5555-4000-8000-000000000001',
   'aaaaaaaa-0000-4000-8000-000000000001'),
  ('bbbbbbbb-4444-4000-8000-000000000001', 'bbbbbbbb-5555-4000-8000-000000000001',
   'bbbbbbbb-0000-4000-8000-000000000001');

select pg_temp.record('seed', 'two tenants seeded', true,
  'businesses, members, numbers, webhook_events, calls, transcripts, segments, action_items, tags, transcript_tags');


-- =============================================================================
-- TEST 1 — RLS isolation, as a genuine `authenticated` user
-- =============================================================================
-- Dropping to the authenticated role is what makes this test meaningful: as
-- postgres (BYPASSRLS) every policy would pass trivially. auth.uid() reads the
-- sub claim out of request.jwt.claims, so the GUC is what identifies the user.

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-1111-4000-8000-000000000001","role":"authenticated"}';

-- Sanity: the role and identity actually took effect. If either of these is
-- wrong, every isolation result below is meaningless.
select pg_temp.record('rls', 'session role is authenticated',
  current_user = 'authenticated', 'current_user=' || current_user);

select pg_temp.record('rls', 'auth.uid() resolves to user A',
  auth.uid() = 'aaaaaaaa-1111-4000-8000-000000000001'::uuid,
  'auth.uid()=' || coalesce(auth.uid()::text, '<null>'));

-- Own rows visible, other tenant's rows invisible — checked table by table.
select pg_temp.record('rls', 'businesses',
  (select count(*) from public.businesses) = 1
  and (select count(*) from public.businesses
       where id = 'bbbbbbbb-0000-4000-8000-000000000001') = 0,
  'visible=' || (select count(*) from public.businesses)::text || ' (expect 1, 0 from B)');

select pg_temp.record('rls', 'business_members',
  (select count(*) from public.business_members) = 1
  and (select count(*) from public.business_members
       where business_id = 'bbbbbbbb-0000-4000-8000-000000000001') = 0,
  'visible=' || (select count(*) from public.business_members)::text);

select pg_temp.record('rls', 'whatsapp_numbers',
  (select count(*) from public.whatsapp_numbers) = 1
  and (select count(*) from public.whatsapp_numbers
       where business_id = 'bbbbbbbb-0000-4000-8000-000000000001') = 0,
  'visible=' || (select count(*) from public.whatsapp_numbers)::text);

select pg_temp.record('rls', 'webhook_events',
  (select count(*) from public.webhook_events) = 1
  and (select count(*) from public.webhook_events
       where business_id = 'bbbbbbbb-0000-4000-8000-000000000001') = 0,
  'visible=' || (select count(*) from public.webhook_events)::text);

select pg_temp.record('rls', 'calls',
  (select count(*) from public.calls) = 1
  and (select count(*) from public.calls
       where business_id = 'bbbbbbbb-0000-4000-8000-000000000001') = 0,
  'visible=' || (select count(*) from public.calls)::text);

select pg_temp.record('rls', 'transcripts',
  (select count(*) from public.transcripts) = 1
  and (select count(*) from public.transcripts
       where business_id = 'bbbbbbbb-0000-4000-8000-000000000001') = 0,
  'visible=' || (select count(*) from public.transcripts)::text);

select pg_temp.record('rls', 'transcript_segments',
  (select count(*) from public.transcript_segments) = 2
  and (select count(*) from public.transcript_segments
       where business_id = 'bbbbbbbb-0000-4000-8000-000000000001') = 0,
  'visible=' || (select count(*) from public.transcript_segments)::text || ' (expect 2)');

select pg_temp.record('rls', 'action_items',
  (select count(*) from public.action_items) = 1
  and (select count(*) from public.action_items
       where business_id = 'bbbbbbbb-0000-4000-8000-000000000001') = 0,
  'visible=' || (select count(*) from public.action_items)::text);

select pg_temp.record('rls', 'tags',
  (select count(*) from public.tags) = 1
  and (select count(*) from public.tags
       where business_id = 'bbbbbbbb-0000-4000-8000-000000000001') = 0,
  'visible=' || (select count(*) from public.tags)::text);

select pg_temp.record('rls', 'transcript_tags',
  (select count(*) from public.transcript_tags) = 1
  and (select count(*) from public.transcript_tags
       where business_id = 'bbbbbbbb-0000-4000-8000-000000000001') = 0,
  'visible=' || (select count(*) from public.transcript_tags)::text);

-- Targeted read of B's transcript by primary key: must return nothing.
select pg_temp.record('rls', 'direct fetch of B transcript by id blocked',
  (select count(*) from public.transcripts
   where id = 'bbbbbbbb-4444-4000-8000-000000000001') = 0,
  'rows returned for B transcript id');


-- ---- Same checks from user B's perspective, to prove isolation is symmetric --
set local request.jwt.claims = '{"sub":"bbbbbbbb-1111-4000-8000-000000000001","role":"authenticated"}';

select pg_temp.record('rls', 'user B sees only own business',
  (select count(*) from public.businesses) = 1
  and (select count(*) from public.businesses
       where id = 'bbbbbbbb-0000-4000-8000-000000000001') = 1,
  'visible=' || (select count(*) from public.businesses)::text);

select pg_temp.record('rls', 'user B cannot see A transcript',
  (select count(*) from public.transcripts
   where business_id = 'aaaaaaaa-0000-4000-8000-000000000001') = 0,
  'A-owned transcripts visible to B');

-- ---- A user with no membership at all sees nothing -------------------------
set local request.jwt.claims = '{"sub":"cccccccc-1111-4000-8000-000000000001","role":"authenticated"}';

select pg_temp.record('rls', 'non-member sees zero rows everywhere',
  (select count(*) from public.businesses) = 0
  and (select count(*) from public.calls) = 0
  and (select count(*) from public.transcripts) = 0
  and (select count(*) from public.transcript_segments) = 0
  and (select count(*) from public.action_items) = 0,
  'all counts expected 0');

reset role;


-- =============================================================================
-- TEST 2 — column-level privilege split on transcripts
-- =============================================================================
-- RLS says which rows; column grants say which columns. Both must hold.

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-1111-4000-8000-000000000001","role":"authenticated"}';

do $$
begin
  update public.transcripts
     set summary = 'Edited summary from the app',
         summary_model = 'manual',
         summarized_at = now()
   where id = 'aaaaaaaa-4444-4000-8000-000000000001';
  perform pg_temp.record('privileges', 'UPDATE summary allowed', true,
    'update succeeded as authenticated member');
exception when others then
  perform pg_temp.record('privileges', 'UPDATE summary allowed', false,
    'unexpected ' || sqlstate || ': ' || sqlerrm);
end $$;

do $$
begin
  update public.transcripts
     set full_text = 'TAMPERED — should never be written by a client'
   where id = 'aaaaaaaa-4444-4000-8000-000000000001';
  perform pg_temp.record('privileges', 'UPDATE full_text rejected', false,
    'SECURITY HOLE: update to full_text was permitted');
exception
  when insufficient_privilege then
    perform pg_temp.record('privileges', 'UPDATE full_text rejected', true,
      'blocked with 42501: ' || sqlerrm);
  when others then
    perform pg_temp.record('privileges', 'UPDATE full_text rejected', false,
      'blocked, but with unexpected ' || sqlstate || ': ' || sqlerrm);
end $$;

-- The ingest columns must be equally protected.
do $$
begin
  update public.transcripts set raw = '{"tampered":true}'::jsonb
   where id = 'aaaaaaaa-4444-4000-8000-000000000001';
  perform pg_temp.record('privileges', 'UPDATE raw rejected', false,
    'SECURITY HOLE: update to raw was permitted');
exception
  when insufficient_privilege then
    perform pg_temp.record('privileges', 'UPDATE raw rejected', true, 'blocked with 42501');
  when others then
    perform pg_temp.record('privileges', 'UPDATE raw rejected', false,
      'unexpected ' || sqlstate || ': ' || sqlerrm);
end $$;

reset role;

-- Confirm the permitted write actually landed and the blocked one did not.
select pg_temp.record('privileges', 'summary edit persisted, full_text intact',
  (select summary from public.transcripts
    where id = 'aaaaaaaa-4444-4000-8000-000000000001') = 'Edited summary from the app'
  and (select full_text from public.transcripts
        where id = 'aaaaaaaa-4444-4000-8000-000000000001')
      = 'The quarterly reconciliation with Ntokozo covered outstanding invoices.',
  'summary changed, full_text unchanged');


-- =============================================================================
-- TEST 3 — webhook idempotency
-- =============================================================================
-- The guarantee that matters most: Meta retries for up to seven days, and every
-- subscribed app receives those retries. A duplicate dedupe_key must be refused.

do $$
declare
  v_key text := 'wacid.RETRY:call_transcription_available:1700000999';
begin
  insert into public.webhook_events
    (business_id, meta_waba_id, meta_phone_number_id, event_type, payload,
     signature_verified, dedupe_key)
  values
    ('aaaaaaaa-0000-4000-8000-000000000001', 'WABA_A', 'PNID_A',
     'call_transcription_available', '{"attempt":1}'::jsonb, true, v_key);
  perform pg_temp.record('idempotency', 'first delivery accepted', true, v_key);

  -- Meta redelivering the identical event.
  begin
    insert into public.webhook_events
      (business_id, meta_waba_id, meta_phone_number_id, event_type, payload,
       signature_verified, dedupe_key)
    values
      ('aaaaaaaa-0000-4000-8000-000000000001', 'WABA_A', 'PNID_A',
       'call_transcription_available', '{"attempt":2}'::jsonb, true, v_key);
    perform pg_temp.record('idempotency', 'duplicate delivery rejected', false,
      'CRITICAL: duplicate dedupe_key was accepted — events would double-process');
  exception when unique_violation then
    perform pg_temp.record('idempotency', 'duplicate delivery rejected', true,
      'unique_violation raised as expected');
  end;

  perform pg_temp.record('idempotency', 'exactly one row stored',
    (select count(*) from public.webhook_events where dedupe_key = v_key) = 1,
    'rows with that dedupe_key = ' ||
      (select count(*) from public.webhook_events where dedupe_key = v_key)::text);

  -- A different event on the same call must still be allowed through.
  insert into public.webhook_events
    (business_id, meta_waba_id, meta_phone_number_id, event_type, payload,
     signature_verified, dedupe_key)
  values
    ('aaaaaaaa-0000-4000-8000-000000000001', 'WABA_A', 'PNID_A',
     'call_connected', '{"attempt":1}'::jsonb, true,
     'wacid.RETRY:call_connected:1700000999');
  perform pg_temp.record('idempotency', 'different event on same call accepted', true,
    'composite key does not over-collapse');
end $$;


-- =============================================================================
-- TEST 4 — search
-- =============================================================================
-- search_vector covers full_text AND summary; the trigram index covers the
-- substring case that tokenised full-text search structurally cannot reach.
--
-- NOTE: transcript A's summary was rewritten by TEST 2, so 'zebra' is gone from
-- it. Restore the original summary first so this tests search, not test order.

update public.transcripts
   set summary = 'Follow up on the outstanding zebra payment.'
 where id = 'aaaaaaaa-4444-4000-8000-000000000001';

select pg_temp.record('search', 'FTS finds word in full_text',
  (select count(*) from public.transcripts
    where id = 'aaaaaaaa-4444-4000-8000-000000000001'
      and search_vector @@ to_tsquery('simple', 'reconciliation')) = 1,
  'term: reconciliation (full_text)');

select pg_temp.record('search', 'FTS finds word in summary',
  (select count(*) from public.transcripts
    where id = 'aaaaaaaa-4444-4000-8000-000000000001'
      and search_vector @@ to_tsquery('simple', 'zebra')) = 1,
  'term: zebra (summary) — proves summary is in the vector');

select pg_temp.record('search', 'FTS cannot match a partial word',
  (select count(*) from public.transcripts
    where id = 'aaaaaaaa-4444-4000-8000-000000000001'
      and search_vector @@ to_tsquery('simple', 'conciliat')) = 0,
  'term: conciliat — expected miss, this is why trigram exists');

select pg_temp.record('search', 'trigram finds the partial word',
  (select count(*) from public.transcripts
    where id = 'aaaaaaaa-4444-4000-8000-000000000001'
      and full_text ilike '%conciliat%') = 1,
  'term: conciliat via ilike, served by transcripts_full_text_trgm_idx');

select pg_temp.record('search', 'trigram similarity operator available',
  (select count(*) from public.transcripts
    where id = 'aaaaaaaa-4444-4000-8000-000000000001'
      and 'reconcilation' <% full_text) = 1,
  'misspelling "reconcilation" matches via pg_trgm <% (word_similarity)');


-- =============================================================================
-- RESULTS
-- =============================================================================
select
  seq,
  section,
  check_name,
  case when passed then 'PASS' else 'FAIL' end as result,
  detail
from _results
order by seq;

select
  count(*) filter (where passed)       as passed,
  count(*) filter (where not passed)   as failed,
  count(*)                             as total
from _results;

-- Fail loudly so a non-zero exit is impossible to miss in CI.
do $$
declare v_failed int;
begin
  select count(*) into v_failed from _results where not passed;
  if v_failed > 0 then
    raise exception '% verification check(s) FAILED — see the results table above', v_failed;
  end if;
  raise notice 'All verification checks passed.';
end $$;


-- =============================================================================
-- CLEANUP
-- =============================================================================
-- Nothing above is committed. Rolling back removes every seeded row, including
-- the auth.users entries, leaving the real project untouched.
rollback;
