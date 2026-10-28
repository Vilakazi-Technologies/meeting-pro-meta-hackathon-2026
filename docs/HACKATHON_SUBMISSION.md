# Meta AI Developer Hackathon 2026 — submission repo

**Event window:** Oct 26 – Nov 4, 2026  
**Submit:** [Cerebral Valley form](https://cerebralvalley.ai/e/meta-ai-developer-hackathon/hackathon/submit) by **Wed Nov 4, 9:00 PM ET**

This repository is the **hackathon submission** build of **Meeting Pro (VILATECH)** — WhatsApp Business call memory + **Muse Spark** meeting minutes.

## Track & theme

- **Track:** Startup  
- **Theme:** Build for Your World — Meta models in a domain we know (WhatsApp-first business)

## Demo (Khaya Property Services)

1. `.env`: `EXPO_PUBLIC_DATA_SOURCE=supabase` + Clerk + Supabase keys (see `.env.example`)
2. Clerk **Integrations → Supabase → Activate** + Supabase **Auth → Clerk** (`intent-mayfly-1900.clerk.accounts.dev`)
3. `npm run web:clear` → **Continue with Google**
4. **Settings** → Khaya Property Services, WhatsApp Connected → **Calls** (14 demo calls)

If Supabase returns **no suitable key**: [CLERK_SUPABASE_PGRST301.md](./CLERK_SUPABASE_PGRST301.md)

## Scripts

```bash
npm run preflight
npm run verify:meta
npm run web:clear
```

## Video (≤ 3 min)

See [META_HACKATHON_STARTUP.md](./META_HACKATHON_STARTUP.md) demo script.

## What we built during the hackathon

See commit history from **Oct 26, 2026** on `main` — Clerk third-party Supabase auth, Connect WhatsApp RPC, Khaya demo seed path, Muse `summarize-transcript`, Meta/WhatsApp integration docs, judge demo hardening.
