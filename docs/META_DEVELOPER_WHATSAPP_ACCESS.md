# “Page not found” on developers.facebook.com — fix path

If a link says **“Sorry, the link you followed may be broken”**, you are usually hitting a **deep URL** for an app that does not exist yet, or you are not registered as a **Meta developer** on that Facebook login.

Meeting Pro only needs WhatsApp **after** you have a **Developer app** with the **WhatsApp** product. Your **Business Suite ID** (`1143947790925807`) and **Model API Team ID** (`982784567583723`) do **not** replace that.

---

## Option A — Let Cursor set up the app (Social Technologies MCP)

Meta’s [Oct 26, 2026 blog post](https://developers.facebook.com/blog/post/2026/10/26/new-on-social-technologies-mcp/) adds **write tools** so an agent can:

- Create a Developer app
- Find or create a **Business Portfolio** and link the app
- Add the **WhatsApp Business messaging** use case

You approve each write step in the OAuth flow. This can replace a broken sequence of dashboard clicks.

**What MCP still does *not* give you in chat**

- **App secret** — Meta never returns it from app creation. You still open **App settings → Basic → App secret** once the app exists (dashboard or a link the agent provides).
- **Gradual rollout** — tools may not appear on every account yet; if login fails, use Option B below.

**Connect in Cursor (one time)**

1. **Settings → Tools & Integrations → New MCP Server** (or edit `~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "Meta Social Technologies": {
      "url": "https://mcp.facebook.com/devtools",
      "type": "http"
    }
  }
}
```

2. Click **Needs login** / authenticate → sign in with the **same Facebook account** as Business Suite.
3. On the consent screen, grant access (create a new app if none exist yet).

Optional: install Meta’s **devtools** plugin from the Cursor marketplace ([facebook/agentic-tools](https://github.com/facebook/agentic-tools)) — it bundles the same MCP config and skills.

**Prompt to paste in Cursor after MCP is connected**

> Set me up with a new Meta Developer app for **WhatsApp Business messaging**. Link it to my business portfolio (VILATECH / Business Suite ID `1143947790925807` if you find it). Add the WhatsApp use case. After setup, tell me the **WhatsApp Business Account ID**, **Phone number ID**, and **App ID**, and where to generate the access token and webhook.

Then copy **WABA** and **Phone number ID** into Meeting Pro **Connect WhatsApp**, and fill `supabase/.env.secrets` as in Step 5.

**Full pipeline after MCP login:** [META_MCP_RUNBOOK.md](./META_MCP_RUNBOOK.md)

Docs: [Meta Social Technologies MCP](https://developers.facebook.com/documentation/mcp/devtools-mcp) · [All Meta MCPs](https://developers.facebook.com/documentation/mcp)

---

## Option B — Manual dashboard

### Step 0 — Use the same Facebook login

Log in with the **same person** that owns your Meta Business Suite (the account where you run ads / WhatsApp Business).

Use a normal browser (Chrome/Edge), not an in-app browser. Turn off ad-blockers for `facebook.com` and `developers.facebook.com` if pages fail to load.

---

### Step 1 — Register as a developer (one time)

1. Open **https://developers.facebook.com/** (homepage only — do not paste a long `/apps/...` URL yet).
2. If you see **Get started** or **Register**, complete developer registration (accept terms).
3. You should land on a dashboard or **My Apps**.

If the homepage itself errors, try **https://business.facebook.com/** → menu **All tools** → look for **Developer** or **Apps**, or search Meta Help for “register as Meta developer”.

---

### Step 2 — Open your apps list (not a random app link)

**Correct entry:**

**https://developers.facebook.com/apps/**

- If the list is **empty** → you must **Create App** (Step 3).
- If you see an app → click it → left sidebar **WhatsApp** → **API Setup**.

Do **not** open URLs from old docs that embed a specific app ID unless that app is yours.

---

### Step 3 — Create a Developer app (WhatsApp use case)

1. On **https://developers.facebook.com/apps/** click **Create App**.
2. Choose use case **“Connect with customers through WhatsApp”** (or **Business** then add WhatsApp).
3. Link your **business portfolio** (your Business Suite — ID `1143947790925807` is this layer).
4. Finish creation → you should see **WhatsApp** in the left menu.

Official walkthrough: [WhatsApp Cloud API — Get Started](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started/)

---

### Step 4 — Where WABA ID and Phone number ID appear

Inside **your** app:

**WhatsApp → API Setup** (sometimes labeled **Getting started** on first visit).

On that **one** screen you should see:

| Label on screen | Meeting Pro field |
|-----------------|-------------------|
| WhatsApp Business account ID | WABA ID |
| Phone number ID (under **From** / test number) | Phone number ID |
| Display number | Display phone (E.164) |

**Hackathon demo tip:** Meta often gives a **free test number** on API Setup. Its **Phone number ID is real** and works in Meeting Pro’s Connect form, but only messages/calls allowed for that test setup (limited recipients). Good for judging **architecture + Model API summaries**; not for public production.

---

## Alternative — WhatsApp Manager (Business Suite)

If Developer dashboard is blocked but Business Suite works:

1. **https://business.facebook.com/**
2. **Settings** (gear) → **Accounts** → **WhatsApp accounts**
3. Open your WhatsApp Business account → **Settings** — some layouts show **WhatsApp Business Account ID** (WABA).

You still need a **Developer app** for **App Secret**, **webhook**, and a stable **access token**. WhatsApp Manager alone is not enough for Meeting Pro’s webhook pipeline.

---

### Step 5 — Secrets for Supabase (after the app exists)

| Secret | Where |
|--------|--------|
| `META_APP_SECRET` | Developer app → **App settings** → **Basic** → **App secret** → Show |
| `META_ACCESS_TOKEN` | WhatsApp → API Setup → **Generate access token** (temporary) or Business **System user** (long-lived) |
| `META_VERIFY_TOKEN` | **You choose** any random string; same in webhook config + `supabase/.env.secrets` |

Then:

```bash
npm run supabase:secrets
```

Webhook callback:

`https://mjxfpovawoztumfcblhm.supabase.co/functions/v1/whatsapp-webhook`

---

## Still stuck?

| Symptom | What to try |
|---------|-------------|
| Whole developers.facebook.com broken | Different browser; confirm developer registration; try incognito without extensions |
| No **Create App** button | Business may need to verify; or use a personal Facebook account that is **admin** on the Business Suite |
| No **WhatsApp** in sidebar | **Add product** → **WhatsApp** → Set up |
| Only meta.ai works | That is **Model API only** — WhatsApp is **only** on developers.facebook.com |

For the hackathon you can still demo **UI + Muse summaries** with `EXPO_PUBLIC_DATA_SOURCE=mock` while WhatsApp access is pending; live calls need the Developer app above.
