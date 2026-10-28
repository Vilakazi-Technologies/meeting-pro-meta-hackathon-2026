-- Remove Khaya Property Services demo data so demo_khaya.sql can run again.
-- Run in Supabase SQL Editor (service role / postgres), then re-run demo_khaya.sql.
--
-- Also removes business_members for this business — re-link your Clerk user after seed.

begin;

delete from public.businesses
where id = 'dbdbdbdb-0000-4000-8000-000000000001';

commit;
