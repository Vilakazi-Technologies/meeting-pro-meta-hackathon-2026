# Judge demo readiness — what “only IDs” really means

## Your mental model (corrected)

| Item | In Meeting Pro app? | Required for live WhatsApp? |
|------|---------------------|-----------------------------|
| **WABA ID** | Yes — Connect WhatsApp | Yes |
| **Phone number ID** | Yes — Connect WhatsApp | Yes — webhook routes by this |
| **Display phone** (E.164) | Yes — Connect WhatsApp | Yes |
| **App ID** | **No** — not stored in app | Only for Meta dashboard / webhook UI |
| **App secret** | **No** (Supabase only) | Yes — `META_APP_SECRET` |
| **Access token** | **No** (Supabase only) | Yes — download transcripts |
| **Verify token** | **No** (you invent) | Yes — webhook GET verify |

**Connect WhatsApp** (`register_whatsapp_number`) links your **Clerk user** → **business** → **`whatsapp_numbers` row**. Without that row, webhooks are accepted but **ignored** (“unknown tenant”).

**One-time ops** (whoever has Meta access, not judges): deploy `whatsapp-webhook`, `npm run supabase:secrets`, subscribe Meta webhook to your Supabase URL, enable **Calling + transcription** on the Cloud API number.

---

## Option 1 — Fastest demo (mock data, no Supabase)

**Best for:** quick local recording, no database setup, Meta still blocked.

**What judges see:** Full VILATECH UI, 14-style demo calls/transcripts in memory, dashboard metrics, Archive search, Connect WhatsApp succeeds without Meta.

### Prerequisites

- Clerk app with **JWT template named `supabase`** (only needed if you later switch to Option 2; mock does not call Supabase).
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in `.env` (and on Vercel if you demo prod URL).

### Steps

1. In **`.env`** set:
   ```env
   EXPO_PUBLIC_DATA_SOURCE=mock
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```
   You do **not** need `EXPO_PUBLIC_SUPABASE_URL` or `EXPO_PUBLIC_SUPABASE_ANON_KEY` for mock.

2. Install and run:
   ```bash
   npm install
   npm run web:clear
   ```
   Open the URL Expo prints (usually `http://localhost:8081`).

3. **Sign in** with Clerk (Google or email).

4. Walk the demo:
   - **Home** — metrics + WhatsApp badge (demo connected)
   - **Calls** — call list + transcript states
   - **Open a transcript** — segments, summary, action items
   - **Archive** — search
   - **Settings → Connect WhatsApp** — submit any plausible IDs (saved as success only in mock)

5. **Optional (Muse story without live WhatsApp):** `MODEL_API_KEY` on Supabase + `npm run verify:meta` — use only if you force-summarize a transcript via Edge Function; Khaya seed summaries are pre-written, not Muse.

### Limitations

- No real RLS / multi-tenant Postgres story.
- Data resets when you reload (in-memory demo sources).
- Not the same as production Vercel unless you also set `EXPO_PUBLIC_DATA_SOURCE=mock` there (usually you use Option 2 on prod).

---

## Option 2 — Stronger demo (Supabase + Khaya seed + RLS)

**Best for:** judges, Vercel prod URL, “real app on real database” pitch.

**What judges see:** **Khaya Property Services** — 14 WhatsApp calls, 13 transcribed, 1 **failed** (Retry button), tags, action items, WhatsApp “Connected” from seed data.

**Supabase project:** `mjxfpovawoztumfcblhm`  
**Demo business id:** `dbdbdbdb-0000-4000-8000-000000000001`

### Prerequisites

- Clerk **JWT template `supabase`** + Supabase **Third-party auth → Clerk** connected ([CLERK_SETUP.md](./CLERK_SETUP.md)).
- Supabase URL + anon key in `.env` and Vercel.
- **Clerk DB migration applied** on project `mjxfpovawoztumfcblhm`. If `insert … clerk_user_id` fails with *column does not exist*, run the full file `supabase/migrations/20261019120000_clerk_third_party_auth.sql` in the SQL Editor (once).

### Steps

1. In **`.env`** set:
   ```env
   EXPO_PUBLIC_DATA_SOURCE=supabase
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   EXPO_PUBLIC_SUPABASE_URL=https://mjxfpovawoztumfcblhm.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

2. **Load demo data** (Supabase Dashboard → **SQL** → New query):
   - Paste and run the full file `supabase/seed/demo_khaya.sql`  
   - **Duplicate key on `calls_pkey`?** The seed already loaded — **skip step 2** and go to step 3. To start fresh: run `supabase/seed/demo_khaya_reset.sql`, then `demo_khaya.sql` again.
   - Or from a machine with `psql`:
     ```bash
     psql "$DATABASE_URL" -f supabase/seed/demo_khaya_reset.sql   # only if re-seeding
     psql "$DATABASE_URL" -f supabase/seed/demo_khaya.sql
     ```

3. **Link your Clerk user** to Khaya (same SQL editor).  
   Get your Clerk user id: Clerk Dashboard → **Users** → your user → **User ID** (`user_…`), or from the Clerk user object after sign-in.

   ```sql
   insert into public.business_members (business_id, clerk_user_id, role)
   values (
     'dbdbdbdb-0000-4000-8000-000000000001',
     'user_REPLACE_WITH_YOURS',
     'owner'
   );
   ```

   **Important:** The app uses your **earliest** `business_members` row. For Khaya-only demo, use **only** this insert (or remove other memberships you created while testing Connect WhatsApp).

4. Restart the app with a clean bundle:
   ```bash
   npm run web:clear
   ```

5. **Sign in** with the **same** Clerk account you used in step 3.

6. Verify:
   - **Settings** — business name **Khaya Property Services**, WhatsApp **Connected**, number `+27 11 234 5678` (formatted from seed).
   - **Calls** — multiple recent calls; open **failed** transcript → **Retry download** (honest failure demo).
   - **Home** — non-zero call volume.

7. **Optional — live Muse on a transcript:** `MODEL_API_KEY` on Supabase (`npm run supabase:secrets`), deploy `summarize-transcript`, then force-summarize a transcript id via API (see README). Khaya rows use `summary_model = seeded-demo-content` until you do that.

8. **Vercel:** same four `EXPO_PUBLIC_*` vars as step 1, `DATA_SOURCE=supabase`, redeploy.

### Do not (for Khaya demo)

- Do not use **Connect WhatsApp** unless you intend to create a **second** business (RPC creates a new workspace if you have no membership).
- Do not paste Meta hackathon **Project/Team/Business Suite** IDs into WABA fields.

---

## Option 3 — Live WhatsApp (after Meta unlocks)

Everything in Option 2 (or your own business via **Connect WhatsApp**), plus:

- [ ] `META_APP_SECRET`, `META_VERIFY_TOKEN`, `META_ACCESS_TOKEN` in `supabase/.env.secrets` → `npm run supabase:secrets`
- [ ] `npx supabase functions deploy whatsapp-webhook --no-verify-jwt --project-ref mjxfpovawoztumfcblhm`
- [ ] Meta webhook → `https://mjxfpovawoztumfcblhm.supabase.co/functions/v1/whatsapp-webhook` (verified, **calls** subscribed)
- [ ] Real **WABA** + **phone number ID** + display phone in Connect form (or SQL row matching Meta)
- [ ] Test call on Cloud API number

---

## 90s demo flow (see META_HACKATHON_STARTUP.md)

1. Problem — WhatsApp calls vanish after hang-up  
2. Architecture — Cloud API → webhook → Supabase → app (no on-device recording)  
3. App — Sign in → Home metrics → **Calls** → transcript → **AI Summary** → Archive search  
4. Honesty — **Retry download** on failed transcript  
5. Close — Muse Spark minutes + multi-tenant RLS  

---

## App features audit (what is real today)

| Feature | Status |
|---------|--------|
| Clerk sign-in (web + native patterns) | Implemented |
| VILATECH branding, light/dark | Implemented |
| Home dashboard (volume, answer rate, WhatsApp badge) | Live data or mock |
| Calls tab (history, transcript state) | Realtime on Supabase |
| Transcript detail (segments, summary, action items) | Real + retry edge function |
| Archive search | Implemented |
| Contacts | Implemented |
| Settings (minutes email prefs, theme) | Implemented |
| Connect WhatsApp (WABA + phone ID + display) | RPC — needs migration on project |
| Live call UI during ring | **Not** — Meta sends transcript after call ends |
| In-app Meta OAuth | **Not** — manual IDs + secrets |
| Voice notes | **Not** in scope |

---

## Quick verify before presenting

```bash
npm run preflight
npm run typecheck
npm run verify:meta
npm run web:clear
```

Production URL: ensure Vercel has Clerk + Supabase `EXPO_PUBLIC_*` vars (redeploy if UI is stale).
