# Meta: two different places (hackathon vs WhatsApp)

Meeting Pro uses **two separate Meta surfaces**. They do **not** share the same IDs or the same dashboard.

## 1) Meta AI / hackathon (models & credits)

**Where:** [meta.ai](https://meta.ai) developer / hackathon console — API keys, **Project ID**, **Team ID**, Muse models.

| Item | Used for | Meeting Pro |
|------|----------|-------------|
| **API key** (`LLM_…`) | Muse Spark summaries | `MODEL_API_KEY` on **Supabase Edge** only (`supabase/.env.secrets` → `npm run supabase:secrets`) |
| **Project ID** | Hackathon / Model API project | Optional `.env` → `EXPO_PUBLIC_META_AI_PROJECT_ID` (e.g. `4461978980686624`) |
| **Team ID** | Model API team (meta.ai console) | Optional `.env` → `EXPO_PUBLIC_META_AI_TEAM_ID` (e.g. `982784567583723`) |
| **Business Suite business ID** | Portfolio in [business.facebook.com](https://business.facebook.com/) | Optional `.env` → `EXPO_PUBLIC_META_BUSINESS_SUITE_ID` (e.g. `1143947790925807`) — **not** WABA, not Project ID |

You will **not** find WhatsApp App Secret, webhook verify token, or WhatsApp access token on this screen — that is expected.

**Credits:** Used when `summarize-transcript` runs on Supabase after a transcript exists. Check usage in the same Meta AI / project area where you created the API key.

---

## 2) WhatsApp Business Cloud API (calls & transcripts)

**Where:** [developers.facebook.com/apps/](https://developers.facebook.com/apps/) → **your** app (create one if empty) → **WhatsApp** → **API Setup**.

If links show “page not found”, read **[META_DEVELOPER_WHATSAPP_ACCESS.md](./META_DEVELOPER_WHATSAPP_ACCESS.md)** — do not use Business Suite ID or Model API Team ID as WABA.

Also useful: [business.facebook.com](https://business.facebook.com/) → **Settings** → **Accounts** → **WhatsApp accounts** (ownership and phone lines — not the same as copying tokens).

| Item | Where to get it | Meeting Pro |
|------|-----------------|-------------|
| **WhatsApp Business Account ID** (WABA) | Developer app → WhatsApp → **API Setup** | App **Connect WhatsApp** → WABA field |
| **Phone number ID** | Same **API Setup** page (different number than WABA) | Connect form → Phone number ID |
| **Display number** (E.164) | Same page | Connect form → Display phone |
| **App Secret** | Developer app → **App settings** → **Basic** | `META_APP_SECRET` (Supabase secrets) |
| **Access token** | API Setup (temporary) or **Business settings** → **System users** (permanent) | `META_ACCESS_TOKEN` (Supabase secrets) |
| **Verify token** | **You invent a random string** | Same string in Meta webhook UI + `META_VERIFY_TOKEN` |

**Webhook URL** (after deploying `whatsapp-webhook`):

`https://mjxfpovawoztumfcblhm.supabase.co/functions/v1/whatsapp-webhook`

---

## Common mistake

| ID | Wrong use |
|----|-----------|
| Meta AI **Project ID** | Do **not** paste into WABA field in the app |
| Meta AI **Team ID** | Do **not** paste into WABA field |
| **WABA ID** | Only from **developers.facebook.com** WhatsApp API Setup |

---

## Quick checklist

- [ ] `MODEL_API_KEY` on Supabase (`npm run verify:meta` → Muse OK)
- [ ] `META_APP_SECRET`, `META_VERIFY_TOKEN`, `META_ACCESS_TOKEN` in `supabase/.env.secrets` → `npm run supabase:secrets`
- [ ] WhatsApp webhook verified and subscribed to **calls** fields
- [ ] In app: real **WABA ID** + **Phone number ID** + display phone → **Connect number**

See also [WHATSAPP_BUSINESS_SETUP.md](./WHATSAPP_BUSINESS_SETUP.md).
