# Create your first Meta Developer app (when MCP shows no apps)

You linked **Meta Social Technologies MCP** in Cursor — that only stores your login. It is **not** a chat screen, and it does **not** list “create app” buttons.

**What we see from MCP right now:** `devtools_app_list` returns **zero apps**. On OAuth you could only grant access to apps that **already exist**. If the list was empty, you were not missing a checkbox — **there was no app to select yet**.

The Oct 2026 blog “create app via MCP” tools are **rolling out gradually**. Your Cursor connection today has the **read/manage** DevTools (webhooks, docs, compliance) — not necessarily the new **write** tools. Until an app exists, MCP cannot give you WABA or Phone number ID.

---

## Where you “instruct” the agent

| Place | What it does |
|-------|----------------|
| **Settings → Tools & MCP → Meta Social Technologies** | Connect / disconnect OAuth only |
| **Cursor Agent chat** (this panel, **Agent** mode) | You type requests; the agent calls MCP tools |

There is no third “MCP chat” app. After you create an app in the browser (below), come back here and say: *“List my Meta apps and help me set up the WhatsApp webhook for Meeting Pro.”*

---

## Step A — Register as a Meta developer (one time)

1. Open **https://developers.facebook.com/** in Chrome or Edge (not Instagram in-app browser).
2. Click **Get started** / **Register** if shown; accept terms.
3. You should see a developer home or **My Apps**.

If even the **homepage** shows “page not found”, stay logged into **https://www.facebook.com/** first, then open developers.facebook.com again. Disable ad-blockers on `*.facebook.com`.

---

## Step B — Create the app (browser, not MCP)

Use the **apps hub**, not a pasted deep link:

1. **https://developers.facebook.com/apps/**  
   (Type this in the address bar; do not use `/apps/creation/` or URLs with a random app ID.)

2. Click **Create App**.

3. When asked for a use case, pick **Connect with customers through WhatsApp**  
   (or **Other** → **Business** → then add **WhatsApp** product after creation).

4. Link **business portfolio** — choose the business that matches Business Suite ID `1143947790925807` (VILATECH).

5. Finish the wizard. In the left sidebar, open **WhatsApp** → **API Setup**.

6. Write down:
   - **App ID** (top of dashboard or Settings → Basic)
   - **WhatsApp Business account ID** (WABA)
   - **Phone number ID**
   - Test **display phone** if Meta gave you a test number

**App secret:** Settings → **Basic** → **Show** next to App secret (never paste in chat).

---

## Step C — Let MCP see the new app

1. **Cursor → Settings → Tools & MCP**
2. For **Meta Social Technologies**:
   - Use **Disconnect** / remove the server, **or** delete the block from `.cursor/mcp.json` and **Developer: Reload Window**, then add the server again.
3. Click **Needs login** / authenticate.
4. On the consent screen, select your **new app** and grant **Manage** (or full access).

Verify in Agent chat: *“Run devtools_app_list”* — you should see at least one app.

---

## Step D — Meeting Pro (after IDs exist)

1. `supabase/.env.secrets` → `META_APP_SECRET`, `META_VERIFY_TOKEN`, `META_ACCESS_TOKEN` → `npm run supabase:secrets`
2. Deploy `whatsapp-webhook` (see [META_MCP_RUNBOOK.md](./META_MCP_RUNBOOK.md))
3. App → **Connect WhatsApp** with WABA + Phone number ID + display phone

Optional second MCP (after a WhatsApp-enabled app exists): [WhatsApp Business Tools MCP](https://developers.facebook.com/documentation/mcp/whatsapp-business-tools-mcp) at `https://mcp.facebook.com/whatsapp_business_tools` — helps with numbers/templates; it still requires an app first.

---

## If **Create App** never appears

| Symptom | Try |
|---------|-----|
| No **Create App** on apps hub | Confirm developer registration (Step A); use an account that is **admin** on the business |
| Only Business Suite works | **business.facebook.com** → **Settings** → **Accounts** → **Apps** → create/link developer app |
| Still blocked | Different browser / incognito without extensions; or Meta Support from the developer homepage |

---

## “You can’t make this change at the moment” (unfamiliar device)

Meta may block **creating apps**, linking businesses, or sensitive changes when you sign in from a **new PC, VM, or browser** they do not trust yet.

**What helps (in order):**

1. **Finish email verification** and any **2FA** prompts on the same browser — then wait **24–72 hours** while you use that device normally (facebook.com, business.facebook.com, light browsing). Meta rarely lifts this instantly.
2. **Use the device you always used before** (old laptop / phone browser) for **Create App** once, then add your current machine as normal daily use.
3. **Teammate with a trusted device:** a Business **admin** creates the Developer app on their login, then adds you as **Developer** or **Admin** on the app (App roles). You can still wire Supabase secrets and Meeting Pro; they only need the browser for creation + App secret copy.
4. **Do not** spin up VPNs, new Facebook accounts, or “verification bypass” services — that extends locks or triggers reviews.

**Hackathon while blocked:** demo with `EXPO_PUBLIC_DATA_SOURCE=mock` and live **Muse summaries** (`MODEL_API_KEY` on Supabase). Judges still see product + AI; live WhatsApp waits for Meta account trust or a teammate’s app.

---

## Catch-22 summary

```
MCP connected  ≠  WhatsApp app exists
Empty consent  =  create app in browser first (Step B)
Then reconnect MCP (Step C) → webhook + secrets (Step D)
```

See [META_MCP_RUNBOOK.md](./META_MCP_RUNBOOK.md) for the full pipeline.
