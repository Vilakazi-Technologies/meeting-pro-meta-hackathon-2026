# Meta Global AI Developer Hackathon — Startup track (Meeting Pro)

**Track:** Startup — real product, production execution  
**Theme:** Bring Meta’s models into your domain  
**Company:** Lumiq Industries (VILATECH)  
**Submission deadline:** Nov 4, 2026, 9:00 PM ET  
**Live demo:** [meeting-pro-rho.vercel.app](https://meeting-pro-rho.vercel.app)

---

## One-line pitch

Meeting Pro turns **WhatsApp Business calls** into searchable minutes: **Meta transcribes the call on their servers**, our backend stores it, and **Muse Spark** drafts titles, summaries, and action items business owners can trust.

---

## Why this fits the startup track

| Criterion | How Meeting Pro answers it |
|-----------|----------------------------|
| Real product | Shipped web app, Supabase backend, Clerk auth, paying-customer positioning (SA business numbers) |
| Technical execution | Multi-tenant Postgres + RLS, signed Meta webhooks, media mirroring inside Meta’s 5-minute URL window, idempotent ingest |
| Production readiness | Deployed Edge Functions, Vercel production alias, honest failure states + retry, demo seed (`demo_khaya.sql`) |
| Meta stack | **WhatsApp Cloud API** call transcription + **Meta Model API (`muse-spark-1.3`)** for meeting minutes |

We do **not** record WhatsApp audio on the device — that is impossible on iOS/Android. The architecture matches Meta’s documented Calling + transcription product.

---

## Meta models in the product

1. **Call transcription (Meta WhatsApp Business Calling API)** — speaker-separated transcript JSON after each call; mirrored to Supabase before Meta’s 7-day retention expires.
2. **Meeting minutes (Meta Model API — Muse Spark)** — `summarize-transcript` Edge Function; prefers `MODEL_API_KEY` → `muse-spark-1.3` via the Anthropic-compatible Messages API at `https://api.meta.ai`. Falls back to `ANTHROPIC_API_KEY` only when no Meta key is set.

Turn summaries on for judges:

```bash
# In supabase/.env.local (hackathon key from dev.meta.ai)
MODEL_API_KEY=...

supabase secrets set --env-file supabase/.env.local
# No redeploy required — functions read secrets at runtime
```

Re-run summaries on seeded demos:

```bash
curl -X POST "https://duurebydckodwznnmwoc.supabase.co/functions/v1/summarize-transcript" \
  -H "Authorization: Bearer <service-role-key>" \
  -H "Content-Type: application/json" \
  -d '{"transcript_id":"<uuid>","force":true}'
```

---

## 90-second demo script (video or live)

1. **Problem (10s):** “South African businesses run on WhatsApp calls — nothing is searchable after you hang up.”
2. **Architecture (15s):** Show diagram: Business number → Meta Cloud API → webhook → Supabase → app (no on-device recording).
3. **App (45s):** Sign in → Dashboard (answer rate, call volume) → **Calls** tab → open a Khaya Property transcript → scroll segments with [Business]/[Customer] → **AI Summary** + action items → Archive search.
4. **Failure honesty (10s):** Open the failed transcript → **Retry download** (Meta retention / expired URL).
5. **Close (10s):** “Built for production: multi-tenant RLS, Muse Spark minutes, WhatsApp is the channel — Meeting Pro is the memory.”

---

## Submission checklist (before Nov 4)

- [ ] **GitHub / repo** — this repo or `Lumiq-Industries/meeting-pro` with README accurate through demo day
- [ ] **Public URL** — Vercel prod loads with Clerk + Supabase env vars
- [ ] **MODEL_API_KEY** set on Supabase; at least one transcript shows `summary_model` = `muse-spark-1.3`
- [ ] **Demo data** — `demo_khaya.sql` on dev/prod for judges without a live WABA call
- [ ] **Meta webhook** (optional wow factor) — Banky: green webhook + one real test call (see [PHANKY Final Steps.md](./PHANKY%20Final%20Steps.md))
- [ ] **Video** — 2–3 min, startup track tone: problem → architecture → demo → business model (Lumiq / vilatech.co)
- [ ] **Copy audit** — no claim that voice notes or on-device recording work ([MEETING_PRO_BLOCK.md](./MEETING_PRO_BLOCK.md))

---

## Division of labour (hackathon week)

| Owner | Focus |
|-------|--------|
| **Ayanda** | Demo video, submission form, UI polish, Khaya seed on prod, Muse key + force-summarize demos |
| **Banky** | Meta WABA + webhook + `whatsapp_numbers` row + `META_*` secrets |
| **Both** | Pitch: “Meta end-to-end — channel + intelligence” |

---

## Links

- [Meta hackathon](https://dev.meta.ai/events/global-hackathon)
- [Meta Model API quickstart](https://dev.meta.ai/docs/quickstart)
- [WhatsApp call transcription](https://developers.facebook.com/documentation/business-messaging/whatsapp/calling/call-transcription/)
- [WHATSAPP_BUSINESS_SETUP.md](./WHATSAPP_BUSINESS_SETUP.md)
