-- =============================================================================
-- Meeting Pro — anon is denied everything in public
-- =============================================================================
-- Verifies migration 20260918090000_revoke_anon_privileges.
--
-- For every table in public, as the `anon` role, SELECT, INSERT and UPDATE must
-- each fail with SQLSTATE 42501 (insufficient_privilege).
--
-- "Zero rows" is deliberately NOT accepted as a pass, and nor is an RLS
-- rejection — Postgres raises 42501 for both a grant refusal and an RLS
-- row-policy violation, so the message is checked, not just the code. Before the revoke, anon
-- could run all three statements; RLS merely filtered them to nothing. That
-- looks identical to a denial if you only count rows, which is exactly the
-- vacuous pass this test exists to rule out. Only a hard permission error counts.
--
-- Non-vacuous by construction: every table gets a real seeded row first, and the
-- seed is confirmed as the owner before switching role, so there is genuinely
-- something anon could have read or modified.
--
-- Tables are discovered from the catalogue, not hard-coded, so a table added by
-- a later migration is covered automatically — and fails the seed check until
-- this file seeds it, which forces the question to be asked.
--
-- SAFE TO RUN AGAINST A REAL PROJECT: one transaction, ends in ROLLBACK.
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/02_anon_denied.sql
-- Must connect as postgres (seeding relies on bypassing RLS).
-- =============================================================================

\set ON_ERROR_STOP on
\timing off

begin;

create temp table _results (
  seq        serial,
  table_name text,
  check_name text,
  passed     boolean,
  detail     text
) on commit drop;
grant all on _results to public;
grant all on sequence _results_seq_seq to public;

-- Seed one row per table. Mirrors tenant A from 01_schema_verification.sql.
insert into auth.users (id, instance_id, aud, role, email) values
  ('aaaaaaaa-1111-4000-8000-00000000a0a0', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'anon-probe@meetingpro-test.invalid');
insert into public.businesses (id, name) values
  ('aaaaaaaa-0000-4000-8000-00000000a0a0', 'Anon Probe Co');
insert into public.business_members (business_id, user_id, role) values
  ('aaaaaaaa-0000-4000-8000-00000000a0a0', 'aaaaaaaa-1111-4000-8000-00000000a0a0', 'owner');
insert into public.whatsapp_numbers (id, business_id, waba_id, phone_number_id, display_phone_number) values
  ('aaaaaaaa-2222-4000-8000-00000000a0a0', 'aaaaaaaa-0000-4000-8000-00000000a0a0',
   'WABA_PROBE', 'PNID_PROBE', '+27110000099');
insert into public.webhook_events
  (business_id, whatsapp_number_id, event_type, payload, signature_verified, dedupe_key) values
  ('aaaaaaaa-0000-4000-8000-00000000a0a0', 'aaaaaaaa-2222-4000-8000-00000000a0a0',
   'call_transcription_available', '{"seed":"probe"}'::jsonb, true, 'wacid.PROBE:probe:1');
insert into public.calls (id, business_id, whatsapp_number_id, meta_call_id, direction) values
  ('aaaaaaaa-3333-4000-8000-00000000a0a0', 'aaaaaaaa-0000-4000-8000-00000000a0a0',
   'aaaaaaaa-2222-4000-8000-00000000a0a0', 'wacid.PROBE', 'user_initiated');
insert into public.transcripts (id, business_id, call_id, full_text, status) values
  ('aaaaaaaa-4444-4000-8000-00000000a0a0', 'aaaaaaaa-0000-4000-8000-00000000a0a0',
   'aaaaaaaa-3333-4000-8000-00000000a0a0', 'Probe transcript text.', 'ready');
insert into public.transcript_segments (business_id, transcript_id, segment_index, text) values
  ('aaaaaaaa-0000-4000-8000-00000000a0a0', 'aaaaaaaa-4444-4000-8000-00000000a0a0', 0, 'Probe segment.');
insert into public.action_items (business_id, transcript_id, text) values
  ('aaaaaaaa-0000-4000-8000-00000000a0a0', 'aaaaaaaa-4444-4000-8000-00000000a0a0', 'Probe action');
insert into public.tags (id, business_id, name) values
  ('aaaaaaaa-5555-4000-8000-00000000a0a0', 'aaaaaaaa-0000-4000-8000-00000000a0a0', 'probe');
insert into public.transcript_tags (transcript_id, tag_id, business_id) values
  ('aaaaaaaa-4444-4000-8000-00000000a0a0', 'aaaaaaaa-5555-4000-8000-00000000a0a0',
   'aaaaaaaa-0000-4000-8000-00000000a0a0');

-- Discover every table and one column to use in the UPDATE probe. This must be
-- read as postgres: once anon has no privileges, information_schema hides every
-- column from it.
create temp table _targets on commit drop as
  select t.tablename as table_name,
         (select c.column_name from information_schema.columns c
           where c.table_schema = 'public' and c.table_name = t.tablename
             and c.is_generated = 'NEVER'
           order by c.ordinal_position limit 1) as probe_column
    from pg_tables t
   where t.schemaname = 'public'
   order by t.tablename;
grant select on _targets to public;

-- Non-vacuity: every table must hold a real row before anon is tested.
do $$
declare
  r record;
  n bigint;
begin
  for r in select table_name from _targets loop
    execute format('select count(*) from public.%I', r.table_name) into n;
    insert into _results (table_name, check_name, passed, detail)
    values (r.table_name, 'seeded row present (as owner)', n > 0, format('%s row(s)', n));
  end loop;
end $$;

-- The actual checks, as anon.
set local role anon;

do $$
declare
  r        record;
  n        bigint;
  op       text;
  stmt     text;
begin
  for r in select table_name, probe_column from _targets loop
    foreach op in array array['select', 'insert', 'update'] loop
      stmt := case op
        when 'select' then format('select count(*) from public.%I', r.table_name)
        when 'insert' then format('insert into public.%I default values', r.table_name)
        when 'update' then format('update public.%I set %I = %I', r.table_name,
                                  r.probe_column, r.probe_column)
      end;
      begin
        if op = 'select' then
          execute stmt into n;
        else
          execute stmt;
          get diagnostics n = row_count;
        end if;
        -- Reaching here means the statement was ALLOWED. Zero rows is still a
        -- failure: it means RLS filtered it, not that the grant layer refused it.
        insert into _results (table_name, check_name, passed, detail)
        values (r.table_name, 'anon ' || op || ' denied', false,
                format('ALLOWED — statement ran, %s row(s). Only RLS stood in the way.', n));
      exception
        -- 42501 is raised for TWO different reasons and only one counts:
        --   "permission denied for table x"            -> the grant layer refused. PASS.
        --   "new row violates row-level security ..."  -> the grant ALLOWED it and
        --                                                RLS caught it. FAIL.
        -- Accepting the bare error code would pass every INSERT even with anon
        -- holding full grants, because RLS rejects the row either way.
        when insufficient_privilege then
          insert into _results (table_name, check_name, passed, detail)
          values (r.table_name, 'anon ' || op || ' denied',
                  sqlerrm like 'permission denied for %',
                  case when sqlerrm like 'permission denied for %'
                       then '42501 ' || sqlerrm
                       else 'ALLOWED by grants, stopped only by RLS: ' || sqlerrm end);
        when others then
          insert into _results (table_name, check_name, passed, detail)
          values (r.table_name, 'anon ' || op || ' denied', false,
                  format('unexpected %s: %s', sqlstate, sqlerrm));
      end;
    end loop;
  end loop;
end $$;

reset role;

select seq, table_name, check_name,
       case when passed then 'PASS' else 'FAIL' end as result, detail
  from _results order by seq;

select count(*) filter (where passed) as passed,
       count(*) filter (where not passed) as failed,
       count(*) as total
  from _results;

do $$
declare f int;
begin
  select count(*) into f from _results where not passed;
  if f > 0 then
    raise exception '% anon check(s) FAILED — see the results table above', f;
  end if;
end $$;

rollback;
