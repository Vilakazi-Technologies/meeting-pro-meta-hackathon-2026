-- =============================================================================
-- Meeting Pro — revoke every privilege from `anon` on the public schema
-- =============================================================================
-- Supabase grants the `anon` role full privileges (SELECT, INSERT, UPDATE,
-- DELETE, TRUNCATE, REFERENCES, TRIGGER) on every table created in `public`.
-- The initial migration narrowed `authenticated` on transcripts but never
-- touched `anon`, so all ten tables were left wide open at the grant level.
--
-- It was not exploitable: every RLS policy is scoped TO authenticated, so anon
-- matched no policy and every read and write was filtered to nothing. But that
-- left RLS as the only barrier. The day someone adds an anon policy — a public
-- share link, say — anon would immediately have held full write access to
-- transcript text. This makes the grant layer say what we mean: anon may touch
-- nothing in public, at all. Nothing is granted back, because nothing in this
-- product is meant to be reachable without signing in.
--
-- Nothing depends on anon today. Sign-in goes through the auth schema, not
-- public, and the app switches to the `authenticated` role once a session exists.
-- =============================================================================

-- Every existing table in public.
revoke all privileges on all tables in schema public from anon;

-- Every table created by later migrations. Without this, the next table added to
-- public would silently re-inherit anon's default grants and reopen the gap.
-- Default privileges are per creating role; migrations run as `postgres`.
alter default privileges for role postgres in schema public
  revoke all privileges on tables from anon;
