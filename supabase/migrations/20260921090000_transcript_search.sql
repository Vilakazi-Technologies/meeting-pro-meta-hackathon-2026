-- =============================================================================
-- Meeting Pro — transcript search
-- =============================================================================
-- The archive searched client-side over whatever rows had been fetched, which
-- meant it only ever searched the page in memory and never used the search
-- columns the schema builds. This puts the search in the database, where the
-- indexes are.
--
-- Three ways of matching, because they catch different things:
--   1. Full-text over search_vector — whole words, in any order, across the
--      transcript text and the summary. Uses the 'simple' configuration, the
--      same one the generated column is built with.
--   2. ILIKE substring over full_text and title — finds "conciliat" inside
--      "reconciliation", which tokenised full-text search structurally cannot.
--      Served by the existing trigram index.
--   3. Word similarity (<%) — genuine fuzzy matching, so "reconcilation"
--      finds "reconciliation". Restricted to queries of four characters or
--      more, below which it matches far too much to be useful.
--
-- SECURITY INVOKER (the default, stated here deliberately): the function runs
-- as the caller, so RLS decides which transcripts are searchable. It can be
-- granted to end users safely for exactly that reason.
-- =============================================================================

create or replace function public.search_transcript_ids(p_query text)
returns table (id uuid)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select t.id
    from public.transcripts t
   where p_query is null
      or btrim(p_query) = ''
      or t.search_vector @@ websearch_to_tsquery('simple', btrim(p_query))
      or t.full_text ilike '%' || btrim(p_query) || '%'
      or t.title    ilike '%' || btrim(p_query) || '%'
      or (length(btrim(p_query)) >= 4 and btrim(p_query) <% coalesce(t.full_text, ''));
$$;

comment on function public.search_transcript_ids(text) is
  'Returns the ids of transcripts matching a search, combining full-text, '
  'substring and fuzzy word matching. SECURITY INVOKER, so RLS scopes the '
  'results to the caller''s own business.';

revoke all on function public.search_transcript_ids(text) from public;
revoke all on function public.search_transcript_ids(text) from anon;
grant execute on function public.search_transcript_ids(text) to authenticated;
grant execute on function public.search_transcript_ids(text) to service_role;
