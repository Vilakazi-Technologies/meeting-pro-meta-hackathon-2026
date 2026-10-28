-- Let signed-in clients subscribe to call and transcript changes (Calls tab,
-- Home recent list) without polling.
alter publication supabase_realtime add table public.calls;
alter publication supabase_realtime add table public.transcripts;
