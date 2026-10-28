# After Meta Social Technologies MCP is connected

Use this runbook when **developers.facebook.com links break** but **Cursor → Meta Social Technologies MCP** is authenticated.

Meeting Pro still needs the same data; MCP replaces **some** dashboard steps **after** an app exists — it does **not** replace creating the first app if OAuth had nothing to grant.

**No apps yet?** Read **[META_CREATE_FIRST_APP.md](./META_CREATE_FIRST_APP.md)** first (browser **Create App**, then reconnect MCP).

---

## Phase 0 — Confirm MCP can see an app

In Cursor, ask the agent to run **`devtools_app_list`**.

| Result | What to do |
|--------|------------|
| **One or more apps** | Pick the app with **WhatsApp** use case → note **App ID** → go to Phase 1 |
| **Empty list** | MCP is connected but **no app is granted** (or none exists yet) |

**Empty list fix**

1. **Cursor → Settings → Tools & MCP → Meta Social Technologies** → **Reconnect** / sign in again.
2. On Meta’s consent screen: grant **business portfolio** access and **every Developer app** you want (or create a new app in that flow if offered).
3. If still empty: in a **new chat**, ask explicitly:

   > Create a Meta Developer app named **Meeting Pro VILATECH** for **WhatsApp Business messaging**, link portfolio **1143947790925807**, add the WhatsApp use case. I approve each write step.

   (Write tools roll out gradually; if the agent has no create tools, finish app creation in **business.facebook.com → All tools → Apps** or Meta’s mobile Developer entry, then reconnect MCP.)

---

## Phase 1 — Collect IDs (for the app UI)

You need three values for **Settings → Connect WhatsApp**:

| Field | Where |
|-------|--------|
| **WABA ID** | WhatsApp → API Setup → *WhatsApp Business account ID* |
| **Phone number ID** | Same page → *Phone number ID* (test number is OK for hackathon) |
| **Display phone** | E.164, e.g. `+27…` |

Optional prefill in project `.env` (not secrets):

```env
EXPO_PUBLIC_META_WABA_ID=
EXPO_PUBLIC_META_PHONE_NUMBER_ID=
EXPO_PUBLIC_META_DISPLAY_PHONE=
```

**Do not** put Business Suite ID (`1143947790925807`) or Model API Team ID (`982784567583723`) in the WABA field.

MCP does not return **App secret** in chat. Copy it once from **App settings → Basic → App secret** (browser may work as `https://developers.facebook.com/apps/<APP_ID>/settings/basic/`).

---

## Phase 2 — Supabase secrets (backend)

Edit **`supabase/.env.secrets`** (never commit):

```env
META_APP_SECRET=          # from App settings → Basic
META_VERIFY_TOKEN=        # you invent, e.g. vilatech-wa-verify-2026
META_ACCESS_TOKEN=        # API Setup → Generate token (or system user token)
MODEL_API_KEY=            # already set for Muse
```

Push to Supabase:

```bash
npm run supabase:secrets
```

---

## Phase 3 — Deploy webhook function

```bash
npx supabase@latest functions deploy whatsapp-webhook --no-verify-jwt --project-ref mjxfpovawoztumfcblhm
```

Callback URL (paste into Meta or MCP webhook subscribe):

`https://mjxfpovawoztumfcblhm.supabase.co/functions/v1/whatsapp-webhook`

---

## Phase 4 — Webhook via MCP (after `app_id` is known)

Ask the agent (with your **App ID**):

1. `devtools_webhook_list` → `list_topics` — find the **WhatsApp** topic and **calls** / transcription fields.
2. `devtools_webhook_manage` → `subscribe` with:
   - `callback_url` = URL above
   - `verify_token` = same as `META_VERIFY_TOKEN` in secrets
   - fields Meta documents for **calling** and **`call_transcription_available`**

3. `devtools_webhook_test` → send a test payload after subscribe succeeds.

If subscribe fails verification: redeploy webhook, re-run `npm run supabase:secrets`, confirm `META_VERIFY_TOKEN` matches exactly.

---

## Phase 5 — Link number in Meeting Pro

1. Sign in with Clerk.
2. Open **Connect WhatsApp** → submit WABA, phone number ID, display phone.
3. `npm run verify:meta` should still pass for summaries.

---

## Phase 6 — Smoke test

1. Place a **test call** to your Cloud API number (test numbers only reach allowed testers).
2. In app: **Calls / Minutes** — transcript should appear after Meta sends the webhook.
3. Summary runs via **`summarize-transcript`** (Muse).

---

## What MCP vs manual

| Task | MCP | You |
|------|-----|-----|
| Create app + WhatsApp use case | Agent write tools (when available) | Approve prompts |
| App secret | — | Dashboard once |
| Access token | — | API Setup or system user |
| Webhook subscribe | `devtools_webhook_manage` | Provide verify token + URL |
| `whatsapp_numbers` row | — | **Connect WhatsApp** in app (RPC) |

See also [META_IDS.md](./META_IDS.md), [WHATSAPP_BUSINESS_SETUP.md](./WHATSAPP_BUSINESS_SETUP.md).
