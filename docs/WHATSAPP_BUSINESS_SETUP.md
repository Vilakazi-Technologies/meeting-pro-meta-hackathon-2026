# Connect WhatsApp Business to Meeting Pro (step by step)

Meeting Pro does **not** plug into the WhatsApp app on your phone. It reads **call transcripts** that **Meta** produces for a **WhatsApp Business Cloud API** number. Setup is **Meta + Supabase + one database row** linking your Clerk user to that number.

**Time:** roughly 1–2 hours the first time (Meta review and phone verification can add days).

---

## What you need before you start

| Item | Why |
|------|-----|
| [Meta Business Portfolio](https://business.facebook.com/) | Owns the WhatsApp Business Account (WABA) |
| [Meta Developer app](https://developers.facebook.com/) | WhatsApp product + webhooks |
| A **dedicated business phone number** | Registered on Cloud API (not your personal WhatsApp) |
| **Meeting Pro** signed in (Clerk) | App identity |
| **Supabase** project (e.g. `duurebydckodwznnmwoc`) | Database + Edge Functions |
| Admin access to run SQL / `supabase` CLI | Link number to your `business_id` |

Personal WhatsApp calls **never** appear in Meeting Pro. Only calls on the **linked Cloud API number**.

---

## Part A — Meta (WhatsApp Cloud API)

### 1. Create or open your Meta Developer app

**If you get “page not found” on Developer links**, follow [META_DEVELOPER_WHATSAPP_ACCESS.md](./META_DEVELOPER_WHATSAPP_ACCESS.md) first.

1. Open **https://developers.facebook.com/apps/** (apps list — not a bookmarked deep link).
2. **Create App** if empty → use case **Connect with customers through WhatsApp** ([Cloud API get started](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started/)).
3. In the app: **WhatsApp** → **API Setup**.

### 2. WhatsApp Business Account (WABA) and phone number

1. In the app: **WhatsApp** → **API Setup** (or **Getting Started**).
2. Connect or create a **WhatsApp Business Account**.
3. Add a **phone number** (voice/SMS verification). This is the line customers call on WhatsApp Business.
4. Note these IDs from the dashboard (you will need them for Supabase):
   - **WhatsApp Business Account ID** (`waba_id`)
   - **Phone number ID** (`phone_number_id`) — not the E.164 digits alone
   - **Display phone number** (E.164, e.g. `27123456789`)

### 3. Enable calling and call transcription

1. In Meta’s **Calling** / WhatsApp Calling documentation for Cloud API, enable **Calling** for your number (Business-initiated and/or user-initiated per your policy).
2. Enable **call transcription** on calls (Meta transcribes on **their** servers after the call ends).
3. Confirm your app has permissions/scopes required for **calls** webhooks and transcript media download.

Exact menu names change; search Meta docs for: *WhatsApp Cloud API calling*, *call transcription*, *call_transcription_available*.

### 4. Permanent access token

1. **System User** in Business Settings with access to the WABA, or use a long-lived token flow Meta documents for your app mode (Development vs Live).
2. Create a token with `whatsapp_business_messaging` / calling-related scopes as required.
3. Store it only in **Supabase secrets** (see Part B) — never in Expo, Vercel, or git.

### 5. Webhook subscription

1. **WhatsApp** → **Configuration** → **Webhook**.
2. **Callback URL** (dev example):

   `https://duurebydckodwznnmwoc.supabase.co/functions/v1/whatsapp-webhook`

   (Replace with your Supabase project ref in production.)

3. **Verify token:** choose a random string (e.g. `meeting-pro-verify-…`) — same value as Supabase secret `META_VERIFY_TOKEN`.
4. **App Secret** from Meta app settings → Supabase secret `META_APP_SECRET`.
5. Subscribe to webhook fields related to **calls** (and statuses Meta documents for calling). Meeting Pro expects events that include call lifecycle and **`call_transcription_available`** (see [META_WHATSAPP_CLOUD.md](./META_WHATSAPP_CLOUD.md)).

6. Click **Verify and save**. Meta sends a GET to your endpoint; the Edge Function must respond with the challenge (deploy function first — Part B).

---

## Part B — Supabase (backend)

### 1. Clerk on Supabase

Follow [CLERK_SETUP.md](./CLERK_SETUP.md): JWT template `supabase`, third-party auth, migrations applied.

### 2. Edge Function secrets

Create `supabase/.env.local` (from `supabase/.env.example`):

```bash
META_APP_SECRET=...
META_VERIFY_TOKEN=...          # same as Meta webhook verify token
META_ACCESS_TOKEN=...          # token to download transcript media
ANTHROPIC_API_KEY=...          # optional: AI meeting minutes summary
RESEND_API_KEY=...             # optional: email minutes
MEETING_MINUTES_FROM=Meeting Pro <minutes@yourdomain.com>
CLERK_SECRET_KEY=...           # Edge only — not in Expo/Vercel
```

Apply secrets and deploy:

```bash
supabase secrets set --env-file supabase/.env.local
supabase functions deploy whatsapp-webhook --no-verify-jwt
supabase functions deploy retry-transcript
supabase functions deploy summarize-transcript
supabase functions deploy send-meeting-minutes --no-verify-jwt
```

### 3. Link your Clerk user to a business

Your signed-in Clerk user must be a row in `business_members` with `clerk_user_id = 'user_…'` (see CLERK_SETUP.md).

Ensure a row exists in `businesses` for your org name.

### 4. Register the WhatsApp number (required — no in-app OAuth yet)

Run in Supabase SQL editor (replace UUIDs and IDs):

```sql
-- Your business id (from businesses table)
-- Your Meta IDs from Part A step 2

insert into public.whatsapp_numbers (
  business_id,
  waba_id,
  phone_number_id,
  display_phone_number,
  is_active
) values (
  '<your-business-uuid>',
  '<waba_id>',
  '<phone_number_id>',
  '<e164_digits_no_plus>',  -- e.g. 27123456789
  true
)
on conflict (phone_number_id) do update set
  is_active = true,
  display_phone_number = excluded.display_phone_number;
```

The webhook routes events by **`phone_number_id`**. If this row is missing, calls will not attach to your account.

---

## Part C — Meeting Pro app

### 1. Environment

In `.env` and Vercel:

```bash
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_DATA_SOURCE=supabase
```

### 2. Confirm in the UI

1. Sign in at [meeting-pro-rho.vercel.app](https://meeting-pro-rho.vercel.app).
2. **Settings** → WhatsApp Business should show **Connected** and your display number.
3. **Dashboard** → connection card should match.
4. Place a **test call** to your Business number; after the call ends, wait ~1 minute:
   - **Calls** tab and **Archive** should show the call and transcript (when Meta delivers the webhook).

### 3. Optional: demo data without Meta

For UI-only demos:

```bash
EXPO_PUBLIC_DATA_SOURCE=mock
```

Real WhatsApp connection still requires Part A + B.

---

## Troubleshooting

| Symptom | Check |
|---------|--------|
| Settings says **Not connected** | `whatsapp_numbers` row for your `business_id`, `is_active = true` |
| Webhook verify fails | Function deployed with `--no-verify-jwt`; `META_VERIFY_TOKEN` matches Meta |
| Calls never appear | Webhook subscribed to **calls**; correct `phone_number_id` in DB |
| Transcript **failed** | `META_ACCESS_TOKEN` valid; retry in app; Meta keeps media ~7 days |
| Wrong tenant | Multiple numbers — each `phone_number_id` maps to one `business_id` |

---

## What Meeting Pro does not do (yet)

- OAuth “Connect with Meta” inside the app (number registration is **admin / SQL**).
- Personal WhatsApp or on-device call recording.
- Per-tenant Meta tokens in Vault (single `META_ACCESS_TOKEN` env today).

See also: [VISION_AND_WHATSAPP.md](./VISION_AND_WHATSAPP.md), [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md).
