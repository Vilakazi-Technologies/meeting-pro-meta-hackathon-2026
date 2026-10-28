# PHANKY Final Steps

**For:** Banky (backend / Meta / Supabase)  
**Product:** Meeting Pro — Lumiq Industries  
**Web:** [https://meeting-pro-rho.vercel.app](https://meeting-pro-rho.vercel.app)  
**Repo:** [https://github.com/Lumiq-Industries/meeting-pro](https://github.com/Lumiq-Industries/meeting-pro)

Ayanda has finished the app shell, Clerk sign-in, UI (light/dark), and documentation. **Your job is to wire WhatsApp Business + production secrets so calls and transcripts flow into Supabase.** After this, the product is launch-ready.

---

## 1. Pull latest code

```bash
git clone https://github.com/Lumiq-Industries/meeting-pro.git
cd meeting-pro
git pull origin main
```

App lives in the repo root (Expo 54). Docs index:

| Doc | Purpose |
|-----|---------|
| [WHATSAPP_BUSINESS_SETUP.md](./WHATSAPP_BUSINESS_SETUP.md) | **Start here** — Meta + Supabase step by step |
| [CLERK_SETUP.md](./CLERK_SETUP.md) | Clerk ↔ Supabase JWT |
| [META_WHATSAPP_CLOUD.md](./META_WHATSAPP_CLOUD.md) | Webhook architecture |
| [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) | Full launch list |

---

## 2. Supabase (dev / prod)

1. Apply migrations: `supabase db push`
2. Clerk third-party auth connected (see CLERK_SETUP)
3. Edge secrets (never in Expo or Vercel client bundles):

   - `META_APP_SECRET`
   - `META_VERIFY_TOKEN`
   - `META_ACCESS_TOKEN`
   - `CLERK_SECRET_KEY` (Edge only)
   - `MODEL_API_KEY` (Muse Spark summaries — Meta Model API; preferred)
   - `ANTHROPIC_API_KEY` (summaries fallback only if no MODEL_API_KEY)
   - `RESEND_API_KEY`, `MEETING_MINUTES_FROM` (email minutes)

4. Deploy functions:

   ```bash
   supabase secrets set --env-file supabase/.env.local
   supabase functions deploy whatsapp-webhook --no-verify-jwt
   supabase functions deploy retry-transcript
   supabase functions deploy summarize-transcript
   supabase functions deploy send-meeting-minutes --no-verify-jwt
   ```

5. Webhook URL for Meta:

   `https://<project-ref>.supabase.co/functions/v1/whatsapp-webhook`

---

## 3. Meta — WhatsApp Business Cloud API

Follow [WHATSAPP_BUSINESS_SETUP.md](./WHATSAPP_BUSINESS_SETUP.md) Part A:

1. Developer app → WhatsApp → WABA + **business phone number**
2. Enable **Calling** + **call transcription**
3. Webhook: verify token + app secret match Supabase
4. Subscribe to **calls** (and related) fields
5. Long-lived **access token** → `META_ACCESS_TOKEN`

There is **no in-app “Connect Meta” button yet**. Registration is admin/SQL.

---

## 4. Link number to tenant (SQL)

After Ayanda’s Clerk user exists in `business_members`:

```sql
-- Replace IDs from Meta + businesses table
insert into public.whatsapp_numbers (
  business_id,
  waba_id,
  phone_number_id,
  display_phone_number,
  is_active
) values (
  '<business-uuid>',
  '<waba_id>',
  '<phone_number_id>',
  '<e164_no_plus>',
  true
)
on conflict (phone_number_id) do update set
  is_active = true,
  display_phone_number = excluded.display_phone_number;
```

Ensure `business_members.clerk_user_id` matches the Lumiq account that signs into the app.

---

## 5. Vercel (web app)

Project: **meeting-pro** → production alias **meeting-pro-rho.vercel.app**

Required env vars (same as `.env.example`):

- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_DATA_SOURCE=supabase`

Redeploy after env changes if needed: `npx vercel deploy --prod`

---

## 6. Verification checklist (definition of done)

- [ ] Meta webhook **verified** (green in Meta dashboard)
- [ ] Test call on Business number → row in `calls` table
- [ ] Transcript appears in app **Archive** / **Calls** within ~1–2 minutes
- [ ] Settings shows **WhatsApp Business connected** + correct number
- [ ] Optional: email minutes after `summarize-transcript` + Resend domain verified
- [ ] Ayanda sign-in on prod sees **real data**, not mock

---

## 7. What not to do

- Do **not** put `CLERK_SECRET_KEY` or `META_*` secrets in Vercel `EXPO_PUBLIC_*` or git
- Personal WhatsApp on a phone **does not** integrate — only Cloud API Business number
- Do **not** use Meta’s WhatsApp logo in marketing; app uses **Meeting Pro** icon only

---

## 8. Hand back to Ayanda

When the checklist in §6 is green, message Ayanda: **“Meeting Pro backend live — test call done.”** UI polish remains product-side; functional product is **done**.
