-- =============================================================================
-- Meeting Pro — LLM summary pass
-- =============================================================================
-- Meta returns transcripts, never summaries. A separate pass sends the text to
-- Claude and stores a title, a summary and action items.
--
-- Three additions:
--   1. transcripts.title — the UI has always required a title; until now it was
--      a placeholder derived from the phone number.
--   2. summary_status / summary_error — a summarisation that fails must be
--      visible as a failure, not indistinguishable from "not summarised yet".
--   3. apply_transcript_summary() — writes the transcript fields and the action
--      items in ONE transaction. Two separate PostgREST calls could leave a
--      transcript marked summarised with no action items, or the reverse.
-- =============================================================================

alter table public.transcripts add column title text;

comment on column public.transcripts.title is
  'Short title written by the summary pass. Null until summarisation succeeds; '
  'the app falls back to a label derived from the call.';

create type public.summary_status as enum ('pending', 'ready', 'failed');

alter table public.transcripts
  add column summary_status public.summary_status not null default 'pending',
  add column summary_error  text;

comment on column public.transcripts.summary_status is
  'pending = not summarised yet; ready = title, summary and action items stored; '
  'failed = the model call or its output could not be used. A failed transcript '
  'keeps its full_text untouched — only the summary is missing.';

comment on column public.transcripts.summary_error is
  'Why summarisation failed, for operators. Never shown to customers verbatim.';

create index transcripts_summary_status_idx on public.transcripts (summary_status);

-- Note on privileges: `authenticated` holds column-level UPDATE on
-- (summary, summary_model, summarized_at) only. Column grants are explicit, so
-- these new columns are NOT writable by end users — the summary pass writes
-- them through the function below under the service role. `anon` holds nothing.

-- -----------------------------------------------------------------------------
-- apply_transcript_summary — the whole summary, or none of it
-- -----------------------------------------------------------------------------
create or replace function public.apply_transcript_summary(
  p_transcript_id uuid,
  p_title         text,
  p_summary       text,
  p_model         text,
  p_action_items  jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
begin
  -- Lock the row so two concurrent passes cannot interleave.
  select business_id into v_business_id
    from public.transcripts
   where id = p_transcript_id
   for update;

  if v_business_id is null then
    raise exception 'transcript % not found', p_transcript_id
      using errcode = 'no_data_found';
  end if;

  -- Idempotency: replace this transcript's AI-generated items rather than
  -- appending, so running the pass twice cannot duplicate them. Items a person
  -- added by hand (is_ai_generated = false) are left alone.
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

  update public.transcripts
     set title          = p_title,
         summary        = p_summary,
         summary_model  = p_model,
         summarized_at  = now(),
         summary_status = 'ready',
         summary_error  = null
   where id = p_transcript_id;
end;
$$;

comment on function public.apply_transcript_summary(uuid, text, text, text, jsonb) is
  'Writes a completed summary atomically: replaces AI-generated action items and '
  'marks the transcript ready in one transaction. Service role only — it is '
  'SECURITY DEFINER and performs no permission check of its own, so the caller '
  'must have already established that the request is authorised.';

-- SECURITY DEFINER functions are executable by PUBLIC unless revoked. This one
-- bypasses RLS, so only the service role may call it.
revoke all on function public.apply_transcript_summary(uuid, text, text, text, jsonb) from public;
revoke all on function public.apply_transcript_summary(uuid, text, text, text, jsonb) from anon;
revoke all on function public.apply_transcript_summary(uuid, text, text, text, jsonb) from authenticated;
grant execute on function public.apply_transcript_summary(uuid, text, text, text, jsonb) to service_role;
