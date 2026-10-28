-- Demo data: Khaya Property Services, a Johannesburg property and facilities
-- business. Fourteen WhatsApp calls over the last few weeks.
--
-- Every summary, title and action item here is PRE-WRITTEN DEMO CONTENT. No
-- model produced any of it, which is why summary_model reads
-- 'seeded-demo-content' rather than naming a model. Action items carry
-- is_ai_generated = true because that is the row they stand in for.
--
-- Safe to re-run only after wiping the demo business (not idempotent on calls).
-- If you see duplicate key on calls_pkey, the seed already ran — skip re-run and
-- link your Clerk user (see docs/DEMO_READINESS.md), or run demo_khaya_reset.sql first.
-- Dates are relative to now(), so the demo never looks stale.
--
--   psql "$DATABASE_URL" -f supabase/seed/demo_khaya_reset.sql   # optional
--   psql "$DATABASE_URL" -f supabase/seed/demo_khaya.sql
--
-- The demo user is created separately, through the auth admin API, and added to
-- business_members.
begin;
insert into public.businesses (id, name) values ('dbdbdbdb-0000-4000-8000-000000000001', 'Khaya Property Services') on conflict (id) do nothing;
insert into public.whatsapp_numbers (id, business_id, waba_id, phone_number_id, display_phone_number, is_active)
values ('dbdbdbdb-1111-4000-8000-000000000001','dbdbdbdb-0000-4000-8000-000000000001','203994412770551','119482203551907','27112345678',true) on conflict (phone_number_id) do nothing;
insert into public.tags (business_id, name, color) values ('dbdbdbdb-0000-4000-8000-000000000001','quote','#6366F1') on conflict do nothing;
insert into public.tags (business_id, name, color) values ('dbdbdbdb-0000-4000-8000-000000000001','plumbing','#0EA5E9') on conflict do nothing;
insert into public.tags (business_id, name, color) values ('dbdbdbdb-0000-4000-8000-000000000001','urgent','#EF4444') on conflict do nothing;
insert into public.tags (business_id, name, color) values ('dbdbdbdb-0000-4000-8000-000000000001','delivery','#F59E0B') on conflict do nothing;
insert into public.tags (business_id, name, color) values ('dbdbdbdb-0000-4000-8000-000000000001','dispute','#F43F5E') on conflict do nothing;
insert into public.tags (business_id, name, color) values ('dbdbdbdb-0000-4000-8000-000000000001','viewing','#8B5CF6') on conflict do nothing;
insert into public.tags (business_id, name, color) values ('dbdbdbdb-0000-4000-8000-000000000001','rental','#10B981') on conflict do nothing;
insert into public.tags (business_id, name, color) values ('dbdbdbdb-0000-4000-8000-000000000001','invoice','#14B8A6') on conflict do nothing;
insert into public.tags (business_id, name, color) values ('dbdbdbdb-0000-4000-8000-000000000001','payment','#22C55E') on conflict do nothing;
insert into public.tags (business_id, name, color) values ('dbdbdbdb-0000-4000-8000-000000000001','follow-up','#A855F7') on conflict do nothing;
insert into public.tags (business_id, name, color) values ('dbdbdbdb-0000-4000-8000-000000000001','recruitment','#EC4899') on conflict do nothing;
insert into public.tags (business_id, name, color) values ('dbdbdbdb-0000-4000-8000-000000000001','hiring','#D946EF') on conflict do nothing;
insert into public.tags (business_id, name, color) values ('dbdbdbdb-0000-4000-8000-000000000001','supplier','#0891B2') on conflict do nothing;
insert into public.tags (business_id, name, color) values ('dbdbdbdb-0000-4000-8000-000000000001','pricing','#65A30D') on conflict do nothing;
insert into public.tags (business_id, name, color) values ('dbdbdbdb-0000-4000-8000-000000000001','appointment','#F97316') on conflict do nothing;
insert into public.tags (business_id, name, color) values ('dbdbdbdb-0000-4000-8000-000000000001','maintenance','#3B82F6') on conflict do nothing;
insert into public.calls (id, business_id, whatsapp_number_id, meta_call_id, direction,
  counterparty_bsuid, counterparty_phone, started_at, ended_at, duration_seconds, status, transcription_enabled)
values ('e4457655-ce44-49c5-bc32-9cde3998a810','dbdbdbdb-0000-4000-8000-000000000001','dbdbdbdb-1111-4000-8000-000000000001','wacid.DEMO.plumb-quote','user_initiated',
  'BSUID_PLUMB-QUOTE','27821234567',
  date_trunc('minute', (date_trunc('day', now()) - interval '2 days' + interval '9 hours 12 minutes')), date_trunc('minute', (date_trunc('day', now()) - interval '2 days' + interval '9 hours 12 minutes')) + interval '318 seconds',
  318, 'COMPLETED', true);
insert into public.transcripts (id, business_id, call_id, meta_media_id, media_sha256, language,
  confidence, duration_seconds, full_text, raw, fetched_at, status, title, summary, summary_model,
  summarized_at, summary_status)
values ('70fa7ce8-cc73-40ed-82f2-222a4f16595a','dbdbdbdb-0000-4000-8000-000000000001','e4457655-ce44-49c5-bc32-9cde3998a810','DEMO-MEDIA-plumb-quote','seeded-plumb-quote','en',
  0.89, 318.3, '[Business] Good morning, Khaya Property Services, Thandi speaking. [Customer] Morning Thandi, it''s Ntokozo Dlamini. I''m phoning about the cottage at the back of my place in Parkhurst. [Business] Of course. What''s the trouble? [Customer] The hot water takes forever and when it comes it''s brown. The plumber who looked at it says the piping is basically finished. [Business] That sounds like galvanised piping that''s rusted through from the inside. How old is the cottage? [Customer] Nineteen seventies, somewhere there. [Business] Then that''s almost certainly it. We''d replace the hot water runs with copper. For a cottage that size you''re looking at somewhere around eight and a half thousand rand including labour. [Customer] Eish. And that''s everything? [Business] That''s materials and labour, but I must be honest with you, until we open the wall we can''t see what''s behind it. If there''s more damage I''ll phone you before we carry on, I won''t just run up the bill. [Customer] No, I appreciate that. How soon can someone come? [Business] I can get Sipho there Thursday morning, eight o''clock. He''ll quote it properly on site. [Customer] Let me just talk to my wife quickly and I''ll confirm. But pencil it in. [Business] I''ll pencil it in and send you the quote in writing this afternoon.', '{"metadata": {"processed_at": "seeded", "audio": {"duration": 318.3, "sample_rate": 16000, "channels": 2, "audio_format": "stereo"}}, "transcript": {"text": "[Business] Good morning, Khaya Property Services, Thandi speaking. [Customer] Morning Thandi, it''s Ntokozo Dlamini. I''m phoning about the cottage at the back of my place in Parkhurst. [Business] Of course. What''s the trouble? [Customer] The hot water takes forever and when it comes it''s brown. The plumber who looked at it says the piping is basically finished. [Business] That sounds like galvanised piping that''s rusted through from the inside. How old is the cottage? [Customer] Nineteen seventies, somewhere there. [Business] Then that''s almost certainly it. We''d replace the hot water runs with copper. For a cottage that size you''re looking at somewhere around eight and a half thousand rand including labour. [Customer] Eish. And that''s everything? [Business] That''s materials and labour, but I must be honest with you, until we open the wall we can''t see what''s behind it. If there''s more damage I''ll phone you before we carry on, I won''t just run up the bill. [Customer] No, I appreciate that. How soon can someone come? [Business] I can get Sipho there Thursday morning, eight o''clock. He''ll quote it properly on site. [Customer] Let me just talk to my wife quickly and I''ll confirm. But pencil it in. [Business] I''ll pencil it in and send you the quote in writing this afternoon.", "language": "en", "duration": 318.3, "confidence": 0.89, "segments": [{"id": 1, "speaker": "Business", "channel": 0, "start": 1.61, "end": 24.57, "text": "Good morning, Khaya Property Services, Thandi speaking.", "confidence": 0.89}, {"id": 2, "speaker": "Customer", "channel": 1, "start": 24.75, "end": 47.71, "text": "Morning Thandi, it''s Ntokozo Dlamini. I''m phoning about the cottage at the back of my place in Parkhurst.", "confidence": 0.89}, {"id": 3, "speaker": "Business", "channel": 0, "start": 48.16, "end": 71.12, "text": "Of course. What''s the trouble?", "confidence": 0.86}, {"id": 4, "speaker": "Customer", "channel": 1, "start": 71.74, "end": 94.7, "text": "The hot water takes forever and when it comes it''s brown. The plumber who looked at it says the piping is basically finished.", "confidence": 0.95}, {"id": 5, "speaker": "Business", "channel": 0, "start": 95.0, "end": 117.96, "text": "That sounds like galvanised piping that''s rusted through from the inside. How old is the cottage?", "confidence": 0.91}, {"id": 6, "speaker": "Customer", "channel": 1, "start": 118.75, "end": 141.71, "text": "Nineteen seventies, somewhere there.", "confidence": 0.86}, {"id": 7, "speaker": "Business", "channel": 0, "start": 141.98, "end": 166.89, "text": "Then that''s almost certainly it. We''d replace the hot water runs with copper. For a cottage that size you''re looking at somewhere around eight and a half thousand rand including labour.", "confidence": 0.86}, {"id": 8, "speaker": "Customer", "channel": 1, "start": 167.36, "end": 190.32, "text": "Eish. And that''s everything?", "confidence": 0.86}, {"id": 9, "speaker": "Business", "channel": 0, "start": 190.7, "end": 222.84, "text": "That''s materials and labour, but I must be honest with you, until we open the wall we can''t see what''s behind it. If there''s more damage I''ll phone you before we carry on, I won''t just run up the bill.", "confidence": 0.93}, {"id": 10, "speaker": "Customer", "channel": 1, "start": 223.62, "end": 246.58, "text": "No, I appreciate that. How soon can someone come?", "confidence": 0.87}, {"id": 11, "speaker": "Business", "channel": 0, "start": 247.15, "end": 270.11, "text": "I can get Sipho there Thursday morning, eight o''clock. He''ll quote it properly on site.", "confidence": 0.96}, {"id": 12, "speaker": "Customer", "channel": 1, "start": 270.58, "end": 293.54, "text": "Let me just talk to my wife quickly and I''ll confirm. But pencil it in.", "confidence": 0.88}, {"id": 13, "speaker": "Business", "channel": 0, "start": 293.85, "end": 316.81, "text": "I''ll pencil it in and send you the quote in writing this afternoon.", "confidence": 0.88}]}}'::jsonb,
  date_trunc('minute', (date_trunc('day', now()) - interval '2 days' + interval '9 hours 12 minutes')) + interval '363 seconds', 'ready',
  'Plumbing quote for Parkhurst cottage', 'Ntokozo asked for a quote to replace the hot water piping in the back cottage in Parkhurst. Thandi quoted roughly R8 500 including labour, subject to a site visit, and booked the plumber for Thursday morning. Ntokozo will confirm once he has spoken to his wife.', 'seeded-demo-content',
  date_trunc('minute', (date_trunc('day', now()) - interval '2 days' + interval '9 hours 12 minutes')) + interval '408 seconds', 'ready');
update public.transcripts set created_at = date_trunc('minute', (date_trunc('day', now()) - interval '2 days' + interval '9 hours 12 minutes'))
  + interval '378 seconds' where id = '70fa7ce8-cc73-40ed-82f2-222a4f16595a';
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','70fa7ce8-cc73-40ed-82f2-222a4f16595a',0,'seg-1','Business',0,
  1.61,24.57,'Good morning, Khaya Property Services, Thandi speaking.',0.89);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','70fa7ce8-cc73-40ed-82f2-222a4f16595a',1,'seg-2','Customer',1,
  24.75,47.71,'Morning Thandi, it''s Ntokozo Dlamini. I''m phoning about the cottage at the back of my place in Parkhurst.',0.89);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','70fa7ce8-cc73-40ed-82f2-222a4f16595a',2,'seg-3','Business',0,
  48.16,71.12,'Of course. What''s the trouble?',0.86);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','70fa7ce8-cc73-40ed-82f2-222a4f16595a',3,'seg-4','Customer',1,
  71.74,94.7,'The hot water takes forever and when it comes it''s brown. The plumber who looked at it says the piping is basically finished.',0.95);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','70fa7ce8-cc73-40ed-82f2-222a4f16595a',4,'seg-5','Business',0,
  95.0,117.96,'That sounds like galvanised piping that''s rusted through from the inside. How old is the cottage?',0.91);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','70fa7ce8-cc73-40ed-82f2-222a4f16595a',5,'seg-6','Customer',1,
  118.75,141.71,'Nineteen seventies, somewhere there.',0.86);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','70fa7ce8-cc73-40ed-82f2-222a4f16595a',6,'seg-7','Business',0,
  141.98,166.89,'Then that''s almost certainly it. We''d replace the hot water runs with copper. For a cottage that size you''re looking at somewhere around eight and a half thousand rand including labour.',0.86);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','70fa7ce8-cc73-40ed-82f2-222a4f16595a',7,'seg-8','Customer',1,
  167.36,190.32,'Eish. And that''s everything?',0.86);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','70fa7ce8-cc73-40ed-82f2-222a4f16595a',8,'seg-9','Business',0,
  190.7,222.84,'That''s materials and labour, but I must be honest with you, until we open the wall we can''t see what''s behind it. If there''s more damage I''ll phone you before we carry on, I won''t just run up the bill.',0.93);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','70fa7ce8-cc73-40ed-82f2-222a4f16595a',9,'seg-10','Customer',1,
  223.62,246.58,'No, I appreciate that. How soon can someone come?',0.87);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','70fa7ce8-cc73-40ed-82f2-222a4f16595a',10,'seg-11','Business',0,
  247.15,270.11,'I can get Sipho there Thursday morning, eight o''clock. He''ll quote it properly on site.',0.96);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','70fa7ce8-cc73-40ed-82f2-222a4f16595a',11,'seg-12','Customer',1,
  270.58,293.54,'Let me just talk to my wife quickly and I''ll confirm. But pencil it in.',0.88);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','70fa7ce8-cc73-40ed-82f2-222a4f16595a',12,'seg-13','Business',0,
  293.85,316.81,'I''ll pencil it in and send you the quote in writing this afternoon.',0.88);
insert into public.action_items (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values ('dbdbdbdb-0000-4000-8000-000000000001','70fa7ce8-cc73-40ed-82f2-222a4f16595a','Send the written quote for the Parkhurst cottage piping','Thandi',null,'done',true);
insert into public.action_items (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values ('dbdbdbdb-0000-4000-8000-000000000001','70fa7ce8-cc73-40ed-82f2-222a4f16595a','Book Sipho for the site visit on Thursday at 08:00','Thandi',null,'done',true);
insert into public.action_items (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values ('dbdbdbdb-0000-4000-8000-000000000001','70fa7ce8-cc73-40ed-82f2-222a4f16595a','Follow up with Ntokozo if he has not confirmed by Wednesday','Thandi',(date_trunc('day', now()) + interval '6 days')::date,'open',true);
insert into public.transcript_tags (transcript_id, tag_id, business_id)
select '70fa7ce8-cc73-40ed-82f2-222a4f16595a', id, 'dbdbdbdb-0000-4000-8000-000000000001' from public.tags where business_id='dbdbdbdb-0000-4000-8000-000000000001' and name='quote';
insert into public.transcript_tags (transcript_id, tag_id, business_id)
select '70fa7ce8-cc73-40ed-82f2-222a4f16595a', id, 'dbdbdbdb-0000-4000-8000-000000000001' from public.tags where business_id='dbdbdbdb-0000-4000-8000-000000000001' and name='plumbing';
insert into public.calls (id, business_id, whatsapp_number_id, meta_call_id, direction,
  counterparty_bsuid, counterparty_phone, started_at, ended_at, duration_seconds, status, transcription_enabled)
values ('908cb21d-c967-4b5b-82b7-312b0415c219','dbdbdbdb-0000-4000-8000-000000000001','dbdbdbdb-1111-4000-8000-000000000001','wacid.DEMO.delivery-dispute','user_initiated',
  'BSUID_DELIVERY-DISPUTE','27834567890',
  date_trunc('minute', (date_trunc('day', now()) - interval '4 days' + interval '14 hours 5 minutes')), date_trunc('minute', (date_trunc('day', now()) - interval '4 days' + interval '14 hours 5 minutes')) + interval '577 seconds',
  577, 'COMPLETED', true);
insert into public.transcripts (id, business_id, call_id, meta_media_id, media_sha256, language,
  confidence, duration_seconds, full_text, raw, fetched_at, status, title, summary, summary_model,
  summarized_at, summary_status)
values ('8fad802d-6c0e-44fc-ba9c-5352d4c2ae56','dbdbdbdb-0000-4000-8000-000000000001','908cb21d-c967-4b5b-82b7-312b0415c219','DEMO-MEDIA-delivery-dispute','seeded-delivery-dispute','en',
  0.91, 577.73, '[Business] Khaya Property Services, Thandi speaking. [Customer] Ja hello, this is Riaan van der Merwe. Listen, I''ve got a problem with a delivery from last week. [Business] Sorry to hear that. Which delivery is it? [Customer] The tiles for the Bryanston job. I ordered twenty four boxes and there''s eighteen on site. My tiler is standing there with nothing to do. [Business] Let me pull up the order while we talk. Do you have the delivery note number? [Customer] It''s here somewhere. D four seven two one. [Business] Got it. Right, so the order is twenty four boxes and the picking slip says eighteen went onto the truck. That''s our mistake, not yours. [Customer] My guy signed for it without counting, so I thought you were going to tell me I''m stuck. [Business] No. The picking slip is ours and it doesn''t match the order. That''s on us. [Customer] Okay. That''s fair. So when can I get the other six? [Business] Monday morning first thing. I''ll put it on Sipho''s run. [Customer] Monday is fine, the tiler is only back Monday anyway. And the invoice? [Business] I''ll have Lindiwe issue a corrected invoice for what you actually received, and the balance goes on delivery. You won''t pay for anything twice. [Customer] Good, because my payment run is Friday and I don''t want to pay for tiles I haven''t got. [Business] Understood. Corrected invoice before Friday.', '{"metadata": {"processed_at": "seeded", "audio": {"duration": 577.73, "sample_rate": 16000, "channels": 2, "audio_format": "stereo"}}, "transcript": {"text": "[Business] Khaya Property Services, Thandi speaking. [Customer] Ja hello, this is Riaan van der Merwe. Listen, I''ve got a problem with a delivery from last week. [Business] Sorry to hear that. Which delivery is it? [Customer] The tiles for the Bryanston job. I ordered twenty four boxes and there''s eighteen on site. My tiler is standing there with nothing to do. [Business] Let me pull up the order while we talk. Do you have the delivery note number? [Customer] It''s here somewhere. D four seven two one. [Business] Got it. Right, so the order is twenty four boxes and the picking slip says eighteen went onto the truck. That''s our mistake, not yours. [Customer] My guy signed for it without counting, so I thought you were going to tell me I''m stuck. [Business] No. The picking slip is ours and it doesn''t match the order. That''s on us. [Customer] Okay. That''s fair. So when can I get the other six? [Business] Monday morning first thing. I''ll put it on Sipho''s run. [Customer] Monday is fine, the tiler is only back Monday anyway. And the invoice? [Business] I''ll have Lindiwe issue a corrected invoice for what you actually received, and the balance goes on delivery. You won''t pay for anything twice. [Customer] Good, because my payment run is Friday and I don''t want to pay for tiles I haven''t got. [Business] Understood. Corrected invoice before Friday.", "language": "en", "duration": 577.73, "confidence": 0.91, "segments": [{"id": 1, "speaker": "Business", "channel": 0, "start": 1.43, "end": 39.27, "text": "Khaya Property Services, Thandi speaking.", "confidence": 0.94}, {"id": 2, "speaker": "Customer", "channel": 1, "start": 39.75, "end": 77.59, "text": "Ja hello, this is Riaan van der Merwe. Listen, I''ve got a problem with a delivery from last week.", "confidence": 0.91}, {"id": 3, "speaker": "Business", "channel": 0, "start": 77.99, "end": 115.83, "text": "Sorry to hear that. Which delivery is it?", "confidence": 0.85}, {"id": 4, "speaker": "Customer", "channel": 1, "start": 116.82, "end": 154.66, "text": "The tiles for the Bryanston job. I ordered twenty four boxes and there''s eighteen on site. My tiler is standing there with nothing to do.", "confidence": 0.95}, {"id": 5, "speaker": "Business", "channel": 0, "start": 155.05, "end": 192.89, "text": "Let me pull up the order while we talk. Do you have the delivery note number?", "confidence": 0.97}, {"id": 6, "speaker": "Customer", "channel": 1, "start": 193.2, "end": 231.04, "text": "It''s here somewhere. D four seven two one.", "confidence": 0.88}, {"id": 7, "speaker": "Business", "channel": 0, "start": 231.45, "end": 269.29, "text": "Got it. Right, so the order is twenty four boxes and the picking slip says eighteen went onto the truck. That''s our mistake, not yours.", "confidence": 0.85}, {"id": 8, "speaker": "Customer", "channel": 1, "start": 269.54, "end": 307.38, "text": "My guy signed for it without counting, so I thought you were going to tell me I''m stuck.", "confidence": 0.89}, {"id": 9, "speaker": "Business", "channel": 0, "start": 307.94, "end": 345.78, "text": "No. The picking slip is ours and it doesn''t match the order. That''s on us.", "confidence": 0.96}, {"id": 10, "speaker": "Customer", "channel": 1, "start": 346.38, "end": 384.22, "text": "Okay. That''s fair. So when can I get the other six?", "confidence": 0.9}, {"id": 11, "speaker": "Business", "channel": 0, "start": 384.47, "end": 422.31, "text": "Monday morning first thing. I''ll put it on Sipho''s run.", "confidence": 0.9}, {"id": 12, "speaker": "Customer", "channel": 1, "start": 422.98, "end": 460.82, "text": "Monday is fine, the tiler is only back Monday anyway. And the invoice?", "confidence": 0.89}, {"id": 13, "speaker": "Business", "channel": 0, "start": 461.8, "end": 499.64, "text": "I''ll have Lindiwe issue a corrected invoice for what you actually received, and the balance goes on delivery. You won''t pay for anything twice.", "confidence": 0.89}, {"id": 14, "speaker": "Customer", "channel": 1, "start": 500.0, "end": 537.84, "text": "Good, because my payment run is Friday and I don''t want to pay for tiles I haven''t got.", "confidence": 0.89}, {"id": 15, "speaker": "Business", "channel": 0, "start": 538.85, "end": 576.69, "text": "Understood. Corrected invoice before Friday.", "confidence": 0.96}]}}'::jsonb,
  date_trunc('minute', (date_trunc('day', now()) - interval '4 days' + interval '14 hours 5 minutes')) + interval '622 seconds', 'ready',
  'Delivery dispute — tiles short on order', 'Riaan received 18 boxes of tiles instead of 24 and the delivery note was signed without checking. Thandi confirmed the shortfall against the picking slip, accepted it was our error, and arranged the balance for Monday morning at no charge. Riaan asked for the invoice to be corrected before he pays.', 'seeded-demo-content',
  date_trunc('minute', (date_trunc('day', now()) - interval '4 days' + interval '14 hours 5 minutes')) + interval '667 seconds', 'ready');
update public.transcripts set created_at = date_trunc('minute', (date_trunc('day', now()) - interval '4 days' + interval '14 hours 5 minutes'))
  + interval '637 seconds' where id = '8fad802d-6c0e-44fc-ba9c-5352d4c2ae56';
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','8fad802d-6c0e-44fc-ba9c-5352d4c2ae56',0,'seg-1','Business',0,
  1.43,39.27,'Khaya Property Services, Thandi speaking.',0.94);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','8fad802d-6c0e-44fc-ba9c-5352d4c2ae56',1,'seg-2','Customer',1,
  39.75,77.59,'Ja hello, this is Riaan van der Merwe. Listen, I''ve got a problem with a delivery from last week.',0.91);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','8fad802d-6c0e-44fc-ba9c-5352d4c2ae56',2,'seg-3','Business',0,
  77.99,115.83,'Sorry to hear that. Which delivery is it?',0.85);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','8fad802d-6c0e-44fc-ba9c-5352d4c2ae56',3,'seg-4','Customer',1,
  116.82,154.66,'The tiles for the Bryanston job. I ordered twenty four boxes and there''s eighteen on site. My tiler is standing there with nothing to do.',0.95);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','8fad802d-6c0e-44fc-ba9c-5352d4c2ae56',4,'seg-5','Business',0,
  155.05,192.89,'Let me pull up the order while we talk. Do you have the delivery note number?',0.97);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','8fad802d-6c0e-44fc-ba9c-5352d4c2ae56',5,'seg-6','Customer',1,
  193.2,231.04,'It''s here somewhere. D four seven two one.',0.88);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','8fad802d-6c0e-44fc-ba9c-5352d4c2ae56',6,'seg-7','Business',0,
  231.45,269.29,'Got it. Right, so the order is twenty four boxes and the picking slip says eighteen went onto the truck. That''s our mistake, not yours.',0.85);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','8fad802d-6c0e-44fc-ba9c-5352d4c2ae56',7,'seg-8','Customer',1,
  269.54,307.38,'My guy signed for it without counting, so I thought you were going to tell me I''m stuck.',0.89);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','8fad802d-6c0e-44fc-ba9c-5352d4c2ae56',8,'seg-9','Business',0,
  307.94,345.78,'No. The picking slip is ours and it doesn''t match the order. That''s on us.',0.96);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','8fad802d-6c0e-44fc-ba9c-5352d4c2ae56',9,'seg-10','Customer',1,
  346.38,384.22,'Okay. That''s fair. So when can I get the other six?',0.9);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','8fad802d-6c0e-44fc-ba9c-5352d4c2ae56',10,'seg-11','Business',0,
  384.47,422.31,'Monday morning first thing. I''ll put it on Sipho''s run.',0.9);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','8fad802d-6c0e-44fc-ba9c-5352d4c2ae56',11,'seg-12','Customer',1,
  422.98,460.82,'Monday is fine, the tiler is only back Monday anyway. And the invoice?',0.89);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','8fad802d-6c0e-44fc-ba9c-5352d4c2ae56',12,'seg-13','Business',0,
  461.8,499.64,'I''ll have Lindiwe issue a corrected invoice for what you actually received, and the balance goes on delivery. You won''t pay for anything twice.',0.89);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','8fad802d-6c0e-44fc-ba9c-5352d4c2ae56',13,'seg-14','Customer',1,
  500.0,537.84,'Good, because my payment run is Friday and I don''t want to pay for tiles I haven''t got.',0.89);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','8fad802d-6c0e-44fc-ba9c-5352d4c2ae56',14,'seg-15','Business',0,
  538.85,576.69,'Understood. Corrected invoice before Friday.',0.96);
insert into public.action_items (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values ('dbdbdbdb-0000-4000-8000-000000000001','8fad802d-6c0e-44fc-ba9c-5352d4c2ae56','Confirm the tile shortfall against the picking slip','Lindiwe',null,'done',true);
insert into public.action_items (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values ('dbdbdbdb-0000-4000-8000-000000000001','8fad802d-6c0e-44fc-ba9c-5352d4c2ae56','Deliver the outstanding six boxes to Riaan on Monday morning','Sipho',(date_trunc('day', now()) + interval '7 days')::date,'open',true);
insert into public.action_items (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values ('dbdbdbdb-0000-4000-8000-000000000001','8fad802d-6c0e-44fc-ba9c-5352d4c2ae56','Issue a corrected invoice before Riaan''s payment run on Friday','Lindiwe',(date_trunc('day', now()) + interval '1 days')::date,'open',true);
insert into public.transcript_tags (transcript_id, tag_id, business_id)
select '8fad802d-6c0e-44fc-ba9c-5352d4c2ae56', id, 'dbdbdbdb-0000-4000-8000-000000000001' from public.tags where business_id='dbdbdbdb-0000-4000-8000-000000000001' and name='delivery';
insert into public.transcript_tags (transcript_id, tag_id, business_id)
select '8fad802d-6c0e-44fc-ba9c-5352d4c2ae56', id, 'dbdbdbdb-0000-4000-8000-000000000001' from public.tags where business_id='dbdbdbdb-0000-4000-8000-000000000001' and name='dispute';
insert into public.transcript_tags (transcript_id, tag_id, business_id)
select '8fad802d-6c0e-44fc-ba9c-5352d4c2ae56', id, 'dbdbdbdb-0000-4000-8000-000000000001' from public.tags where business_id='dbdbdbdb-0000-4000-8000-000000000001' and name='urgent';
insert into public.calls (id, business_id, whatsapp_number_id, meta_call_id, direction,
  counterparty_bsuid, counterparty_phone, started_at, ended_at, duration_seconds, status, transcription_enabled)
values ('a0a49297-de5b-4f09-a442-cfb4353849f3','dbdbdbdb-0000-4000-8000-000000000001','dbdbdbdb-1111-4000-8000-000000000001','wacid.DEMO.property-viewing','user_initiated',
  'BSUID_PROPERTY-VIEWING','27825550198',
  date_trunc('minute', (date_trunc('day', now()) - interval '5 days' + interval '11 hours 40 minutes')), date_trunc('minute', (date_trunc('day', now()) - interval '5 days' + interval '11 hours 40 minutes')) + interval '219 seconds',
  219, 'COMPLETED', true);
insert into public.transcripts (id, business_id, call_id, meta_media_id, media_sha256, language,
  confidence, duration_seconds, full_text, raw, fetched_at, status, title, summary, summary_model,
  summarized_at, summary_status)
values ('445c5b53-d08b-45d7-a9cd-68f8bf460a0e','dbdbdbdb-0000-4000-8000-000000000001','a0a49297-de5b-4f09-a442-cfb4353849f3','DEMO-MEDIA-property-viewing','seeded-property-viewing','en',
  0.9, 219.66, '[Business] Khaya Property Services, good morning. [Customer] Hi, I saw the two bedroom in Rivonia on Property24. Is it still available? [Business] It is, yes. Eleven five a month, excluding water and lights. [Customer] And is that negotiable at all? [Business] On a twelve month lease the landlord has been firm at eleven five, but he''s covered the levy, so there''s no body corporate charge on top. [Customer] Okay. Do they allow pets? I''ve got a small dog. [Business] Pets are allowed with an additional deposit. How big is the dog? [Customer] She''s a Jack Russell, about seven kilos. [Business] That''s no problem at all. [Customer] Can I come see it this weekend? [Business] Saturday at ten? [Customer] Saturday ten works. [Business] Lovely. Bring your last three payslips and your ID and we can start the application on the spot if you like it.', '{"metadata": {"processed_at": "seeded", "audio": {"duration": 219.66, "sample_rate": 16000, "channels": 2, "audio_format": "stereo"}}, "transcript": {"text": "[Business] Khaya Property Services, good morning. [Customer] Hi, I saw the two bedroom in Rivonia on Property24. Is it still available? [Business] It is, yes. Eleven five a month, excluding water and lights. [Customer] And is that negotiable at all? [Business] On a twelve month lease the landlord has been firm at eleven five, but he''s covered the levy, so there''s no body corporate charge on top. [Customer] Okay. Do they allow pets? I''ve got a small dog. [Business] Pets are allowed with an additional deposit. How big is the dog? [Customer] She''s a Jack Russell, about seven kilos. [Business] That''s no problem at all. [Customer] Can I come see it this weekend? [Business] Saturday at ten? [Customer] Saturday ten works. [Business] Lovely. Bring your last three payslips and your ID and we can start the application on the spot if you like it.", "language": "en", "duration": 219.66, "confidence": 0.9, "segments": [{"id": 1, "speaker": "Business", "channel": 0, "start": 1.44, "end": 17.32, "text": "Khaya Property Services, good morning.", "confidence": 0.94}, {"id": 2, "speaker": "Customer", "channel": 1, "start": 17.88, "end": 33.76, "text": "Hi, I saw the two bedroom in Rivonia on Property24. Is it still available?", "confidence": 0.93}, {"id": 3, "speaker": "Business", "channel": 0, "start": 34.1, "end": 49.98, "text": "It is, yes. Eleven five a month, excluding water and lights.", "confidence": 0.96}, {"id": 4, "speaker": "Customer", "channel": 1, "start": 50.8, "end": 66.68, "text": "And is that negotiable at all?", "confidence": 0.9}, {"id": 5, "speaker": "Business", "channel": 0, "start": 67.75, "end": 83.63, "text": "On a twelve month lease the landlord has been firm at eleven five, but he''s covered the levy, so there''s no body corporate charge on top.", "confidence": 0.96}, {"id": 6, "speaker": "Customer", "channel": 1, "start": 84.11, "end": 99.99, "text": "Okay. Do they allow pets? I''ve got a small dog.", "confidence": 0.86}, {"id": 7, "speaker": "Business", "channel": 0, "start": 100.92, "end": 116.8, "text": "Pets are allowed with an additional deposit. How big is the dog?", "confidence": 0.89}, {"id": 8, "speaker": "Customer", "channel": 1, "start": 117.43, "end": 133.31, "text": "She''s a Jack Russell, about seven kilos.", "confidence": 0.84}, {"id": 9, "speaker": "Business", "channel": 0, "start": 134.35, "end": 150.23, "text": "That''s no problem at all.", "confidence": 0.92}, {"id": 10, "speaker": "Customer", "channel": 1, "start": 151.2, "end": 167.08, "text": "Can I come see it this weekend?", "confidence": 0.94}, {"id": 11, "speaker": "Business", "channel": 0, "start": 167.81, "end": 183.69, "text": "Saturday at ten?", "confidence": 0.9}, {"id": 12, "speaker": "Customer", "channel": 1, "start": 184.47, "end": 200.35, "text": "Saturday ten works.", "confidence": 0.85}, {"id": 13, "speaker": "Business", "channel": 0, "start": 201.02, "end": 216.9, "text": "Lovely. Bring your last three payslips and your ID and we can start the application on the spot if you like it.", "confidence": 0.86}]}}'::jsonb,
  date_trunc('minute', (date_trunc('day', now()) - interval '5 days' + interval '11 hours 40 minutes')) + interval '264 seconds', 'ready',
  'Viewing arranged for Rivonia two-bedroom', 'Zanele wants to view the two-bedroom in Rivonia advertised at R11 500. Thandi confirmed it is still available, explained pets are allowed with a deposit, and booked a viewing for Saturday at 10:00. Zanele will bring payslips and ID.', 'seeded-demo-content',
  date_trunc('minute', (date_trunc('day', now()) - interval '5 days' + interval '11 hours 40 minutes')) + interval '309 seconds', 'ready');
update public.transcripts set created_at = date_trunc('minute', (date_trunc('day', now()) - interval '5 days' + interval '11 hours 40 minutes'))
  + interval '279 seconds' where id = '445c5b53-d08b-45d7-a9cd-68f8bf460a0e';
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','445c5b53-d08b-45d7-a9cd-68f8bf460a0e',0,'seg-1','Business',0,
  1.44,17.32,'Khaya Property Services, good morning.',0.94);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','445c5b53-d08b-45d7-a9cd-68f8bf460a0e',1,'seg-2','Customer',1,
  17.88,33.76,'Hi, I saw the two bedroom in Rivonia on Property24. Is it still available?',0.93);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','445c5b53-d08b-45d7-a9cd-68f8bf460a0e',2,'seg-3','Business',0,
  34.1,49.98,'It is, yes. Eleven five a month, excluding water and lights.',0.96);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','445c5b53-d08b-45d7-a9cd-68f8bf460a0e',3,'seg-4','Customer',1,
  50.8,66.68,'And is that negotiable at all?',0.9);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','445c5b53-d08b-45d7-a9cd-68f8bf460a0e',4,'seg-5','Business',0,
  67.75,83.63,'On a twelve month lease the landlord has been firm at eleven five, but he''s covered the levy, so there''s no body corporate charge on top.',0.96);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','445c5b53-d08b-45d7-a9cd-68f8bf460a0e',5,'seg-6','Customer',1,
  84.11,99.99,'Okay. Do they allow pets? I''ve got a small dog.',0.86);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','445c5b53-d08b-45d7-a9cd-68f8bf460a0e',6,'seg-7','Business',0,
  100.92,116.8,'Pets are allowed with an additional deposit. How big is the dog?',0.89);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','445c5b53-d08b-45d7-a9cd-68f8bf460a0e',7,'seg-8','Customer',1,
  117.43,133.31,'She''s a Jack Russell, about seven kilos.',0.84);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','445c5b53-d08b-45d7-a9cd-68f8bf460a0e',8,'seg-9','Business',0,
  134.35,150.23,'That''s no problem at all.',0.92);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','445c5b53-d08b-45d7-a9cd-68f8bf460a0e',9,'seg-10','Customer',1,
  151.2,167.08,'Can I come see it this weekend?',0.94);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','445c5b53-d08b-45d7-a9cd-68f8bf460a0e',10,'seg-11','Business',0,
  167.81,183.69,'Saturday at ten?',0.9);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','445c5b53-d08b-45d7-a9cd-68f8bf460a0e',11,'seg-12','Customer',1,
  184.47,200.35,'Saturday ten works.',0.85);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','445c5b53-d08b-45d7-a9cd-68f8bf460a0e',12,'seg-13','Business',0,
  201.02,216.9,'Lovely. Bring your last three payslips and your ID and we can start the application on the spot if you like it.',0.86);
insert into public.action_items (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values ('dbdbdbdb-0000-4000-8000-000000000001','445c5b53-d08b-45d7-a9cd-68f8bf460a0e','Confirm Saturday 10:00 viewing with Zanele by SMS','Thandi',null,'done',true);
insert into public.action_items (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values ('dbdbdbdb-0000-4000-8000-000000000001','445c5b53-d08b-45d7-a9cd-68f8bf460a0e','Send the application form and required documents list','Thandi',(date_trunc('day', now()) + interval '3 days')::date,'open',true);
insert into public.transcript_tags (transcript_id, tag_id, business_id)
select '445c5b53-d08b-45d7-a9cd-68f8bf460a0e', id, 'dbdbdbdb-0000-4000-8000-000000000001' from public.tags where business_id='dbdbdbdb-0000-4000-8000-000000000001' and name='viewing';
insert into public.transcript_tags (transcript_id, tag_id, business_id)
select '445c5b53-d08b-45d7-a9cd-68f8bf460a0e', id, 'dbdbdbdb-0000-4000-8000-000000000001' from public.tags where business_id='dbdbdbdb-0000-4000-8000-000000000001' and name='rental';
insert into public.calls (id, business_id, whatsapp_number_id, meta_call_id, direction,
  counterparty_bsuid, counterparty_phone, started_at, ended_at, duration_seconds, status, transcription_enabled)
values ('876ae2e1-ee3a-49b9-95a7-7803cce25c9f','dbdbdbdb-0000-4000-8000-000000000001','dbdbdbdb-1111-4000-8000-000000000001','wacid.DEMO.invoice-chase','user_initiated',
  'BSUID_INVOICE-CHASE','27718887766',
  date_trunc('minute', (date_trunc('day', now()) - interval '7 days' + interval '15 hours 22 minutes')), date_trunc('minute', (date_trunc('day', now()) - interval '7 days' + interval '15 hours 22 minutes')) + interval '370 seconds',
  370, 'COMPLETED', true);
insert into public.transcripts (id, business_id, call_id, meta_media_id, media_sha256, language,
  confidence, duration_seconds, full_text, raw, fetched_at, status, title, summary, summary_model,
  summarized_at, summary_status)
values ('48e470a6-cc4f-4cc7-bbbb-8eaa0f8b9a2c','dbdbdbdb-0000-4000-8000-000000000001','876ae2e1-ee3a-49b9-95a7-7803cce25c9f','DEMO-MEDIA-invoice-chase','seeded-invoice-chase','en',
  0.91, 370.25, '[Business] Hi, is that Fatima? [Customer] Speaking. [Business] Fatima, it''s Thandi from Khaya Property Services. I''m phoning about invoice two zero four one eight, it''s sitting at sixty days. [Customer] Ah. Which amount is that one? [Business] Fourteen thousand two hundred rand. That''s the Fourways maintenance from July. [Customer] Let me look... I''m not seeing it on our system at all. [Business] That would explain it. [Customer] Our finance manager has been off sick for most of August and things have fallen through the cracks. I''m sorry, that''s on our side. [Business] It happens. Can I resend it? [Customer] Please, send it to accounts at the same address and copy me. If you send it today I''ll load it for Friday''s run. [Business] I''ll send the invoice and a full statement so you can see if anything else is outstanding. [Customer] That would actually help a lot, thank you. [Business] No problem. I''ll check on Monday that it came through.', '{"metadata": {"processed_at": "seeded", "audio": {"duration": 370.25, "sample_rate": 16000, "channels": 2, "audio_format": "stereo"}}, "transcript": {"text": "[Business] Hi, is that Fatima? [Customer] Speaking. [Business] Fatima, it''s Thandi from Khaya Property Services. I''m phoning about invoice two zero four one eight, it''s sitting at sixty days. [Customer] Ah. Which amount is that one? [Business] Fourteen thousand two hundred rand. That''s the Fourways maintenance from July. [Customer] Let me look... I''m not seeing it on our system at all. [Business] That would explain it. [Customer] Our finance manager has been off sick for most of August and things have fallen through the cracks. I''m sorry, that''s on our side. [Business] It happens. Can I resend it? [Customer] Please, send it to accounts at the same address and copy me. If you send it today I''ll load it for Friday''s run. [Business] I''ll send the invoice and a full statement so you can see if anything else is outstanding. [Customer] That would actually help a lot, thank you. [Business] No problem. I''ll check on Monday that it came through.", "language": "en", "duration": 370.25, "confidence": 0.91, "segments": [{"id": 1, "speaker": "Business", "channel": 0, "start": 0.47, "end": 28.25, "text": "Hi, is that Fatima?", "confidence": 0.9}, {"id": 2, "speaker": "Customer", "channel": 1, "start": 28.6, "end": 56.38, "text": "Speaking.", "confidence": 0.88}, {"id": 3, "speaker": "Business", "channel": 0, "start": 57.3, "end": 85.08, "text": "Fatima, it''s Thandi from Khaya Property Services. I''m phoning about invoice two zero four one eight, it''s sitting at sixty days.", "confidence": 0.88}, {"id": 4, "speaker": "Customer", "channel": 1, "start": 85.42, "end": 113.2, "text": "Ah. Which amount is that one?", "confidence": 0.9}, {"id": 5, "speaker": "Business", "channel": 0, "start": 114.2, "end": 141.98, "text": "Fourteen thousand two hundred rand. That''s the Fourways maintenance from July.", "confidence": 0.92}, {"id": 6, "speaker": "Customer", "channel": 1, "start": 142.99, "end": 170.77, "text": "Let me look... I''m not seeing it on our system at all.", "confidence": 0.97}, {"id": 7, "speaker": "Business", "channel": 0, "start": 171.15, "end": 198.93, "text": "That would explain it.", "confidence": 0.97}, {"id": 8, "speaker": "Customer", "channel": 1, "start": 199.17, "end": 226.95, "text": "Our finance manager has been off sick for most of August and things have fallen through the cracks. I''m sorry, that''s on our side.", "confidence": 0.93}, {"id": 9, "speaker": "Business", "channel": 0, "start": 227.74, "end": 255.52, "text": "It happens. Can I resend it?", "confidence": 0.92}, {"id": 10, "speaker": "Customer", "channel": 1, "start": 255.8, "end": 283.58, "text": "Please, send it to accounts at the same address and copy me. If you send it today I''ll load it for Friday''s run.", "confidence": 0.85}, {"id": 11, "speaker": "Business", "channel": 0, "start": 283.8, "end": 311.58, "text": "I''ll send the invoice and a full statement so you can see if anything else is outstanding.", "confidence": 0.89}, {"id": 12, "speaker": "Customer", "channel": 1, "start": 311.83, "end": 339.61, "text": "That would actually help a lot, thank you.", "confidence": 0.94}, {"id": 13, "speaker": "Business", "channel": 0, "start": 340.58, "end": 368.36, "text": "No problem. I''ll check on Monday that it came through.", "confidence": 0.88}]}}'::jsonb,
  date_trunc('minute', (date_trunc('day', now()) - interval '7 days' + interval '15 hours 22 minutes')) + interval '415 seconds', 'ready',
  'Overdue invoice — Fourways maintenance', 'Thandi phoned about invoice 20418 for R14 200, sixty days overdue. Fatima explained their finance manager has been off and the invoice was never captured. She will load it for payment this Friday and asked for a statement and a copy of the invoice.', 'seeded-demo-content',
  date_trunc('minute', (date_trunc('day', now()) - interval '7 days' + interval '15 hours 22 minutes')) + interval '460 seconds', 'ready');
update public.transcripts set created_at = date_trunc('minute', (date_trunc('day', now()) - interval '7 days' + interval '15 hours 22 minutes'))
  + interval '430 seconds' where id = '48e470a6-cc4f-4cc7-bbbb-8eaa0f8b9a2c';
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','48e470a6-cc4f-4cc7-bbbb-8eaa0f8b9a2c',0,'seg-1','Business',0,
  0.47,28.25,'Hi, is that Fatima?',0.9);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','48e470a6-cc4f-4cc7-bbbb-8eaa0f8b9a2c',1,'seg-2','Customer',1,
  28.6,56.38,'Speaking.',0.88);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','48e470a6-cc4f-4cc7-bbbb-8eaa0f8b9a2c',2,'seg-3','Business',0,
  57.3,85.08,'Fatima, it''s Thandi from Khaya Property Services. I''m phoning about invoice two zero four one eight, it''s sitting at sixty days.',0.88);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','48e470a6-cc4f-4cc7-bbbb-8eaa0f8b9a2c',3,'seg-4','Customer',1,
  85.42,113.2,'Ah. Which amount is that one?',0.9);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','48e470a6-cc4f-4cc7-bbbb-8eaa0f8b9a2c',4,'seg-5','Business',0,
  114.2,141.98,'Fourteen thousand two hundred rand. That''s the Fourways maintenance from July.',0.92);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','48e470a6-cc4f-4cc7-bbbb-8eaa0f8b9a2c',5,'seg-6','Customer',1,
  142.99,170.77,'Let me look... I''m not seeing it on our system at all.',0.97);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','48e470a6-cc4f-4cc7-bbbb-8eaa0f8b9a2c',6,'seg-7','Business',0,
  171.15,198.93,'That would explain it.',0.97);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','48e470a6-cc4f-4cc7-bbbb-8eaa0f8b9a2c',7,'seg-8','Customer',1,
  199.17,226.95,'Our finance manager has been off sick for most of August and things have fallen through the cracks. I''m sorry, that''s on our side.',0.93);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','48e470a6-cc4f-4cc7-bbbb-8eaa0f8b9a2c',8,'seg-9','Business',0,
  227.74,255.52,'It happens. Can I resend it?',0.92);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','48e470a6-cc4f-4cc7-bbbb-8eaa0f8b9a2c',9,'seg-10','Customer',1,
  255.8,283.58,'Please, send it to accounts at the same address and copy me. If you send it today I''ll load it for Friday''s run.',0.85);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','48e470a6-cc4f-4cc7-bbbb-8eaa0f8b9a2c',10,'seg-11','Business',0,
  283.8,311.58,'I''ll send the invoice and a full statement so you can see if anything else is outstanding.',0.89);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','48e470a6-cc4f-4cc7-bbbb-8eaa0f8b9a2c',11,'seg-12','Customer',1,
  311.83,339.61,'That would actually help a lot, thank you.',0.94);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','48e470a6-cc4f-4cc7-bbbb-8eaa0f8b9a2c',12,'seg-13','Business',0,
  340.58,368.36,'No problem. I''ll check on Monday that it came through.',0.88);
insert into public.action_items (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values ('dbdbdbdb-0000-4000-8000-000000000001','48e470a6-cc4f-4cc7-bbbb-8eaa0f8b9a2c','Resend invoice 20418 and a full statement to Fatima','Lindiwe',null,'done',true);
insert into public.action_items (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values ('dbdbdbdb-0000-4000-8000-000000000001','48e470a6-cc4f-4cc7-bbbb-8eaa0f8b9a2c','Check on Monday that the R14 200 payment reflected','Lindiwe',(date_trunc('day', now()) + interval '3 days')::date,'open',true);
insert into public.transcript_tags (transcript_id, tag_id, business_id)
select '48e470a6-cc4f-4cc7-bbbb-8eaa0f8b9a2c', id, 'dbdbdbdb-0000-4000-8000-000000000001' from public.tags where business_id='dbdbdbdb-0000-4000-8000-000000000001' and name='invoice';
insert into public.transcript_tags (transcript_id, tag_id, business_id)
select '48e470a6-cc4f-4cc7-bbbb-8eaa0f8b9a2c', id, 'dbdbdbdb-0000-4000-8000-000000000001' from public.tags where business_id='dbdbdbdb-0000-4000-8000-000000000001' and name='payment';
insert into public.transcript_tags (transcript_id, tag_id, business_id)
select '48e470a6-cc4f-4cc7-bbbb-8eaa0f8b9a2c', id, 'dbdbdbdb-0000-4000-8000-000000000001' from public.tags where business_id='dbdbdbdb-0000-4000-8000-000000000001' and name='follow-up';
insert into public.calls (id, business_id, whatsapp_number_id, meta_call_id, direction,
  counterparty_bsuid, counterparty_phone, started_at, ended_at, duration_seconds, status, transcription_enabled)
values ('2546e8bb-d9a3-4f07-a567-7860a3da7631','dbdbdbdb-0000-4000-8000-000000000001','dbdbdbdb-1111-4000-8000-000000000001','wacid.DEMO.recruitment','user_initiated',
  'BSUID_RECRUITMENT','27609991234',
  date_trunc('minute', (date_trunc('day', now()) - interval '9 days' + interval '10 hours 0 minutes')), date_trunc('minute', (date_trunc('day', now()) - interval '9 days' + interval '10 hours 0 minutes')) + interval '1151 seconds',
  1151, 'COMPLETED', true);
insert into public.transcripts (id, business_id, call_id, meta_media_id, media_sha256, language,
  confidence, duration_seconds, full_text, raw, fetched_at, status, title, summary, summary_model,
  summarized_at, summary_status)
values ('13dbe59b-a8f7-4206-a0a5-675f8290730e','dbdbdbdb-0000-4000-8000-000000000001','2546e8bb-d9a3-4f07-a567-7860a3da7631','DEMO-MEDIA-recruitment','seeded-recruitment','en',
  0.92, 1151.74, '[Business] Hi Lerato, it''s Thandi from Khaya Property Services. Is now still a good time? [Customer] Yes, perfect, I''m at home. [Business] Wonderful. So this is just an informal chat about the maintenance coordinator role. Tell me a bit about what you''re doing now. [Customer] I''m at a managing agent in Rosebank, six years now. I handle the maintenance desk for about four hundred units. [Business] Four hundred, that''s a big portfolio. What does a normal day look like? [Customer] Logging complaints, getting contractors out, chasing them when they don''t pitch, and then a lot of phoning tenants back to say what''s happening. [Business] That last part is the one most people skip. [Customer] That''s the part that makes people angry though. They don''t mind waiting, they mind not knowing. [Business] I completely agree with you. What''s making you look? [Customer] Honestly, there''s no growth. I''ve been doing the same thing for three years and the person above me isn''t going anywhere. [Business] That''s fair. What are you earning at the moment, if you don''t mind? [Customer] Twenty eight thousand, cost to company. [Business] And what are you hoping for? [Customer] I''d be looking at thirty two, but I''m not rigid if the role has somewhere to go. [Business] That''s within what we''ve budgeted. When would you be available? [Customer] I''m on a calendar month''s notice, so the first of next month. [Business] Let me be straight with you about the role. It''s busier than where you are, but it''s a smaller team so you''d have a lot more say. [Customer] That suits me. I like being able to fix the process, not just work it. [Business] Then I''d like to put you forward for a second interview with our operations manager. Would you be able to come in? [Customer] Any afternoon works, I can take the time. [Business] I''ll set it up. Could you also send me two written references in the meantime? [Customer] I''ll send them tonight.', '{"metadata": {"processed_at": "seeded", "audio": {"duration": 1151.74, "sample_rate": 16000, "channels": 2, "audio_format": "stereo"}}, "transcript": {"text": "[Business] Hi Lerato, it''s Thandi from Khaya Property Services. Is now still a good time? [Customer] Yes, perfect, I''m at home. [Business] Wonderful. So this is just an informal chat about the maintenance coordinator role. Tell me a bit about what you''re doing now. [Customer] I''m at a managing agent in Rosebank, six years now. I handle the maintenance desk for about four hundred units. [Business] Four hundred, that''s a big portfolio. What does a normal day look like? [Customer] Logging complaints, getting contractors out, chasing them when they don''t pitch, and then a lot of phoning tenants back to say what''s happening. [Business] That last part is the one most people skip. [Customer] That''s the part that makes people angry though. They don''t mind waiting, they mind not knowing. [Business] I completely agree with you. What''s making you look? [Customer] Honestly, there''s no growth. I''ve been doing the same thing for three years and the person above me isn''t going anywhere. [Business] That''s fair. What are you earning at the moment, if you don''t mind? [Customer] Twenty eight thousand, cost to company. [Business] And what are you hoping for? [Customer] I''d be looking at thirty two, but I''m not rigid if the role has somewhere to go. [Business] That''s within what we''ve budgeted. When would you be available? [Customer] I''m on a calendar month''s notice, so the first of next month. [Business] Let me be straight with you about the role. It''s busier than where you are, but it''s a smaller team so you''d have a lot more say. [Customer] That suits me. I like being able to fix the process, not just work it. [Business] Then I''d like to put you forward for a second interview with our operations manager. Would you be able to come in? [Customer] Any afternoon works, I can take the time. [Business] I''ll set it up. Could you also send me two written references in the meantime? [Customer] I''ll send them tonight.", "language": "en", "duration": 1151.74, "confidence": 0.92, "segments": [{"id": 1, "speaker": "Business", "channel": 0, "start": 0.67, "end": 52.27, "text": "Hi Lerato, it''s Thandi from Khaya Property Services. Is now still a good time?", "confidence": 0.95}, {"id": 2, "speaker": "Customer", "channel": 1, "start": 52.96, "end": 104.56, "text": "Yes, perfect, I''m at home.", "confidence": 0.9}, {"id": 3, "speaker": "Business", "channel": 0, "start": 104.84, "end": 156.44, "text": "Wonderful. So this is just an informal chat about the maintenance coordinator role. Tell me a bit about what you''re doing now.", "confidence": 0.9}, {"id": 4, "speaker": "Customer", "channel": 1, "start": 157.42, "end": 209.02, "text": "I''m at a managing agent in Rosebank, six years now. I handle the maintenance desk for about four hundred units.", "confidence": 0.95}, {"id": 5, "speaker": "Business", "channel": 0, "start": 210.03, "end": 261.63, "text": "Four hundred, that''s a big portfolio. What does a normal day look like?", "confidence": 0.87}, {"id": 6, "speaker": "Customer", "channel": 1, "start": 262.16, "end": 313.76, "text": "Logging complaints, getting contractors out, chasing them when they don''t pitch, and then a lot of phoning tenants back to say what''s happening.", "confidence": 0.94}, {"id": 7, "speaker": "Business", "channel": 0, "start": 314.65, "end": 366.25, "text": "That last part is the one most people skip.", "confidence": 0.96}, {"id": 8, "speaker": "Customer", "channel": 1, "start": 366.98, "end": 418.58, "text": "That''s the part that makes people angry though. They don''t mind waiting, they mind not knowing.", "confidence": 0.95}, {"id": 9, "speaker": "Business", "channel": 0, "start": 418.9, "end": 470.5, "text": "I completely agree with you. What''s making you look?", "confidence": 0.94}, {"id": 10, "speaker": "Customer", "channel": 1, "start": 471.38, "end": 522.98, "text": "Honestly, there''s no growth. I''ve been doing the same thing for three years and the person above me isn''t going anywhere.", "confidence": 0.94}, {"id": 11, "speaker": "Business", "channel": 0, "start": 523.15, "end": 574.75, "text": "That''s fair. What are you earning at the moment, if you don''t mind?", "confidence": 0.96}, {"id": 12, "speaker": "Customer", "channel": 1, "start": 575.37, "end": 626.97, "text": "Twenty eight thousand, cost to company.", "confidence": 0.88}, {"id": 13, "speaker": "Business", "channel": 0, "start": 627.56, "end": 679.16, "text": "And what are you hoping for?", "confidence": 0.89}, {"id": 14, "speaker": "Customer", "channel": 1, "start": 680.14, "end": 731.74, "text": "I''d be looking at thirty two, but I''m not rigid if the role has somewhere to go.", "confidence": 0.96}, {"id": 15, "speaker": "Business", "channel": 0, "start": 732.2, "end": 783.8, "text": "That''s within what we''ve budgeted. When would you be available?", "confidence": 0.9}, {"id": 16, "speaker": "Customer", "channel": 1, "start": 784.6, "end": 836.2, "text": "I''m on a calendar month''s notice, so the first of next month.", "confidence": 0.93}, {"id": 17, "speaker": "Business", "channel": 0, "start": 836.69, "end": 888.29, "text": "Let me be straight with you about the role. It''s busier than where you are, but it''s a smaller team so you''d have a lot more say.", "confidence": 0.85}, {"id": 18, "speaker": "Customer", "channel": 1, "start": 888.93, "end": 940.53, "text": "That suits me. I like being able to fix the process, not just work it.", "confidence": 0.96}, {"id": 19, "speaker": "Business", "channel": 0, "start": 941.63, "end": 993.23, "text": "Then I''d like to put you forward for a second interview with our operations manager. Would you be able to come in?", "confidence": 0.94}, {"id": 20, "speaker": "Customer", "channel": 1, "start": 994.11, "end": 1045.71, "text": "Any afternoon works, I can take the time.", "confidence": 0.87}, {"id": 21, "speaker": "Business", "channel": 0, "start": 1046.12, "end": 1097.72, "text": "I''ll set it up. Could you also send me two written references in the meantime?", "confidence": 0.88}, {"id": 22, "speaker": "Customer", "channel": 1, "start": 1098.57, "end": 1150.17, "text": "I''ll send them tonight.", "confidence": 0.9}]}}'::jsonb,
  date_trunc('minute', (date_trunc('day', now()) - interval '9 days' + interval '10 hours 0 minutes')) + interval '1196 seconds', 'ready',
  'Screening call — maintenance coordinator role', 'Screening call with Lerato Molefe for the maintenance coordinator position. Six years at a managing agent, comfortable with contractor scheduling and tenant complaints, currently on R28 000 and looking for R32 000. Available from the first of next month. Thandi is putting her forward for a second interview.', 'seeded-demo-content',
  date_trunc('minute', (date_trunc('day', now()) - interval '9 days' + interval '10 hours 0 minutes')) + interval '1241 seconds', 'ready');
update public.transcripts set created_at = date_trunc('minute', (date_trunc('day', now()) - interval '9 days' + interval '10 hours 0 minutes'))
  + interval '1211 seconds' where id = '13dbe59b-a8f7-4206-a0a5-675f8290730e';
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','13dbe59b-a8f7-4206-a0a5-675f8290730e',0,'seg-1','Business',0,
  0.67,52.27,'Hi Lerato, it''s Thandi from Khaya Property Services. Is now still a good time?',0.95);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','13dbe59b-a8f7-4206-a0a5-675f8290730e',1,'seg-2','Customer',1,
  52.96,104.56,'Yes, perfect, I''m at home.',0.9);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','13dbe59b-a8f7-4206-a0a5-675f8290730e',2,'seg-3','Business',0,
  104.84,156.44,'Wonderful. So this is just an informal chat about the maintenance coordinator role. Tell me a bit about what you''re doing now.',0.9);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','13dbe59b-a8f7-4206-a0a5-675f8290730e',3,'seg-4','Customer',1,
  157.42,209.02,'I''m at a managing agent in Rosebank, six years now. I handle the maintenance desk for about four hundred units.',0.95);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','13dbe59b-a8f7-4206-a0a5-675f8290730e',4,'seg-5','Business',0,
  210.03,261.63,'Four hundred, that''s a big portfolio. What does a normal day look like?',0.87);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','13dbe59b-a8f7-4206-a0a5-675f8290730e',5,'seg-6','Customer',1,
  262.16,313.76,'Logging complaints, getting contractors out, chasing them when they don''t pitch, and then a lot of phoning tenants back to say what''s happening.',0.94);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','13dbe59b-a8f7-4206-a0a5-675f8290730e',6,'seg-7','Business',0,
  314.65,366.25,'That last part is the one most people skip.',0.96);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','13dbe59b-a8f7-4206-a0a5-675f8290730e',7,'seg-8','Customer',1,
  366.98,418.58,'That''s the part that makes people angry though. They don''t mind waiting, they mind not knowing.',0.95);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','13dbe59b-a8f7-4206-a0a5-675f8290730e',8,'seg-9','Business',0,
  418.9,470.5,'I completely agree with you. What''s making you look?',0.94);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','13dbe59b-a8f7-4206-a0a5-675f8290730e',9,'seg-10','Customer',1,
  471.38,522.98,'Honestly, there''s no growth. I''ve been doing the same thing for three years and the person above me isn''t going anywhere.',0.94);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','13dbe59b-a8f7-4206-a0a5-675f8290730e',10,'seg-11','Business',0,
  523.15,574.75,'That''s fair. What are you earning at the moment, if you don''t mind?',0.96);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','13dbe59b-a8f7-4206-a0a5-675f8290730e',11,'seg-12','Customer',1,
  575.37,626.97,'Twenty eight thousand, cost to company.',0.88);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','13dbe59b-a8f7-4206-a0a5-675f8290730e',12,'seg-13','Business',0,
  627.56,679.16,'And what are you hoping for?',0.89);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','13dbe59b-a8f7-4206-a0a5-675f8290730e',13,'seg-14','Customer',1,
  680.14,731.74,'I''d be looking at thirty two, but I''m not rigid if the role has somewhere to go.',0.96);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','13dbe59b-a8f7-4206-a0a5-675f8290730e',14,'seg-15','Business',0,
  732.2,783.8,'That''s within what we''ve budgeted. When would you be available?',0.9);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','13dbe59b-a8f7-4206-a0a5-675f8290730e',15,'seg-16','Customer',1,
  784.6,836.2,'I''m on a calendar month''s notice, so the first of next month.',0.93);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','13dbe59b-a8f7-4206-a0a5-675f8290730e',16,'seg-17','Business',0,
  836.69,888.29,'Let me be straight with you about the role. It''s busier than where you are, but it''s a smaller team so you''d have a lot more say.',0.85);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','13dbe59b-a8f7-4206-a0a5-675f8290730e',17,'seg-18','Customer',1,
  888.93,940.53,'That suits me. I like being able to fix the process, not just work it.',0.96);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','13dbe59b-a8f7-4206-a0a5-675f8290730e',18,'seg-19','Business',0,
  941.63,993.23,'Then I''d like to put you forward for a second interview with our operations manager. Would you be able to come in?',0.94);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','13dbe59b-a8f7-4206-a0a5-675f8290730e',19,'seg-20','Customer',1,
  994.11,1045.71,'Any afternoon works, I can take the time.',0.87);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','13dbe59b-a8f7-4206-a0a5-675f8290730e',20,'seg-21','Business',0,
  1046.12,1097.72,'I''ll set it up. Could you also send me two written references in the meantime?',0.88);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','13dbe59b-a8f7-4206-a0a5-675f8290730e',21,'seg-22','Customer',1,
  1098.57,1150.17,'I''ll send them tonight.',0.9);
insert into public.action_items (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values ('dbdbdbdb-0000-4000-8000-000000000001','13dbe59b-a8f7-4206-a0a5-675f8290730e','Arrange a second interview with Lerato and the operations manager','Thandi',(date_trunc('day', now()) + interval '3 days')::date,'open',true);
insert into public.action_items (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values ('dbdbdbdb-0000-4000-8000-000000000001','13dbe59b-a8f7-4206-a0a5-675f8290730e','Request Lerato''s written references','Thandi',(date_trunc('day', now()) + interval '6 days')::date,'open',true);
insert into public.action_items (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values ('dbdbdbdb-0000-4000-8000-000000000001','13dbe59b-a8f7-4206-a0a5-675f8290730e','Let the other two shortlisted candidates know where they stand','Thandi',(date_trunc('day', now()) + interval '2 days')::date,'open',true);
insert into public.transcript_tags (transcript_id, tag_id, business_id)
select '13dbe59b-a8f7-4206-a0a5-675f8290730e', id, 'dbdbdbdb-0000-4000-8000-000000000001' from public.tags where business_id='dbdbdbdb-0000-4000-8000-000000000001' and name='recruitment';
insert into public.transcript_tags (transcript_id, tag_id, business_id)
select '13dbe59b-a8f7-4206-a0a5-675f8290730e', id, 'dbdbdbdb-0000-4000-8000-000000000001' from public.tags where business_id='dbdbdbdb-0000-4000-8000-000000000001' and name='hiring';
insert into public.calls (id, business_id, whatsapp_number_id, meta_call_id, direction,
  counterparty_bsuid, counterparty_phone, started_at, ended_at, duration_seconds, status, transcription_enabled)
values ('8ce9d726-65ae-4d4e-afdc-e39dee839cde','dbdbdbdb-0000-4000-8000-000000000001','dbdbdbdb-1111-4000-8000-000000000001','wacid.DEMO.supplier-nego','user_initiated',
  'BSUID_SUPPLIER-NEGO','27823334455',
  date_trunc('minute', (date_trunc('day', now()) - interval '11 days' + interval '8 hours 30 minutes')), date_trunc('minute', (date_trunc('day', now()) - interval '11 days' + interval '8 hours 30 minutes')) + interval '942 seconds',
  942, 'COMPLETED', true);
insert into public.transcripts (id, business_id, call_id, meta_media_id, media_sha256, language,
  confidence, duration_seconds, full_text, raw, fetched_at, status, title, summary, summary_model,
  summarized_at, summary_status)
values ('2b0d7532-4290-4c40-adfb-02879e561bc0','dbdbdbdb-0000-4000-8000-000000000001','8ce9d726-65ae-4d4e-afdc-e39dee839cde','DEMO-MEDIA-supplier-nego','seeded-supplier-nego','en',
  0.9, 942.9, '[Business] Johan, hoe gaan dit? [Customer] Goed dankie Thandi, en met jou? [Business] Can''t complain. You said you wanted to talk about pricing for the new year. [Customer] Ja, look, I''m not going to make it pretty. Our costs are up. The imported elements alone went up eleven percent. [Business] How much are you putting through? [Customer] Nine percent across the geyser range. [Business] Johan, nine is steep. We''re one of your bigger accounts on that range. [Customer] You are, and that''s why I''m phoning you first instead of just sending a letter. [Business] I appreciate that. But if I take nine I have to pass it to my clients and they''ll start shopping around. [Customer] I hear you. What can you live with? [Business] Five. And fixed for the year, so I''m not having this conversation again in March. [Customer] Five is under my cost increase. I can do six, but then I need the twelve months too, so it''s fair both ways. [Business] Six fixed for twelve months. And what about delivery? [Customer] What about it? [Business] At the moment we pay delivery on anything under twenty thousand. Make it fifteen and we have a deal. [Customer] Fifteen thousand and free delivery. Ja, okay, that I can do. [Business] Then we''re agreed. Six percent, fixed twelve months, free delivery above fifteen. [Customer] Ek sal die nuwe pryslys vir jou stuur, more. [Business] Stuur dit asseblief, dankie Johan.', '{"metadata": {"processed_at": "seeded", "audio": {"duration": 942.9, "sample_rate": 16000, "channels": 2, "audio_format": "stereo"}}, "transcript": {"text": "[Business] Johan, hoe gaan dit? [Customer] Goed dankie Thandi, en met jou? [Business] Can''t complain. You said you wanted to talk about pricing for the new year. [Customer] Ja, look, I''m not going to make it pretty. Our costs are up. The imported elements alone went up eleven percent. [Business] How much are you putting through? [Customer] Nine percent across the geyser range. [Business] Johan, nine is steep. We''re one of your bigger accounts on that range. [Customer] You are, and that''s why I''m phoning you first instead of just sending a letter. [Business] I appreciate that. But if I take nine I have to pass it to my clients and they''ll start shopping around. [Customer] I hear you. What can you live with? [Business] Five. And fixed for the year, so I''m not having this conversation again in March. [Customer] Five is under my cost increase. I can do six, but then I need the twelve months too, so it''s fair both ways. [Business] Six fixed for twelve months. And what about delivery? [Customer] What about it? [Business] At the moment we pay delivery on anything under twenty thousand. Make it fifteen and we have a deal. [Customer] Fifteen thousand and free delivery. Ja, okay, that I can do. [Business] Then we''re agreed. Six percent, fixed twelve months, free delivery above fifteen. [Customer] Ek sal die nuwe pryslys vir jou stuur, more. [Business] Stuur dit asseblief, dankie Johan.", "language": "en", "duration": 942.9, "confidence": 0.9, "segments": [{"id": 1, "speaker": "Business", "channel": 0, "start": 1.71, "end": 50.59, "text": "Johan, hoe gaan dit?", "confidence": 0.97}, {"id": 2, "speaker": "Customer", "channel": 1, "start": 51.36, "end": 100.24, "text": "Goed dankie Thandi, en met jou?", "confidence": 0.87}, {"id": 3, "speaker": "Business", "channel": 0, "start": 100.52, "end": 149.4, "text": "Can''t complain. You said you wanted to talk about pricing for the new year.", "confidence": 0.95}, {"id": 4, "speaker": "Customer", "channel": 1, "start": 149.86, "end": 198.74, "text": "Ja, look, I''m not going to make it pretty. Our costs are up. The imported elements alone went up eleven percent.", "confidence": 0.91}, {"id": 5, "speaker": "Business", "channel": 0, "start": 199.44, "end": 248.32, "text": "How much are you putting through?", "confidence": 0.84}, {"id": 6, "speaker": "Customer", "channel": 1, "start": 248.85, "end": 297.73, "text": "Nine percent across the geyser range.", "confidence": 0.93}, {"id": 7, "speaker": "Business", "channel": 0, "start": 298.73, "end": 347.61, "text": "Johan, nine is steep. We''re one of your bigger accounts on that range.", "confidence": 0.91}, {"id": 8, "speaker": "Customer", "channel": 1, "start": 348.58, "end": 397.46, "text": "You are, and that''s why I''m phoning you first instead of just sending a letter.", "confidence": 0.91}, {"id": 9, "speaker": "Business", "channel": 0, "start": 398.16, "end": 447.04, "text": "I appreciate that. But if I take nine I have to pass it to my clients and they''ll start shopping around.", "confidence": 0.93}, {"id": 10, "speaker": "Customer", "channel": 1, "start": 447.63, "end": 496.51, "text": "I hear you. What can you live with?", "confidence": 0.85}, {"id": 11, "speaker": "Business", "channel": 0, "start": 497.47, "end": 546.35, "text": "Five. And fixed for the year, so I''m not having this conversation again in March.", "confidence": 0.9}, {"id": 12, "speaker": "Customer", "channel": 1, "start": 546.79, "end": 595.67, "text": "Five is under my cost increase. I can do six, but then I need the twelve months too, so it''s fair both ways.", "confidence": 0.87}, {"id": 13, "speaker": "Business", "channel": 0, "start": 596.01, "end": 644.89, "text": "Six fixed for twelve months. And what about delivery?", "confidence": 0.9}, {"id": 14, "speaker": "Customer", "channel": 1, "start": 645.33, "end": 694.21, "text": "What about it?", "confidence": 0.84}, {"id": 15, "speaker": "Business", "channel": 0, "start": 694.62, "end": 743.5, "text": "At the moment we pay delivery on anything under twenty thousand. Make it fifteen and we have a deal.", "confidence": 0.92}, {"id": 16, "speaker": "Customer", "channel": 1, "start": 744.2, "end": 793.08, "text": "Fifteen thousand and free delivery. Ja, okay, that I can do.", "confidence": 0.93}, {"id": 17, "speaker": "Business", "channel": 0, "start": 794.01, "end": 842.89, "text": "Then we''re agreed. Six percent, fixed twelve months, free delivery above fifteen.", "confidence": 0.84}, {"id": 18, "speaker": "Customer", "channel": 1, "start": 843.05, "end": 891.93, "text": "Ek sal die nuwe pryslys vir jou stuur, more.", "confidence": 0.87}, {"id": 19, "speaker": "Business", "channel": 0, "start": 892.31, "end": 941.19, "text": "Stuur dit asseblief, dankie Johan.", "confidence": 0.9}]}}'::jsonb,
  date_trunc('minute', (date_trunc('day', now()) - interval '11 days' + interval '8 hours 30 minutes')) + interval '987 seconds', 'ready',
  'Supplier pricing for geysers — Steyn Wholesale', 'Annual price discussion with Johan at Steyn Wholesale. He proposed a 9 percent increase; Thandi pushed back given our volume and they settled on 6 percent held for twelve months, with free delivery on orders above R15 000. Johan will send the new price list.', 'seeded-demo-content',
  date_trunc('minute', (date_trunc('day', now()) - interval '11 days' + interval '8 hours 30 minutes')) + interval '1032 seconds', 'ready');
update public.transcripts set created_at = date_trunc('minute', (date_trunc('day', now()) - interval '11 days' + interval '8 hours 30 minutes'))
  + interval '1002 seconds' where id = '2b0d7532-4290-4c40-adfb-02879e561bc0';
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2b0d7532-4290-4c40-adfb-02879e561bc0',0,'seg-1','Business',0,
  1.71,50.59,'Johan, hoe gaan dit?',0.97);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2b0d7532-4290-4c40-adfb-02879e561bc0',1,'seg-2','Customer',1,
  51.36,100.24,'Goed dankie Thandi, en met jou?',0.87);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2b0d7532-4290-4c40-adfb-02879e561bc0',2,'seg-3','Business',0,
  100.52,149.4,'Can''t complain. You said you wanted to talk about pricing for the new year.',0.95);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2b0d7532-4290-4c40-adfb-02879e561bc0',3,'seg-4','Customer',1,
  149.86,198.74,'Ja, look, I''m not going to make it pretty. Our costs are up. The imported elements alone went up eleven percent.',0.91);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2b0d7532-4290-4c40-adfb-02879e561bc0',4,'seg-5','Business',0,
  199.44,248.32,'How much are you putting through?',0.84);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2b0d7532-4290-4c40-adfb-02879e561bc0',5,'seg-6','Customer',1,
  248.85,297.73,'Nine percent across the geyser range.',0.93);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2b0d7532-4290-4c40-adfb-02879e561bc0',6,'seg-7','Business',0,
  298.73,347.61,'Johan, nine is steep. We''re one of your bigger accounts on that range.',0.91);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2b0d7532-4290-4c40-adfb-02879e561bc0',7,'seg-8','Customer',1,
  348.58,397.46,'You are, and that''s why I''m phoning you first instead of just sending a letter.',0.91);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2b0d7532-4290-4c40-adfb-02879e561bc0',8,'seg-9','Business',0,
  398.16,447.04,'I appreciate that. But if I take nine I have to pass it to my clients and they''ll start shopping around.',0.93);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2b0d7532-4290-4c40-adfb-02879e561bc0',9,'seg-10','Customer',1,
  447.63,496.51,'I hear you. What can you live with?',0.85);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2b0d7532-4290-4c40-adfb-02879e561bc0',10,'seg-11','Business',0,
  497.47,546.35,'Five. And fixed for the year, so I''m not having this conversation again in March.',0.9);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2b0d7532-4290-4c40-adfb-02879e561bc0',11,'seg-12','Customer',1,
  546.79,595.67,'Five is under my cost increase. I can do six, but then I need the twelve months too, so it''s fair both ways.',0.87);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2b0d7532-4290-4c40-adfb-02879e561bc0',12,'seg-13','Business',0,
  596.01,644.89,'Six fixed for twelve months. And what about delivery?',0.9);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2b0d7532-4290-4c40-adfb-02879e561bc0',13,'seg-14','Customer',1,
  645.33,694.21,'What about it?',0.84);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2b0d7532-4290-4c40-adfb-02879e561bc0',14,'seg-15','Business',0,
  694.62,743.5,'At the moment we pay delivery on anything under twenty thousand. Make it fifteen and we have a deal.',0.92);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2b0d7532-4290-4c40-adfb-02879e561bc0',15,'seg-16','Customer',1,
  744.2,793.08,'Fifteen thousand and free delivery. Ja, okay, that I can do.',0.93);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2b0d7532-4290-4c40-adfb-02879e561bc0',16,'seg-17','Business',0,
  794.01,842.89,'Then we''re agreed. Six percent, fixed twelve months, free delivery above fifteen.',0.84);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2b0d7532-4290-4c40-adfb-02879e561bc0',17,'seg-18','Customer',1,
  843.05,891.93,'Ek sal die nuwe pryslys vir jou stuur, more.',0.87);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2b0d7532-4290-4c40-adfb-02879e561bc0',18,'seg-19','Business',0,
  892.31,941.19,'Stuur dit asseblief, dankie Johan.',0.9);
insert into public.action_items (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values ('dbdbdbdb-0000-4000-8000-000000000001','2b0d7532-4290-4c40-adfb-02879e561bc0','Send the revised geyser price list to Khaya','Johan Steyn',(date_trunc('day', now()) + interval '8 days')::date,'open',true);
insert into public.action_items (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values ('dbdbdbdb-0000-4000-8000-000000000001','2b0d7532-4290-4c40-adfb-02879e561bc0','Update our quoting sheet with the new geyser prices','Lindiwe',(date_trunc('day', now()) + interval '6 days')::date,'open',true);
insert into public.transcript_tags (transcript_id, tag_id, business_id)
select '2b0d7532-4290-4c40-adfb-02879e561bc0', id, 'dbdbdbdb-0000-4000-8000-000000000001' from public.tags where business_id='dbdbdbdb-0000-4000-8000-000000000001' and name='supplier';
insert into public.transcript_tags (transcript_id, tag_id, business_id)
select '2b0d7532-4290-4c40-adfb-02879e561bc0', id, 'dbdbdbdb-0000-4000-8000-000000000001' from public.tags where business_id='dbdbdbdb-0000-4000-8000-000000000001' and name='pricing';
insert into public.calls (id, business_id, whatsapp_number_id, meta_call_id, direction,
  counterparty_bsuid, counterparty_phone, started_at, ended_at, duration_seconds, status, transcription_enabled)
values ('c9802982-f48b-45da-b874-68c191a62057','dbdbdbdb-0000-4000-8000-000000000001','dbdbdbdb-1111-4000-8000-000000000001','wacid.DEMO.missed-appt','user_initiated',
  'BSUID_MISSED-APPT','27746661122',
  date_trunc('minute', (date_trunc('day', now()) - interval '12 days' + interval '16 hours 48 minutes')), date_trunc('minute', (date_trunc('day', now()) - interval '12 days' + interval '16 hours 48 minutes')) + interval '162 seconds',
  162, 'COMPLETED', true);
insert into public.transcripts (id, business_id, call_id, meta_media_id, media_sha256, language,
  confidence, duration_seconds, full_text, raw, fetched_at, status, title, summary, summary_model,
  summarized_at, summary_status)
values ('5c8e8d16-68e8-4412-b945-ec3f3fbdee1d','dbdbdbdb-0000-4000-8000-000000000001','c9802982-f48b-45da-b874-68c191a62057','DEMO-MEDIA-missed-appt','seeded-missed-appt','en',
  0.88, 162.8, '[Business] Hi Bongani, it''s Thandi from Khaya. [Customer] Thandi, hi. I know why you''re phoning. I''m so sorry about Tuesday. [Business] The electrician did wait about twenty minutes. [Customer] I had an emergency at work and by the time I remembered it was already four. I feel terrible. [Business] It happens. Can we get him back out? [Customer] Please. Is Saturday possible? I''m definitely home Saturday. [Business] Saturday at nine. [Customer] Nine is perfect. And what do I owe for the wasted trip? [Business] There is normally a call-out fee, but I''ll leave it this time. If we miss each other again I will have to charge it though. [Customer] That''s more than fair. Saturday nine, I''ll be here, I promise.', '{"metadata": {"processed_at": "seeded", "audio": {"duration": 162.8, "sample_rate": 16000, "channels": 2, "audio_format": "stereo"}}, "transcript": {"text": "[Business] Hi Bongani, it''s Thandi from Khaya. [Customer] Thandi, hi. I know why you''re phoning. I''m so sorry about Tuesday. [Business] The electrician did wait about twenty minutes. [Customer] I had an emergency at work and by the time I remembered it was already four. I feel terrible. [Business] It happens. Can we get him back out? [Customer] Please. Is Saturday possible? I''m definitely home Saturday. [Business] Saturday at nine. [Customer] Nine is perfect. And what do I owe for the wasted trip? [Business] There is normally a call-out fee, but I''ll leave it this time. If we miss each other again I will have to charge it though. [Customer] That''s more than fair. Saturday nine, I''ll be here, I promise.", "language": "en", "duration": 162.8, "confidence": 0.88, "segments": [{"id": 1, "speaker": "Business", "channel": 0, "start": 1.61, "end": 17.09, "text": "Hi Bongani, it''s Thandi from Khaya.", "confidence": 0.86}, {"id": 2, "speaker": "Customer", "channel": 1, "start": 17.88, "end": 33.36, "text": "Thandi, hi. I know why you''re phoning. I''m so sorry about Tuesday.", "confidence": 0.96}, {"id": 3, "speaker": "Business", "channel": 0, "start": 34.15, "end": 49.63, "text": "The electrician did wait about twenty minutes.", "confidence": 0.91}, {"id": 4, "speaker": "Customer", "channel": 1, "start": 50.07, "end": 65.55, "text": "I had an emergency at work and by the time I remembered it was already four. I feel terrible.", "confidence": 0.84}, {"id": 5, "speaker": "Business", "channel": 0, "start": 66.58, "end": 82.06, "text": "It happens. Can we get him back out?", "confidence": 0.88}, {"id": 6, "speaker": "Customer", "channel": 1, "start": 82.28, "end": 97.76, "text": "Please. Is Saturday possible? I''m definitely home Saturday.", "confidence": 0.94}, {"id": 7, "speaker": "Business", "channel": 0, "start": 98.27, "end": 113.75, "text": "Saturday at nine.", "confidence": 0.86}, {"id": 8, "speaker": "Customer", "channel": 1, "start": 114.78, "end": 130.26, "text": "Nine is perfect. And what do I owe for the wasted trip?", "confidence": 0.86}, {"id": 9, "speaker": "Business", "channel": 0, "start": 131.06, "end": 146.54, "text": "There is normally a call-out fee, but I''ll leave it this time. If we miss each other again I will have to charge it though.", "confidence": 0.85}, {"id": 10, "speaker": "Customer", "channel": 1, "start": 146.81, "end": 162.29, "text": "That''s more than fair. Saturday nine, I''ll be here, I promise.", "confidence": 0.88}]}}'::jsonb,
  date_trunc('minute', (date_trunc('day', now()) - interval '12 days' + interval '16 hours 48 minutes')) + interval '207 seconds', 'ready',
  'Rescheduled missed electrician appointment', 'Bongani was not at home when the electrician arrived on Tuesday. He apologised, explained a work emergency, and rescheduled for Saturday morning. Thandi waived the call-out fee this once and warned that a second no-show would be charged.', 'seeded-demo-content',
  date_trunc('minute', (date_trunc('day', now()) - interval '12 days' + interval '16 hours 48 minutes')) + interval '252 seconds', 'ready');
update public.transcripts set created_at = date_trunc('minute', (date_trunc('day', now()) - interval '12 days' + interval '16 hours 48 minutes'))
  + interval '222 seconds' where id = '5c8e8d16-68e8-4412-b945-ec3f3fbdee1d';
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','5c8e8d16-68e8-4412-b945-ec3f3fbdee1d',0,'seg-1','Business',0,
  1.61,17.09,'Hi Bongani, it''s Thandi from Khaya.',0.86);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','5c8e8d16-68e8-4412-b945-ec3f3fbdee1d',1,'seg-2','Customer',1,
  17.88,33.36,'Thandi, hi. I know why you''re phoning. I''m so sorry about Tuesday.',0.96);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','5c8e8d16-68e8-4412-b945-ec3f3fbdee1d',2,'seg-3','Business',0,
  34.15,49.63,'The electrician did wait about twenty minutes.',0.91);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','5c8e8d16-68e8-4412-b945-ec3f3fbdee1d',3,'seg-4','Customer',1,
  50.07,65.55,'I had an emergency at work and by the time I remembered it was already four. I feel terrible.',0.84);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','5c8e8d16-68e8-4412-b945-ec3f3fbdee1d',4,'seg-5','Business',0,
  66.58,82.06,'It happens. Can we get him back out?',0.88);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','5c8e8d16-68e8-4412-b945-ec3f3fbdee1d',5,'seg-6','Customer',1,
  82.28,97.76,'Please. Is Saturday possible? I''m definitely home Saturday.',0.94);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','5c8e8d16-68e8-4412-b945-ec3f3fbdee1d',6,'seg-7','Business',0,
  98.27,113.75,'Saturday at nine.',0.86);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','5c8e8d16-68e8-4412-b945-ec3f3fbdee1d',7,'seg-8','Customer',1,
  114.78,130.26,'Nine is perfect. And what do I owe for the wasted trip?',0.86);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','5c8e8d16-68e8-4412-b945-ec3f3fbdee1d',8,'seg-9','Business',0,
  131.06,146.54,'There is normally a call-out fee, but I''ll leave it this time. If we miss each other again I will have to charge it though.',0.85);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','5c8e8d16-68e8-4412-b945-ec3f3fbdee1d',9,'seg-10','Customer',1,
  146.81,162.29,'That''s more than fair. Saturday nine, I''ll be here, I promise.',0.88);
insert into public.action_items (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values ('dbdbdbdb-0000-4000-8000-000000000001','5c8e8d16-68e8-4412-b945-ec3f3fbdee1d','Rebook the electrician for Saturday 09:00 at Bongani''s','Thandi',null,'done',true);
insert into public.action_items (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values ('dbdbdbdb-0000-4000-8000-000000000001','5c8e8d16-68e8-4412-b945-ec3f3fbdee1d','Waive the missed call-out fee on Bongani''s account this once','Lindiwe',null,'done',true);
insert into public.calls (id, business_id, whatsapp_number_id, meta_call_id, direction,
  counterparty_bsuid, counterparty_phone, started_at, ended_at, duration_seconds, status, transcription_enabled)
values ('494d6787-dff2-42fa-9d36-3d779d58ace8','dbdbdbdb-0000-4000-8000-000000000001','dbdbdbdb-1111-4000-8000-000000000001','wacid.DEMO.geyser-burst','user_initiated',
  'BSUID_GEYSER-BURST','27825557788',
  date_trunc('minute', (date_trunc('day', now()) - interval '14 days' + interval '6 hours 15 minutes')), date_trunc('minute', (date_trunc('day', now()) - interval '14 days' + interval '6 hours 15 minutes')) + interval '476 seconds',
  476, 'COMPLETED', true);
insert into public.transcripts (id, business_id, call_id, meta_media_id, media_sha256, language,
  confidence, duration_seconds, full_text, raw, fetched_at, status, title, summary, summary_model,
  summarized_at, summary_status)
values ('2590be96-1da5-4c3a-a5ed-3cb5f9add73b','dbdbdbdb-0000-4000-8000-000000000001','494d6787-dff2-42fa-9d36-3d779d58ace8','DEMO-MEDIA-geyser-burst','seeded-geyser-burst','en',
  0.88, 476.84, '[Customer] Hello? Is this the emergency number? [Business] It is, Thandi speaking. [Customer] My geyser has burst. There''s water coming through the ceiling into the passage, I don''t know what to do. [Business] Okay. First thing, are you safe? Is the water anywhere near the DB board or any plug points? [Customer] No, it''s in the middle of the passage. [Business] Good. Now I need you to close the main water stopcock. It''s usually outside, near the meter, a small tap in the ground. [Customer] I''m going now... okay, I see it. Which way? [Business] Clockwise, all the way until it stops. [Customer] Okay, it''s closed. The water is slowing down. [Business] Well done. That''s the worst of it stopped. I''m sending our emergency plumber now, he''ll be there within the hour. [Customer] Thank you. Who pays for this? I''m the tenant. [Business] The geyser is the landlord''s, so it goes through the building insurance. You''ll need to claim for anything of yours that''s damaged, and I''ll help you with that. [Customer] Okay. Thank you, really. [Business] Put some towels down and leave the rest. He''s on his way.', '{"metadata": {"processed_at": "seeded", "audio": {"duration": 476.84, "sample_rate": 16000, "channels": 2, "audio_format": "stereo"}}, "transcript": {"text": "[Customer] Hello? Is this the emergency number? [Business] It is, Thandi speaking. [Customer] My geyser has burst. There''s water coming through the ceiling into the passage, I don''t know what to do. [Business] Okay. First thing, are you safe? Is the water anywhere near the DB board or any plug points? [Customer] No, it''s in the middle of the passage. [Business] Good. Now I need you to close the main water stopcock. It''s usually outside, near the meter, a small tap in the ground. [Customer] I''m going now... okay, I see it. Which way? [Business] Clockwise, all the way until it stops. [Customer] Okay, it''s closed. The water is slowing down. [Business] Well done. That''s the worst of it stopped. I''m sending our emergency plumber now, he''ll be there within the hour. [Customer] Thank you. Who pays for this? I''m the tenant. [Business] The geyser is the landlord''s, so it goes through the building insurance. You''ll need to claim for anything of yours that''s damaged, and I''ll help you with that. [Customer] Okay. Thank you, really. [Business] Put some towels down and leave the rest. He''s on his way.", "language": "en", "duration": 476.84, "confidence": 0.88, "segments": [{"id": 1, "speaker": "Customer", "channel": 1, "start": 1.54, "end": 34.71, "text": "Hello? Is this the emergency number?", "confidence": 0.91}, {"id": 2, "speaker": "Business", "channel": 0, "start": 35.32, "end": 68.49, "text": "It is, Thandi speaking.", "confidence": 0.9}, {"id": 3, "speaker": "Customer", "channel": 1, "start": 69.43, "end": 102.6, "text": "My geyser has burst. There''s water coming through the ceiling into the passage, I don''t know what to do.", "confidence": 0.93}, {"id": 4, "speaker": "Business", "channel": 0, "start": 102.79, "end": 135.96, "text": "Okay. First thing, are you safe? Is the water anywhere near the DB board or any plug points?", "confidence": 0.87}, {"id": 5, "speaker": "Customer", "channel": 1, "start": 136.32, "end": 169.49, "text": "No, it''s in the middle of the passage.", "confidence": 0.91}, {"id": 6, "speaker": "Business", "channel": 0, "start": 170.51, "end": 203.68, "text": "Good. Now I need you to close the main water stopcock. It''s usually outside, near the meter, a small tap in the ground.", "confidence": 0.88}, {"id": 7, "speaker": "Customer", "channel": 1, "start": 204.12, "end": 237.29, "text": "I''m going now... okay, I see it. Which way?", "confidence": 0.85}, {"id": 8, "speaker": "Business", "channel": 0, "start": 237.63, "end": 270.8, "text": "Clockwise, all the way until it stops.", "confidence": 0.95}, {"id": 9, "speaker": "Customer", "channel": 1, "start": 271.82, "end": 304.99, "text": "Okay, it''s closed. The water is slowing down.", "confidence": 0.87}, {"id": 10, "speaker": "Business", "channel": 0, "start": 306.05, "end": 339.22, "text": "Well done. That''s the worst of it stopped. I''m sending our emergency plumber now, he''ll be there within the hour.", "confidence": 0.86}, {"id": 11, "speaker": "Customer", "channel": 1, "start": 340.05, "end": 373.22, "text": "Thank you. Who pays for this? I''m the tenant.", "confidence": 0.87}, {"id": 12, "speaker": "Business", "channel": 0, "start": 373.69, "end": 406.86, "text": "The geyser is the landlord''s, so it goes through the building insurance. You''ll need to claim for anything of yours that''s damaged, and I''ll help you with that.", "confidence": 0.84}, {"id": 13, "speaker": "Customer", "channel": 1, "start": 407.26, "end": 440.43, "text": "Okay. Thank you, really.", "confidence": 0.86}, {"id": 14, "speaker": "Business", "channel": 0, "start": 441.04, "end": 474.21, "text": "Put some towels down and leave the rest. He''s on his way.", "confidence": 0.86}]}}'::jsonb,
  date_trunc('minute', (date_trunc('day', now()) - interval '14 days' + interval '6 hours 15 minutes')) + interval '521 seconds', 'ready',
  'Emergency — burst geyser in Midrand unit', 'Thandiwe phoned early with a burst geyser flooding the passage of her Midrand unit. Thandi talked her through closing the main stopcock and dispatched the emergency plumber within the hour. Insurance claim to be opened; the landlord must be notified before any replacement is approved.', 'seeded-demo-content',
  date_trunc('minute', (date_trunc('day', now()) - interval '14 days' + interval '6 hours 15 minutes')) + interval '566 seconds', 'ready');
update public.transcripts set created_at = date_trunc('minute', (date_trunc('day', now()) - interval '14 days' + interval '6 hours 15 minutes'))
  + interval '536 seconds' where id = '2590be96-1da5-4c3a-a5ed-3cb5f9add73b';
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2590be96-1da5-4c3a-a5ed-3cb5f9add73b',0,'seg-1','Customer',1,
  1.54,34.71,'Hello? Is this the emergency number?',0.91);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2590be96-1da5-4c3a-a5ed-3cb5f9add73b',1,'seg-2','Business',0,
  35.32,68.49,'It is, Thandi speaking.',0.9);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2590be96-1da5-4c3a-a5ed-3cb5f9add73b',2,'seg-3','Customer',1,
  69.43,102.6,'My geyser has burst. There''s water coming through the ceiling into the passage, I don''t know what to do.',0.93);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2590be96-1da5-4c3a-a5ed-3cb5f9add73b',3,'seg-4','Business',0,
  102.79,135.96,'Okay. First thing, are you safe? Is the water anywhere near the DB board or any plug points?',0.87);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2590be96-1da5-4c3a-a5ed-3cb5f9add73b',4,'seg-5','Customer',1,
  136.32,169.49,'No, it''s in the middle of the passage.',0.91);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2590be96-1da5-4c3a-a5ed-3cb5f9add73b',5,'seg-6','Business',0,
  170.51,203.68,'Good. Now I need you to close the main water stopcock. It''s usually outside, near the meter, a small tap in the ground.',0.88);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2590be96-1da5-4c3a-a5ed-3cb5f9add73b',6,'seg-7','Customer',1,
  204.12,237.29,'I''m going now... okay, I see it. Which way?',0.85);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2590be96-1da5-4c3a-a5ed-3cb5f9add73b',7,'seg-8','Business',0,
  237.63,270.8,'Clockwise, all the way until it stops.',0.95);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2590be96-1da5-4c3a-a5ed-3cb5f9add73b',8,'seg-9','Customer',1,
  271.82,304.99,'Okay, it''s closed. The water is slowing down.',0.87);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2590be96-1da5-4c3a-a5ed-3cb5f9add73b',9,'seg-10','Business',0,
  306.05,339.22,'Well done. That''s the worst of it stopped. I''m sending our emergency plumber now, he''ll be there within the hour.',0.86);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2590be96-1da5-4c3a-a5ed-3cb5f9add73b',10,'seg-11','Customer',1,
  340.05,373.22,'Thank you. Who pays for this? I''m the tenant.',0.87);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2590be96-1da5-4c3a-a5ed-3cb5f9add73b',11,'seg-12','Business',0,
  373.69,406.86,'The geyser is the landlord''s, so it goes through the building insurance. You''ll need to claim for anything of yours that''s damaged, and I''ll help you with that.',0.84);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2590be96-1da5-4c3a-a5ed-3cb5f9add73b',12,'seg-13','Customer',1,
  407.26,440.43,'Okay. Thank you, really.',0.86);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','2590be96-1da5-4c3a-a5ed-3cb5f9add73b',13,'seg-14','Business',0,
  441.04,474.21,'Put some towels down and leave the rest. He''s on his way.',0.86);
insert into public.action_items (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values ('dbdbdbdb-0000-4000-8000-000000000001','2590be96-1da5-4c3a-a5ed-3cb5f9add73b','Dispatch the emergency plumber to Midrand unit 14','Sipho',null,'done',true);
insert into public.action_items (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values ('dbdbdbdb-0000-4000-8000-000000000001','2590be96-1da5-4c3a-a5ed-3cb5f9add73b','Open the insurance claim for the burst geyser','Lindiwe',null,'done',true);
insert into public.action_items (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values ('dbdbdbdb-0000-4000-8000-000000000001','2590be96-1da5-4c3a-a5ed-3cb5f9add73b','Get the landlord''s approval before ordering the replacement geyser','Thandi',(date_trunc('day', now()) + interval '2 days')::date,'open',true);
insert into public.transcript_tags (transcript_id, tag_id, business_id)
select '2590be96-1da5-4c3a-a5ed-3cb5f9add73b', id, 'dbdbdbdb-0000-4000-8000-000000000001' from public.tags where business_id='dbdbdbdb-0000-4000-8000-000000000001' and name='urgent';
insert into public.transcript_tags (transcript_id, tag_id, business_id)
select '2590be96-1da5-4c3a-a5ed-3cb5f9add73b', id, 'dbdbdbdb-0000-4000-8000-000000000001' from public.tags where business_id='dbdbdbdb-0000-4000-8000-000000000001' and name='plumbing';
insert into public.transcript_tags (transcript_id, tag_id, business_id)
select '2590be96-1da5-4c3a-a5ed-3cb5f9add73b', id, 'dbdbdbdb-0000-4000-8000-000000000001' from public.tags where business_id='dbdbdbdb-0000-4000-8000-000000000001' and name='maintenance';
insert into public.calls (id, business_id, whatsapp_number_id, meta_call_id, direction,
  counterparty_bsuid, counterparty_phone, started_at, ended_at, duration_seconds, status, transcription_enabled)
values ('fd0920c7-ad36-47bf-ad72-99f95b862b15','dbdbdbdb-0000-4000-8000-000000000001','dbdbdbdb-1111-4000-8000-000000000001','wacid.DEMO.lease-renewal','user_initiated',
  'BSUID_LEASE-RENEWAL','27829994455',
  date_trunc('minute', (date_trunc('day', now()) - interval '16 days' + interval '13 hours 5 minutes')), date_trunc('minute', (date_trunc('day', now()) - interval '16 days' + interval '13 hours 5 minutes')) + interval '634 seconds',
  634, 'COMPLETED', true);
insert into public.transcripts (id, business_id, call_id, meta_media_id, media_sha256, language,
  confidence, duration_seconds, full_text, raw, fetched_at, status, title, summary, summary_model,
  summarized_at, summary_status)
values ('43c1ddf4-c420-4d47-8d19-dcaf80f1eba0','dbdbdbdb-0000-4000-8000-000000000001','fd0920c7-ad36-47bf-ad72-99f95b862b15','DEMO-MEDIA-lease-renewal','seeded-lease-renewal','en',
  0.92, 634.93, '[Customer] Afternoon. I got the renewal letter and I want to query the increase. [Business] Sure. Which unit is it? [Customer] Ravi Naidoo, unit seven in the Glenhove block. [Business] I have it. Eight percent escalation from the first of November. [Customer] Eight percent is a lot in this market. [Business] It is above inflation, I won''t pretend otherwise. It''s the figure written into your original lease though, so it isn''t something we''ve added now. [Customer] I understand that, but I''ve been there four years and I''ve never missed a month. [Business] You haven''t, and that''s worth something to the landlord. Let me ask you this, would you consider a two year renewal? [Customer] Possibly. Why? [Business] Because I can go back to him and argue for six and a half if he gets two years of certainty instead of one. [Customer] That I would consider. But there''s something else first. [Business] Go on. [Customer] The bathroom window has been leaking since the winter rains. I reported it twice. [Business] Twice? [Customer] Twice. Nobody came. [Business] Then I apologise, that''s not good enough. I''m logging it now and I''ll have Sipho phone you today, and that happens whether you renew or not. [Customer] Thank you. Then yes, take the two years at six and a half to him.', '{"metadata": {"processed_at": "seeded", "audio": {"duration": 634.93, "sample_rate": 16000, "channels": 2, "audio_format": "stereo"}}, "transcript": {"text": "[Customer] Afternoon. I got the renewal letter and I want to query the increase. [Business] Sure. Which unit is it? [Customer] Ravi Naidoo, unit seven in the Glenhove block. [Business] I have it. Eight percent escalation from the first of November. [Customer] Eight percent is a lot in this market. [Business] It is above inflation, I won''t pretend otherwise. It''s the figure written into your original lease though, so it isn''t something we''ve added now. [Customer] I understand that, but I''ve been there four years and I''ve never missed a month. [Business] You haven''t, and that''s worth something to the landlord. Let me ask you this, would you consider a two year renewal? [Customer] Possibly. Why? [Business] Because I can go back to him and argue for six and a half if he gets two years of certainty instead of one. [Customer] That I would consider. But there''s something else first. [Business] Go on. [Customer] The bathroom window has been leaking since the winter rains. I reported it twice. [Business] Twice? [Customer] Twice. Nobody came. [Business] Then I apologise, that''s not good enough. I''m logging it now and I''ll have Sipho phone you today, and that happens whether you renew or not. [Customer] Thank you. Then yes, take the two years at six and a half to him.", "language": "en", "duration": 634.93, "confidence": 0.92, "segments": [{"id": 1, "speaker": "Customer", "channel": 1, "start": 1.61, "end": 38.03, "text": "Afternoon. I got the renewal letter and I want to query the increase.", "confidence": 0.91}, {"id": 2, "speaker": "Business", "channel": 0, "start": 38.61, "end": 75.03, "text": "Sure. Which unit is it?", "confidence": 0.9}, {"id": 3, "speaker": "Customer", "channel": 1, "start": 76.1, "end": 112.52, "text": "Ravi Naidoo, unit seven in the Glenhove block.", "confidence": 0.84}, {"id": 4, "speaker": "Business", "channel": 0, "start": 113.0, "end": 149.42, "text": "I have it. Eight percent escalation from the first of November.", "confidence": 0.89}, {"id": 5, "speaker": "Customer", "channel": 1, "start": 150.42, "end": 186.84, "text": "Eight percent is a lot in this market.", "confidence": 0.84}, {"id": 6, "speaker": "Business", "channel": 0, "start": 187.2, "end": 223.62, "text": "It is above inflation, I won''t pretend otherwise. It''s the figure written into your original lease though, so it isn''t something we''ve added now.", "confidence": 0.95}, {"id": 7, "speaker": "Customer", "channel": 1, "start": 224.55, "end": 260.97, "text": "I understand that, but I''ve been there four years and I''ve never missed a month.", "confidence": 0.95}, {"id": 8, "speaker": "Business", "channel": 0, "start": 262.06, "end": 298.48, "text": "You haven''t, and that''s worth something to the landlord. Let me ask you this, would you consider a two year renewal?", "confidence": 0.9}, {"id": 9, "speaker": "Customer", "channel": 1, "start": 298.85, "end": 335.27, "text": "Possibly. Why?", "confidence": 0.95}, {"id": 10, "speaker": "Business", "channel": 0, "start": 335.53, "end": 371.95, "text": "Because I can go back to him and argue for six and a half if he gets two years of certainty instead of one.", "confidence": 0.96}, {"id": 11, "speaker": "Customer", "channel": 1, "start": 372.88, "end": 409.3, "text": "That I would consider. But there''s something else first.", "confidence": 0.88}, {"id": 12, "speaker": "Business", "channel": 0, "start": 409.91, "end": 446.33, "text": "Go on.", "confidence": 0.95}, {"id": 13, "speaker": "Customer", "channel": 1, "start": 446.78, "end": 483.2, "text": "The bathroom window has been leaking since the winter rains. I reported it twice.", "confidence": 0.95}, {"id": 14, "speaker": "Business", "channel": 0, "start": 484.27, "end": 520.69, "text": "Twice?", "confidence": 0.9}, {"id": 15, "speaker": "Customer", "channel": 1, "start": 521.55, "end": 557.97, "text": "Twice. Nobody came.", "confidence": 0.93}, {"id": 16, "speaker": "Business", "channel": 0, "start": 558.94, "end": 595.36, "text": "Then I apologise, that''s not good enough. I''m logging it now and I''ll have Sipho phone you today, and that happens whether you renew or not.", "confidence": 0.97}, {"id": 17, "speaker": "Customer", "channel": 1, "start": 596.31, "end": 632.73, "text": "Thank you. Then yes, take the two years at six and a half to him.", "confidence": 0.96}]}}'::jsonb,
  date_trunc('minute', (date_trunc('day', now()) - interval '16 days' + interval '13 hours 5 minutes')) + interval '679 seconds', 'ready',
  'Lease renewal and escalation query', 'Ravi queried the 8 percent escalation on his renewal. Thandi explained it was set in the original lease and offered to take 6.5 percent to the landlord on a two-year renewal. Ravi is interested but wants the leaking bathroom window fixed first. Thandi agreed to log the repair regardless of the renewal.', 'seeded-demo-content',
  date_trunc('minute', (date_trunc('day', now()) - interval '16 days' + interval '13 hours 5 minutes')) + interval '724 seconds', 'ready');
update public.transcripts set created_at = date_trunc('minute', (date_trunc('day', now()) - interval '16 days' + interval '13 hours 5 minutes'))
  + interval '694 seconds' where id = '43c1ddf4-c420-4d47-8d19-dcaf80f1eba0';
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','43c1ddf4-c420-4d47-8d19-dcaf80f1eba0',0,'seg-1','Customer',1,
  1.61,38.03,'Afternoon. I got the renewal letter and I want to query the increase.',0.91);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','43c1ddf4-c420-4d47-8d19-dcaf80f1eba0',1,'seg-2','Business',0,
  38.61,75.03,'Sure. Which unit is it?',0.9);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','43c1ddf4-c420-4d47-8d19-dcaf80f1eba0',2,'seg-3','Customer',1,
  76.1,112.52,'Ravi Naidoo, unit seven in the Glenhove block.',0.84);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','43c1ddf4-c420-4d47-8d19-dcaf80f1eba0',3,'seg-4','Business',0,
  113.0,149.42,'I have it. Eight percent escalation from the first of November.',0.89);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','43c1ddf4-c420-4d47-8d19-dcaf80f1eba0',4,'seg-5','Customer',1,
  150.42,186.84,'Eight percent is a lot in this market.',0.84);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','43c1ddf4-c420-4d47-8d19-dcaf80f1eba0',5,'seg-6','Business',0,
  187.2,223.62,'It is above inflation, I won''t pretend otherwise. It''s the figure written into your original lease though, so it isn''t something we''ve added now.',0.95);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','43c1ddf4-c420-4d47-8d19-dcaf80f1eba0',6,'seg-7','Customer',1,
  224.55,260.97,'I understand that, but I''ve been there four years and I''ve never missed a month.',0.95);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','43c1ddf4-c420-4d47-8d19-dcaf80f1eba0',7,'seg-8','Business',0,
  262.06,298.48,'You haven''t, and that''s worth something to the landlord. Let me ask you this, would you consider a two year renewal?',0.9);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','43c1ddf4-c420-4d47-8d19-dcaf80f1eba0',8,'seg-9','Customer',1,
  298.85,335.27,'Possibly. Why?',0.95);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','43c1ddf4-c420-4d47-8d19-dcaf80f1eba0',9,'seg-10','Business',0,
  335.53,371.95,'Because I can go back to him and argue for six and a half if he gets two years of certainty instead of one.',0.96);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','43c1ddf4-c420-4d47-8d19-dcaf80f1eba0',10,'seg-11','Customer',1,
  372.88,409.3,'That I would consider. But there''s something else first.',0.88);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','43c1ddf4-c420-4d47-8d19-dcaf80f1eba0',11,'seg-12','Business',0,
  409.91,446.33,'Go on.',0.95);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','43c1ddf4-c420-4d47-8d19-dcaf80f1eba0',12,'seg-13','Customer',1,
  446.78,483.2,'The bathroom window has been leaking since the winter rains. I reported it twice.',0.95);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','43c1ddf4-c420-4d47-8d19-dcaf80f1eba0',13,'seg-14','Business',0,
  484.27,520.69,'Twice?',0.9);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','43c1ddf4-c420-4d47-8d19-dcaf80f1eba0',14,'seg-15','Customer',1,
  521.55,557.97,'Twice. Nobody came.',0.93);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','43c1ddf4-c420-4d47-8d19-dcaf80f1eba0',15,'seg-16','Business',0,
  558.94,595.36,'Then I apologise, that''s not good enough. I''m logging it now and I''ll have Sipho phone you today, and that happens whether you renew or not.',0.97);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','43c1ddf4-c420-4d47-8d19-dcaf80f1eba0',16,'seg-17','Customer',1,
  596.31,632.73,'Thank you. Then yes, take the two years at six and a half to him.',0.96);
insert into public.action_items (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values ('dbdbdbdb-0000-4000-8000-000000000001','43c1ddf4-c420-4d47-8d19-dcaf80f1eba0','Put a two-year renewal at 6.5 percent to the landlord','Thandi',(date_trunc('day', now()) + interval '7 days')::date,'open',true);
insert into public.action_items (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values ('dbdbdbdb-0000-4000-8000-000000000001','43c1ddf4-c420-4d47-8d19-dcaf80f1eba0','Log the bathroom window repair at Ravi''s unit','Sipho',(date_trunc('day', now()) + interval '9 days')::date,'open',true);
insert into public.action_items (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values ('dbdbdbdb-0000-4000-8000-000000000001','43c1ddf4-c420-4d47-8d19-dcaf80f1eba0','Send Ravi the renewal addendum once the landlord responds','Lindiwe',(date_trunc('day', now()) + interval '5 days')::date,'open',true);
insert into public.transcript_tags (transcript_id, tag_id, business_id)
select '43c1ddf4-c420-4d47-8d19-dcaf80f1eba0', id, 'dbdbdbdb-0000-4000-8000-000000000001' from public.tags where business_id='dbdbdbdb-0000-4000-8000-000000000001' and name='rental';
insert into public.transcript_tags (transcript_id, tag_id, business_id)
select '43c1ddf4-c420-4d47-8d19-dcaf80f1eba0', id, 'dbdbdbdb-0000-4000-8000-000000000001' from public.tags where business_id='dbdbdbdb-0000-4000-8000-000000000001' and name='follow-up';
insert into public.calls (id, business_id, whatsapp_number_id, meta_call_id, direction,
  counterparty_bsuid, counterparty_phone, started_at, ended_at, duration_seconds, status, transcription_enabled)
values ('8c9b7832-ea06-48e4-8e08-877fa85ab792','dbdbdbdb-0000-4000-8000-000000000001','dbdbdbdb-1111-4000-8000-000000000001','wacid.DEMO.noise-complaint','user_initiated',
  'BSUID_NOISE-COMPLAINT','27837774411',
  date_trunc('minute', (date_trunc('day', now()) - interval '19 days' + interval '17 hours 30 minutes')), date_trunc('minute', (date_trunc('day', now()) - interval '19 days' + interval '17 hours 30 minutes')) + interval '734 seconds',
  734, 'COMPLETED', true);
insert into public.transcripts (id, business_id, call_id, meta_media_id, media_sha256, language,
  confidence, duration_seconds, full_text, raw, fetched_at, status, title, summary, summary_model,
  summarized_at, summary_status)
values ('fb47cf08-236f-492d-b262-f9d7a99710f8','dbdbdbdb-0000-4000-8000-000000000001','8c9b7832-ea06-48e4-8e08-877fa85ab792','DEMO-MEDIA-noise-complaint','seeded-noise-complaint','en',
  0.93, 734.6, '[Customer] Thandi, it''s Chantelle again. I''m phoning about unit twelve. Again. [Business] Was it last night? [Customer] Last night and Saturday. Saturday it was until two in the morning. [Business] I''m sorry. I know this is the third time you''ve had to phone. [Customer] Fourth. And every time I''m told it''s been dealt with. [Business] You''re right, and I''m not going to argue with you about it. Let me tell you exactly what has happened so you know it isn''t nothing. [Customer] Please. [Business] Two written warnings have gone to that tenant, one in July and one three weeks ago. I''ve seen them, they''re on file. [Customer] And nothing changes. [Business] No, clearly not. Which is why I''m taking it to the trustees rather than sending a third letter that gets ignored. [Customer] What can the trustees actually do? [Business] They can fine, under the conduct rules. That tends to get attention in a way a letter doesn''t. [Customer] Right. Okay. [Business] I need one thing from you though. Keep a log, dates and times, even roughly. If it goes further that log is what carries it. [Customer] I can do that. I''ve got most of it in my phone already. [Business] Perfect. Send me what you have and I''ll add it to the file.', '{"metadata": {"processed_at": "seeded", "audio": {"duration": 734.6, "sample_rate": 16000, "channels": 2, "audio_format": "stereo"}}, "transcript": {"text": "[Customer] Thandi, it''s Chantelle again. I''m phoning about unit twelve. Again. [Business] Was it last night? [Customer] Last night and Saturday. Saturday it was until two in the morning. [Business] I''m sorry. I know this is the third time you''ve had to phone. [Customer] Fourth. And every time I''m told it''s been dealt with. [Business] You''re right, and I''m not going to argue with you about it. Let me tell you exactly what has happened so you know it isn''t nothing. [Customer] Please. [Business] Two written warnings have gone to that tenant, one in July and one three weeks ago. I''ve seen them, they''re on file. [Customer] And nothing changes. [Business] No, clearly not. Which is why I''m taking it to the trustees rather than sending a third letter that gets ignored. [Customer] What can the trustees actually do? [Business] They can fine, under the conduct rules. That tends to get attention in a way a letter doesn''t. [Customer] Right. Okay. [Business] I need one thing from you though. Keep a log, dates and times, even roughly. If it goes further that log is what carries it. [Customer] I can do that. I''ve got most of it in my phone already. [Business] Perfect. Send me what you have and I''ll add it to the file.", "language": "en", "duration": 734.6, "confidence": 0.93, "segments": [{"id": 1, "speaker": "Customer", "channel": 1, "start": 1.76, "end": 46.91, "text": "Thandi, it''s Chantelle again. I''m phoning about unit twelve. Again.", "confidence": 0.95}, {"id": 2, "speaker": "Business", "channel": 0, "start": 47.4, "end": 92.55, "text": "Was it last night?", "confidence": 0.85}, {"id": 3, "speaker": "Customer", "channel": 1, "start": 92.83, "end": 137.98, "text": "Last night and Saturday. Saturday it was until two in the morning.", "confidence": 0.94}, {"id": 4, "speaker": "Business", "channel": 0, "start": 138.9, "end": 184.05, "text": "I''m sorry. I know this is the third time you''ve had to phone.", "confidence": 0.94}, {"id": 5, "speaker": "Customer", "channel": 1, "start": 184.62, "end": 229.77, "text": "Fourth. And every time I''m told it''s been dealt with.", "confidence": 0.96}, {"id": 6, "speaker": "Business", "channel": 0, "start": 230.39, "end": 275.54, "text": "You''re right, and I''m not going to argue with you about it. Let me tell you exactly what has happened so you know it isn''t nothing.", "confidence": 0.92}, {"id": 7, "speaker": "Customer", "channel": 1, "start": 275.78, "end": 320.93, "text": "Please.", "confidence": 0.93}, {"id": 8, "speaker": "Business", "channel": 0, "start": 321.11, "end": 366.26, "text": "Two written warnings have gone to that tenant, one in July and one three weeks ago. I''ve seen them, they''re on file.", "confidence": 0.91}, {"id": 9, "speaker": "Customer", "channel": 1, "start": 367.34, "end": 412.49, "text": "And nothing changes.", "confidence": 0.97}, {"id": 10, "speaker": "Business", "channel": 0, "start": 412.9, "end": 458.05, "text": "No, clearly not. Which is why I''m taking it to the trustees rather than sending a third letter that gets ignored.", "confidence": 0.92}, {"id": 11, "speaker": "Customer", "channel": 1, "start": 458.55, "end": 503.7, "text": "What can the trustees actually do?", "confidence": 0.91}, {"id": 12, "speaker": "Business", "channel": 0, "start": 504.63, "end": 549.78, "text": "They can fine, under the conduct rules. That tends to get attention in a way a letter doesn''t.", "confidence": 0.94}, {"id": 13, "speaker": "Customer", "channel": 1, "start": 550.35, "end": 595.5, "text": "Right. Okay.", "confidence": 0.93}, {"id": 14, "speaker": "Business", "channel": 0, "start": 596.54, "end": 641.69, "text": "I need one thing from you though. Keep a log, dates and times, even roughly. If it goes further that log is what carries it.", "confidence": 0.95}, {"id": 15, "speaker": "Customer", "channel": 1, "start": 641.89, "end": 687.04, "text": "I can do that. I''ve got most of it in my phone already.", "confidence": 0.93}, {"id": 16, "speaker": "Business", "channel": 0, "start": 687.19, "end": 732.34, "text": "Perfect. Send me what you have and I''ll add it to the file.", "confidence": 0.93}]}}'::jsonb,
  date_trunc('minute', (date_trunc('day', now()) - interval '19 days' + interval '17 hours 30 minutes')) + interval '779 seconds', 'ready',
  'Noise complaint escalated to body corporate', 'Chantelle complained about repeated late-night noise from the unit above hers, the third such call. Thandi confirmed two written warnings have gone to that tenant and agreed to escalate formally to the body corporate trustees, who can fine. Chantelle was asked to keep a dated log of incidents.', 'seeded-demo-content',
  date_trunc('minute', (date_trunc('day', now()) - interval '19 days' + interval '17 hours 30 minutes')) + interval '824 seconds', 'ready');
update public.transcripts set created_at = date_trunc('minute', (date_trunc('day', now()) - interval '19 days' + interval '17 hours 30 minutes'))
  + interval '794 seconds' where id = 'fb47cf08-236f-492d-b262-f9d7a99710f8';
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','fb47cf08-236f-492d-b262-f9d7a99710f8',0,'seg-1','Customer',1,
  1.76,46.91,'Thandi, it''s Chantelle again. I''m phoning about unit twelve. Again.',0.95);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','fb47cf08-236f-492d-b262-f9d7a99710f8',1,'seg-2','Business',0,
  47.4,92.55,'Was it last night?',0.85);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','fb47cf08-236f-492d-b262-f9d7a99710f8',2,'seg-3','Customer',1,
  92.83,137.98,'Last night and Saturday. Saturday it was until two in the morning.',0.94);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','fb47cf08-236f-492d-b262-f9d7a99710f8',3,'seg-4','Business',0,
  138.9,184.05,'I''m sorry. I know this is the third time you''ve had to phone.',0.94);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','fb47cf08-236f-492d-b262-f9d7a99710f8',4,'seg-5','Customer',1,
  184.62,229.77,'Fourth. And every time I''m told it''s been dealt with.',0.96);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','fb47cf08-236f-492d-b262-f9d7a99710f8',5,'seg-6','Business',0,
  230.39,275.54,'You''re right, and I''m not going to argue with you about it. Let me tell you exactly what has happened so you know it isn''t nothing.',0.92);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','fb47cf08-236f-492d-b262-f9d7a99710f8',6,'seg-7','Customer',1,
  275.78,320.93,'Please.',0.93);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','fb47cf08-236f-492d-b262-f9d7a99710f8',7,'seg-8','Business',0,
  321.11,366.26,'Two written warnings have gone to that tenant, one in July and one three weeks ago. I''ve seen them, they''re on file.',0.91);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','fb47cf08-236f-492d-b262-f9d7a99710f8',8,'seg-9','Customer',1,
  367.34,412.49,'And nothing changes.',0.97);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','fb47cf08-236f-492d-b262-f9d7a99710f8',9,'seg-10','Business',0,
  412.9,458.05,'No, clearly not. Which is why I''m taking it to the trustees rather than sending a third letter that gets ignored.',0.92);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','fb47cf08-236f-492d-b262-f9d7a99710f8',10,'seg-11','Customer',1,
  458.55,503.7,'What can the trustees actually do?',0.91);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','fb47cf08-236f-492d-b262-f9d7a99710f8',11,'seg-12','Business',0,
  504.63,549.78,'They can fine, under the conduct rules. That tends to get attention in a way a letter doesn''t.',0.94);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','fb47cf08-236f-492d-b262-f9d7a99710f8',12,'seg-13','Customer',1,
  550.35,595.5,'Right. Okay.',0.93);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','fb47cf08-236f-492d-b262-f9d7a99710f8',13,'seg-14','Business',0,
  596.54,641.69,'I need one thing from you though. Keep a log, dates and times, even roughly. If it goes further that log is what carries it.',0.95);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','fb47cf08-236f-492d-b262-f9d7a99710f8',14,'seg-15','Customer',1,
  641.89,687.04,'I can do that. I''ve got most of it in my phone already.',0.93);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','fb47cf08-236f-492d-b262-f9d7a99710f8',15,'seg-16','Business',0,
  687.19,732.34,'Perfect. Send me what you have and I''ll add it to the file.',0.93);
insert into public.action_items (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values ('dbdbdbdb-0000-4000-8000-000000000001','fb47cf08-236f-492d-b262-f9d7a99710f8','Escalate the noise complaints to the body corporate trustees','Thandi',(date_trunc('day', now()) + interval '6 days')::date,'open',true);
insert into public.action_items (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values ('dbdbdbdb-0000-4000-8000-000000000001','fb47cf08-236f-492d-b262-f9d7a99710f8','Send Chantelle a noise log template','Lindiwe',null,'done',true);
insert into public.action_items (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values ('dbdbdbdb-0000-4000-8000-000000000001','fb47cf08-236f-492d-b262-f9d7a99710f8','Issue a final written warning to the tenant in unit 12','Thandi',(date_trunc('day', now()) + interval '4 days')::date,'open',true);
insert into public.transcript_tags (transcript_id, tag_id, business_id)
select 'fb47cf08-236f-492d-b262-f9d7a99710f8', id, 'dbdbdbdb-0000-4000-8000-000000000001' from public.tags where business_id='dbdbdbdb-0000-4000-8000-000000000001' and name='dispute';
insert into public.transcript_tags (transcript_id, tag_id, business_id)
select 'fb47cf08-236f-492d-b262-f9d7a99710f8', id, 'dbdbdbdb-0000-4000-8000-000000000001' from public.tags where business_id='dbdbdbdb-0000-4000-8000-000000000001' and name='follow-up';
insert into public.calls (id, business_id, whatsapp_number_id, meta_call_id, direction,
  counterparty_bsuid, counterparty_phone, started_at, ended_at, duration_seconds, status, transcription_enabled)
values ('c09f5747-7f16-444b-b0ff-1f3580549193','dbdbdbdb-0000-4000-8000-000000000001','dbdbdbdb-1111-4000-8000-000000000001','wacid.DEMO.quote-won','user_initiated',
  'BSUID_QUOTE-WON','27824443322',
  date_trunc('minute', (date_trunc('day', now()) - interval '21 days' + interval '9 hours 55 minutes')), date_trunc('minute', (date_trunc('day', now()) - interval '21 days' + interval '9 hours 55 minutes')) + interval '265 seconds',
  265, 'COMPLETED', true);
insert into public.transcripts (id, business_id, call_id, meta_media_id, media_sha256, language,
  confidence, duration_seconds, full_text, raw, fetched_at, status, title, summary, summary_model,
  summarized_at, summary_status)
values ('fa625292-7dbd-4edd-a9c7-ca689c1c3dda','dbdbdbdb-0000-4000-8000-000000000001','c09f5747-7f16-444b-b0ff-1f3580549193','DEMO-MEDIA-quote-won','seeded-quote-won','en',
  0.9, 265.35, '[Customer] Morning Thandi. We''re going ahead with the repaint. [Business] That''s good news. The forty six eight hundred quote? [Customer] That''s the one. But I need it done over a weekend, I can''t have my staff breathing paint on a Tuesday. [Business] That''s doable. Weekend work is already in that price. [Customer] Good. What do you need from me? [Business] Fifty percent deposit to book the team, balance on completion. [Customer] I can pay Friday. Can you put it on the company, not my name? I need the VAT. [Business] Of course. Send me the registered details and Lindiwe will invoice Mokoena Attorneys directly. [Customer] I''ll send it now. Which weekend are we looking at? [Business] The eighteenth, if the deposit is in by Friday. [Customer] The eighteenth works.', '{"metadata": {"processed_at": "seeded", "audio": {"duration": 265.35, "sample_rate": 16000, "channels": 2, "audio_format": "stereo"}}, "transcript": {"text": "[Customer] Morning Thandi. We''re going ahead with the repaint. [Business] That''s good news. The forty six eight hundred quote? [Customer] That''s the one. But I need it done over a weekend, I can''t have my staff breathing paint on a Tuesday. [Business] That''s doable. Weekend work is already in that price. [Customer] Good. What do you need from me? [Business] Fifty percent deposit to book the team, balance on completion. [Customer] I can pay Friday. Can you put it on the company, not my name? I need the VAT. [Business] Of course. Send me the registered details and Lindiwe will invoice Mokoena Attorneys directly. [Customer] I''ll send it now. Which weekend are we looking at? [Business] The eighteenth, if the deposit is in by Friday. [Customer] The eighteenth works.", "language": "en", "duration": 265.35, "confidence": 0.9, "segments": [{"id": 1, "speaker": "Customer", "channel": 1, "start": 0.64, "end": 24.09, "text": "Morning Thandi. We''re going ahead with the repaint.", "confidence": 0.96}, {"id": 2, "speaker": "Business", "channel": 0, "start": 24.95, "end": 48.4, "text": "That''s good news. The forty six eight hundred quote?", "confidence": 0.85}, {"id": 3, "speaker": "Customer", "channel": 1, "start": 49.47, "end": 72.92, "text": "That''s the one. But I need it done over a weekend, I can''t have my staff breathing paint on a Tuesday.", "confidence": 0.86}, {"id": 4, "speaker": "Business", "channel": 0, "start": 73.46, "end": 96.91, "text": "That''s doable. Weekend work is already in that price.", "confidence": 0.96}, {"id": 5, "speaker": "Customer", "channel": 1, "start": 97.36, "end": 120.81, "text": "Good. What do you need from me?", "confidence": 0.91}, {"id": 6, "speaker": "Business", "channel": 0, "start": 121.23, "end": 144.68, "text": "Fifty percent deposit to book the team, balance on completion.", "confidence": 0.87}, {"id": 7, "speaker": "Customer", "channel": 1, "start": 145.23, "end": 168.68, "text": "I can pay Friday. Can you put it on the company, not my name? I need the VAT.", "confidence": 0.97}, {"id": 8, "speaker": "Business", "channel": 0, "start": 168.93, "end": 192.38, "text": "Of course. Send me the registered details and Lindiwe will invoice Mokoena Attorneys directly.", "confidence": 0.92}, {"id": 9, "speaker": "Customer", "channel": 1, "start": 192.86, "end": 216.31, "text": "I''ll send it now. Which weekend are we looking at?", "confidence": 0.88}, {"id": 10, "speaker": "Business", "channel": 0, "start": 217.06, "end": 240.51, "text": "The eighteenth, if the deposit is in by Friday.", "confidence": 0.86}, {"id": 11, "speaker": "Customer", "channel": 1, "start": 241.0, "end": 264.45, "text": "The eighteenth works.", "confidence": 0.91}]}}'::jsonb,
  date_trunc('minute', (date_trunc('day', now()) - interval '21 days' + interval '9 hours 55 minutes')) + interval '310 seconds', 'ready',
  'Quote accepted — Randburg office repaint', 'Sipho accepted the R46 800 quote to repaint the Randburg office, with work to happen over a weekend to avoid disrupting staff. A 50 percent deposit is required to book the team; he will pay on Friday and asked for the invoice to reflect his company details for VAT.', 'seeded-demo-content',
  date_trunc('minute', (date_trunc('day', now()) - interval '21 days' + interval '9 hours 55 minutes')) + interval '355 seconds', 'ready');
update public.transcripts set created_at = date_trunc('minute', (date_trunc('day', now()) - interval '21 days' + interval '9 hours 55 minutes'))
  + interval '325 seconds' where id = 'fa625292-7dbd-4edd-a9c7-ca689c1c3dda';
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','fa625292-7dbd-4edd-a9c7-ca689c1c3dda',0,'seg-1','Customer',1,
  0.64,24.09,'Morning Thandi. We''re going ahead with the repaint.',0.96);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','fa625292-7dbd-4edd-a9c7-ca689c1c3dda',1,'seg-2','Business',0,
  24.95,48.4,'That''s good news. The forty six eight hundred quote?',0.85);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','fa625292-7dbd-4edd-a9c7-ca689c1c3dda',2,'seg-3','Customer',1,
  49.47,72.92,'That''s the one. But I need it done over a weekend, I can''t have my staff breathing paint on a Tuesday.',0.86);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','fa625292-7dbd-4edd-a9c7-ca689c1c3dda',3,'seg-4','Business',0,
  73.46,96.91,'That''s doable. Weekend work is already in that price.',0.96);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','fa625292-7dbd-4edd-a9c7-ca689c1c3dda',4,'seg-5','Customer',1,
  97.36,120.81,'Good. What do you need from me?',0.91);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','fa625292-7dbd-4edd-a9c7-ca689c1c3dda',5,'seg-6','Business',0,
  121.23,144.68,'Fifty percent deposit to book the team, balance on completion.',0.87);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','fa625292-7dbd-4edd-a9c7-ca689c1c3dda',6,'seg-7','Customer',1,
  145.23,168.68,'I can pay Friday. Can you put it on the company, not my name? I need the VAT.',0.97);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','fa625292-7dbd-4edd-a9c7-ca689c1c3dda',7,'seg-8','Business',0,
  168.93,192.38,'Of course. Send me the registered details and Lindiwe will invoice Mokoena Attorneys directly.',0.92);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','fa625292-7dbd-4edd-a9c7-ca689c1c3dda',8,'seg-9','Customer',1,
  192.86,216.31,'I''ll send it now. Which weekend are we looking at?',0.88);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','fa625292-7dbd-4edd-a9c7-ca689c1c3dda',9,'seg-10','Business',0,
  217.06,240.51,'The eighteenth, if the deposit is in by Friday.',0.86);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','fa625292-7dbd-4edd-a9c7-ca689c1c3dda',10,'seg-11','Customer',1,
  241.0,264.45,'The eighteenth works.',0.91);
insert into public.action_items (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values ('dbdbdbdb-0000-4000-8000-000000000001','fa625292-7dbd-4edd-a9c7-ca689c1c3dda','Send the deposit invoice with Mokoena Attorneys'' VAT details','Lindiwe',null,'done',true);
insert into public.action_items (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values ('dbdbdbdb-0000-4000-8000-000000000001','fa625292-7dbd-4edd-a9c7-ca689c1c3dda','Book the painting team for the weekend of the 18th','Thandi',(date_trunc('day', now()) + interval '1 days')::date,'open',true);
insert into public.transcript_tags (transcript_id, tag_id, business_id)
select 'fa625292-7dbd-4edd-a9c7-ca689c1c3dda', id, 'dbdbdbdb-0000-4000-8000-000000000001' from public.tags where business_id='dbdbdbdb-0000-4000-8000-000000000001' and name='quote';
insert into public.transcript_tags (transcript_id, tag_id, business_id)
select 'fa625292-7dbd-4edd-a9c7-ca689c1c3dda', id, 'dbdbdbdb-0000-4000-8000-000000000001' from public.tags where business_id='dbdbdbdb-0000-4000-8000-000000000001' and name='maintenance';
insert into public.calls (id, business_id, whatsapp_number_id, meta_call_id, direction,
  counterparty_bsuid, counterparty_phone, started_at, ended_at, duration_seconds, status, transcription_enabled)
values ('0c4383d1-45cd-4ca6-8b71-7df1ed8f5079','dbdbdbdb-0000-4000-8000-000000000001','dbdbdbdb-1111-4000-8000-000000000001','wacid.DEMO.contractor-access','user_initiated',
  'BSUID_CONTRACTOR-ACCESS','27826667788',
  date_trunc('minute', (date_trunc('day', now()) - interval '24 days' + interval '7 hours 45 minutes')), date_trunc('minute', (date_trunc('day', now()) - interval '24 days' + interval '7 hours 45 minutes')) + interval '110 seconds',
  110, 'COMPLETED', true);
insert into public.transcripts (id, business_id, call_id, meta_media_id, media_sha256, language,
  confidence, duration_seconds, full_text, raw, fetched_at, status, title, summary, summary_model,
  summarized_at, summary_status)
values ('3721c63a-7fa6-489f-8380-9244c142f1be','dbdbdbdb-0000-4000-8000-000000000001','0c4383d1-45cd-4ca6-8b71-7df1ed8f5079','DEMO-MEDIA-contractor-access','seeded-contractor-access','af',
  0.94, 110.78, '[Customer] Thandi, dis Marieke. Net gou oor Maandag. [Business] Morning Marieke, go ahead. [Customer] I won''t be home when your painters come. I''ll leave the gate remote with the caretaker, he''s there from six. [Business] Perfect, I''ll tell them to collect it from him. [Customer] And please ask them not to park in front of the garage, my neighbour gets very cross. [Business] I''ll make a note of it. They can park in the visitors'' bays. [Customer] Baie dankie. Totsiens.', '{"metadata": {"processed_at": "seeded", "audio": {"duration": 110.78, "sample_rate": 16000, "channels": 2, "audio_format": "stereo"}}, "transcript": {"text": "[Customer] Thandi, dis Marieke. Net gou oor Maandag. [Business] Morning Marieke, go ahead. [Customer] I won''t be home when your painters come. I''ll leave the gate remote with the caretaker, he''s there from six. [Business] Perfect, I''ll tell them to collect it from him. [Customer] And please ask them not to park in front of the garage, my neighbour gets very cross. [Business] I''ll make a note of it. They can park in the visitors'' bays. [Customer] Baie dankie. Totsiens.", "language": "af", "duration": 110.78, "confidence": 0.94, "segments": [{"id": 1, "speaker": "Customer", "channel": 1, "start": 0.54, "end": 15.28, "text": "Thandi, dis Marieke. Net gou oor Maandag.", "confidence": 0.94}, {"id": 2, "speaker": "Business", "channel": 0, "start": 16.36, "end": 31.1, "text": "Morning Marieke, go ahead.", "confidence": 0.94}, {"id": 3, "speaker": "Customer", "channel": 1, "start": 31.45, "end": 46.19, "text": "I won''t be home when your painters come. I''ll leave the gate remote with the caretaker, he''s there from six.", "confidence": 0.96}, {"id": 4, "speaker": "Business", "channel": 0, "start": 46.58, "end": 61.32, "text": "Perfect, I''ll tell them to collect it from him.", "confidence": 0.9}, {"id": 5, "speaker": "Customer", "channel": 1, "start": 62.18, "end": 76.92, "text": "And please ask them not to park in front of the garage, my neighbour gets very cross.", "confidence": 0.96}, {"id": 6, "speaker": "Business", "channel": 0, "start": 77.86, "end": 92.6, "text": "I''ll make a note of it. They can park in the visitors'' bays.", "confidence": 0.96}, {"id": 7, "speaker": "Customer", "channel": 1, "start": 93.48, "end": 108.22, "text": "Baie dankie. Totsiens.", "confidence": 0.9}]}}'::jsonb,
  date_trunc('minute', (date_trunc('day', now()) - interval '24 days' + interval '7 hours 45 minutes')) + interval '155 seconds', 'ready',
  'Access arrangement for the painters', 'Marieke confirmed she will leave the gate remote with the caretaker so the painters can get in on Monday. She asked that they not park in front of the garage.', 'seeded-demo-content',
  date_trunc('minute', (date_trunc('day', now()) - interval '24 days' + interval '7 hours 45 minutes')) + interval '200 seconds', 'ready');
update public.transcripts set created_at = date_trunc('minute', (date_trunc('day', now()) - interval '24 days' + interval '7 hours 45 minutes'))
  + interval '170 seconds' where id = '3721c63a-7fa6-489f-8380-9244c142f1be';
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','3721c63a-7fa6-489f-8380-9244c142f1be',0,'seg-1','Customer',1,
  0.54,15.28,'Thandi, dis Marieke. Net gou oor Maandag.',0.94);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','3721c63a-7fa6-489f-8380-9244c142f1be',1,'seg-2','Business',0,
  16.36,31.1,'Morning Marieke, go ahead.',0.94);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','3721c63a-7fa6-489f-8380-9244c142f1be',2,'seg-3','Customer',1,
  31.45,46.19,'I won''t be home when your painters come. I''ll leave the gate remote with the caretaker, he''s there from six.',0.96);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','3721c63a-7fa6-489f-8380-9244c142f1be',3,'seg-4','Business',0,
  46.58,61.32,'Perfect, I''ll tell them to collect it from him.',0.9);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','3721c63a-7fa6-489f-8380-9244c142f1be',4,'seg-5','Customer',1,
  62.18,76.92,'And please ask them not to park in front of the garage, my neighbour gets very cross.',0.96);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','3721c63a-7fa6-489f-8380-9244c142f1be',5,'seg-6','Business',0,
  77.86,92.6,'I''ll make a note of it. They can park in the visitors'' bays.',0.96);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','3721c63a-7fa6-489f-8380-9244c142f1be',6,'seg-7','Customer',1,
  93.48,108.22,'Baie dankie. Totsiens.',0.9);
insert into public.action_items (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values ('dbdbdbdb-0000-4000-8000-000000000001','3721c63a-7fa6-489f-8380-9244c142f1be','Tell the painting team to collect the remote from the caretaker','Sipho',null,'done',true);
insert into public.calls (id, business_id, whatsapp_number_id, meta_call_id, direction,
  counterparty_bsuid, counterparty_phone, started_at, ended_at, duration_seconds, status, transcription_enabled)
values ('2ec8b3bb-1786-4809-b93f-06282c37c20e','dbdbdbdb-0000-4000-8000-000000000001','dbdbdbdb-1111-4000-8000-000000000001','wacid.DEMO.statement-query','user_initiated',
  'BSUID_STATEMENT-QUERY','27715552233',
  date_trunc('minute', (date_trunc('day', now()) - interval '27 days' + interval '11 hours 20 minutes')), date_trunc('minute', (date_trunc('day', now()) - interval '27 days' + interval '11 hours 20 minutes')) + interval '423 seconds',
  423, 'COMPLETED', true);
insert into public.transcripts (id, business_id, call_id, meta_media_id, media_sha256, language,
  confidence, duration_seconds, full_text, raw, fetched_at, status, title, summary, summary_model,
  summarized_at, summary_status)
values ('a1944bb5-3b1c-4f33-a8a6-174b872bbaad','dbdbdbdb-0000-4000-8000-000000000001','2ec8b3bb-1786-4809-b93f-06282c37c20e','DEMO-MEDIA-statement-query','seeded-statement-query','en',
  0.9, 423.0, '[Customer] Hi, I think I''ve been charged twice for something. [Business] Let''s have a look. Your name and unit? [Customer] Anele Mbeki, unit three, the Killarney block. [Business] Right, I''ve got your September statement open. What are you seeing? [Customer] The special levy. Two thousand four hundred, and then again two thousand four hundred. [Business] I see it. Once on the second and once on the fourth. [Customer] So it is a mistake? [Business] It is, and it''s ours. It looks like it was captured twice when the batch ran. [Customer] I was worried I''d have to prove something. [Business] Not at all, it''s plain on the statement. I''ll credit the second one today and send you a corrected statement. [Customer] And my debit order? It goes off on the first. [Business] I''ll have it adjusted before then so the correct amount goes off. If anything does come off twice we refund it, but it shouldn''t get that far. [Customer] Thank you, that''s a relief.', '{"metadata": {"processed_at": "seeded", "audio": {"duration": 423.0, "sample_rate": 16000, "channels": 2, "audio_format": "stereo"}}, "transcript": {"text": "[Customer] Hi, I think I''ve been charged twice for something. [Business] Let''s have a look. Your name and unit? [Customer] Anele Mbeki, unit three, the Killarney block. [Business] Right, I''ve got your September statement open. What are you seeing? [Customer] The special levy. Two thousand four hundred, and then again two thousand four hundred. [Business] I see it. Once on the second and once on the fourth. [Customer] So it is a mistake? [Business] It is, and it''s ours. It looks like it was captured twice when the batch ran. [Customer] I was worried I''d have to prove something. [Business] Not at all, it''s plain on the statement. I''ll credit the second one today and send you a corrected statement. [Customer] And my debit order? It goes off on the first. [Business] I''ll have it adjusted before then so the correct amount goes off. If anything does come off twice we refund it, but it shouldn''t get that far. [Customer] Thank you, that''s a relief.", "language": "en", "duration": 423.0, "confidence": 0.9, "segments": [{"id": 1, "speaker": "Customer", "channel": 1, "start": 1.56, "end": 33.31, "text": "Hi, I think I''ve been charged twice for something.", "confidence": 0.89}, {"id": 2, "speaker": "Business", "channel": 0, "start": 33.99, "end": 65.74, "text": "Let''s have a look. Your name and unit?", "confidence": 0.92}, {"id": 3, "speaker": "Customer", "channel": 1, "start": 66.76, "end": 98.51, "text": "Anele Mbeki, unit three, the Killarney block.", "confidence": 0.97}, {"id": 4, "speaker": "Business", "channel": 0, "start": 99.49, "end": 131.24, "text": "Right, I''ve got your September statement open. What are you seeing?", "confidence": 0.96}, {"id": 5, "speaker": "Customer", "channel": 1, "start": 131.41, "end": 163.16, "text": "The special levy. Two thousand four hundred, and then again two thousand four hundred.", "confidence": 0.9}, {"id": 6, "speaker": "Business", "channel": 0, "start": 163.82, "end": 195.57, "text": "I see it. Once on the second and once on the fourth.", "confidence": 0.88}, {"id": 7, "speaker": "Customer", "channel": 1, "start": 195.84, "end": 227.59, "text": "So it is a mistake?", "confidence": 0.92}, {"id": 8, "speaker": "Business", "channel": 0, "start": 228.01, "end": 259.76, "text": "It is, and it''s ours. It looks like it was captured twice when the batch ran.", "confidence": 0.88}, {"id": 9, "speaker": "Customer", "channel": 1, "start": 260.38, "end": 292.13, "text": "I was worried I''d have to prove something.", "confidence": 0.89}, {"id": 10, "speaker": "Business", "channel": 0, "start": 292.31, "end": 324.06, "text": "Not at all, it''s plain on the statement. I''ll credit the second one today and send you a corrected statement.", "confidence": 0.9}, {"id": 11, "speaker": "Customer", "channel": 1, "start": 324.8, "end": 356.55, "text": "And my debit order? It goes off on the first.", "confidence": 0.95}, {"id": 12, "speaker": "Business", "channel": 0, "start": 356.7, "end": 388.45, "text": "I''ll have it adjusted before then so the correct amount goes off. If anything does come off twice we refund it, but it shouldn''t get that far.", "confidence": 0.85}, {"id": 13, "speaker": "Customer", "channel": 1, "start": 388.6, "end": 420.35, "text": "Thank you, that''s a relief.", "confidence": 0.85}]}}'::jsonb,
  date_trunc('minute', (date_trunc('day', now()) - interval '27 days' + interval '11 hours 20 minutes')) + interval '468 seconds', 'ready',
  'Statement query — duplicate levy charge', 'Anele was charged the special levy twice on her September statement. Thandi checked and confirmed a duplicate capture on our side, credited R2 400, and will send a corrected statement. Anele''s debit order should be adjusted before the first.', 'seeded-demo-content',
  date_trunc('minute', (date_trunc('day', now()) - interval '27 days' + interval '11 hours 20 minutes')) + interval '513 seconds', 'ready');
update public.transcripts set created_at = date_trunc('minute', (date_trunc('day', now()) - interval '27 days' + interval '11 hours 20 minutes'))
  + interval '483 seconds' where id = 'a1944bb5-3b1c-4f33-a8a6-174b872bbaad';
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','a1944bb5-3b1c-4f33-a8a6-174b872bbaad',0,'seg-1','Customer',1,
  1.56,33.31,'Hi, I think I''ve been charged twice for something.',0.89);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','a1944bb5-3b1c-4f33-a8a6-174b872bbaad',1,'seg-2','Business',0,
  33.99,65.74,'Let''s have a look. Your name and unit?',0.92);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','a1944bb5-3b1c-4f33-a8a6-174b872bbaad',2,'seg-3','Customer',1,
  66.76,98.51,'Anele Mbeki, unit three, the Killarney block.',0.97);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','a1944bb5-3b1c-4f33-a8a6-174b872bbaad',3,'seg-4','Business',0,
  99.49,131.24,'Right, I''ve got your September statement open. What are you seeing?',0.96);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','a1944bb5-3b1c-4f33-a8a6-174b872bbaad',4,'seg-5','Customer',1,
  131.41,163.16,'The special levy. Two thousand four hundred, and then again two thousand four hundred.',0.9);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','a1944bb5-3b1c-4f33-a8a6-174b872bbaad',5,'seg-6','Business',0,
  163.82,195.57,'I see it. Once on the second and once on the fourth.',0.88);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','a1944bb5-3b1c-4f33-a8a6-174b872bbaad',6,'seg-7','Customer',1,
  195.84,227.59,'So it is a mistake?',0.92);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','a1944bb5-3b1c-4f33-a8a6-174b872bbaad',7,'seg-8','Business',0,
  228.01,259.76,'It is, and it''s ours. It looks like it was captured twice when the batch ran.',0.88);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','a1944bb5-3b1c-4f33-a8a6-174b872bbaad',8,'seg-9','Customer',1,
  260.38,292.13,'I was worried I''d have to prove something.',0.89);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','a1944bb5-3b1c-4f33-a8a6-174b872bbaad',9,'seg-10','Business',0,
  292.31,324.06,'Not at all, it''s plain on the statement. I''ll credit the second one today and send you a corrected statement.',0.9);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','a1944bb5-3b1c-4f33-a8a6-174b872bbaad',10,'seg-11','Customer',1,
  324.8,356.55,'And my debit order? It goes off on the first.',0.95);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','a1944bb5-3b1c-4f33-a8a6-174b872bbaad',11,'seg-12','Business',0,
  356.7,388.45,'I''ll have it adjusted before then so the correct amount goes off. If anything does come off twice we refund it, but it shouldn''t get that far.',0.85);
insert into public.transcript_segments (business_id, transcript_id, segment_index,
  meta_segment_id, speaker, channel, start_seconds, end_seconds, text, confidence)
values ('dbdbdbdb-0000-4000-8000-000000000001','a1944bb5-3b1c-4f33-a8a6-174b872bbaad',12,'seg-13','Customer',1,
  388.6,420.35,'Thank you, that''s a relief.',0.85);
insert into public.action_items (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values ('dbdbdbdb-0000-4000-8000-000000000001','a1944bb5-3b1c-4f33-a8a6-174b872bbaad','Credit the duplicate R2 400 special levy on Anele''s account','Lindiwe',null,'done',true);
insert into public.action_items (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values ('dbdbdbdb-0000-4000-8000-000000000001','a1944bb5-3b1c-4f33-a8a6-174b872bbaad','Send Anele a corrected September statement','Lindiwe',null,'done',true);
insert into public.action_items (business_id, transcript_id, text, owner, due_date, status, is_ai_generated)
values ('dbdbdbdb-0000-4000-8000-000000000001','a1944bb5-3b1c-4f33-a8a6-174b872bbaad','Adjust Anele''s debit order before the first of the month','Lindiwe',(date_trunc('day', now()) + interval '4 days')::date,'open',true);
insert into public.calls (id, business_id, whatsapp_number_id, meta_call_id, direction,
  counterparty_bsuid, counterparty_phone, started_at, ended_at, duration_seconds, status, transcription_enabled)
values ('3e34953e-0bd8-499b-acef-5ceaf5c80a3d','dbdbdbdb-0000-4000-8000-000000000001','dbdbdbdb-1111-4000-8000-000000000001','wacid.DEMO.failed-dl','user_initiated',
  'BSUID_FAILED','27828889900', date_trunc('minute', (date_trunc('day', now()) - interval '1 days' + interval '15 hours 10 minutes')),
  date_trunc('minute', (date_trunc('day', now()) - interval '1 days' + interval '15 hours 10 minutes')) + interval '1500 seconds', 1500, 'COMPLETED', true);
insert into public.transcripts (id, business_id, call_id, meta_media_id, media_sha256,
  full_text, raw, fetched_at, status, summary_status)
values ('2ed37a42-5535-4b9c-b9ae-8a4b6403d2c1','dbdbdbdb-0000-4000-8000-000000000001','3e34953e-0bd8-499b-acef-5ceaf5c80a3d','1002764438290117','Zk1nT2pQrS4uVwXyZaBcDeFgHiJkLmNoPqRsTuVwXyA=', null, null, null, 'failed', 'pending');
commit;
