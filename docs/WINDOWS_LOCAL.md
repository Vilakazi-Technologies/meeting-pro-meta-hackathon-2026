# Meeting Pro on Windows (local + Supabase)

## 1. Use the correct folder

All commands assume this directory:

`C:\Users\ayand\Documents\VILATECH\meeting-pro-hackathon`

If you are in `meeting-pro` (without `-hackathon`) or another clone, you will see **400 entry point path does not exist** or **failed to read file** because `node_modules\expo\AppEntry.js` is missing.

```powershell
cd C:\Users\ayand\Documents\VILATECH\meeting-pro-hackathon
npm run preflight
```

If preflight fails, run `npm install` and try again.

## 2. Run the dashboard locally

```powershell
copy .env.example .env
# Fill EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY, EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run web:clear
```

Open **http://localhost:8081** in the browser.

**No local setup?** Use production: [https://meeting-pro-rho.vercel.app](https://meeting-pro-rho.vercel.app) (same UI; env vars already on Vercel).

### Expo Go on iPhone

This repo is **Expo SDK 58** — it matches the current App Store **Expo Go**. Scan the QR code from `npx expo start` on the same Wi‑Fi.

**Node.js:** SDK 58 requires **Node ≥ 22.13** ([download](https://nodejs.org/)). On Node 20 you may see engine warnings; upgrade Node if Metro misbehaves.

For the Meta hackathon, **web** ([Vercel](https://meeting-pro-rho.vercel.app) or `npm run web:clear`) is still the primary demo surface.

## 3. Supabase CLI is not installed globally

On Windows, `supabase` by itself usually **does not exist**. Always use **`npx`** from the repo root:

| Instead of | Use |
|------------|-----|
| `supabase login` | `npm run supabase:login` |
| `supabase secrets set --env-file ...` | `npm run supabase:secrets` |
| `supabase functions deploy summarize-transcript` | `npm run supabase:deploy:summarize` |

First time only:

```powershell
npm run supabase:login
```

Complete login in the browser. You need access to the **Lumiq** Supabase org (`duurebydckodwznnmwoc`). If deploy returns **403**, your account is not on that project yet — ask Panky for access.

### Secrets without CLI (dashboard)

1. [Supabase Dashboard](https://supabase.com/dashboard/project/duurebydckodwznnmwoc/settings/functions) → **Edge Functions** → **Secrets**
2. Add **`MODEL_API_KEY`** = your Meta Model API key (same value as in `supabase/.env.local`)
3. Deploy still requires CLI + login, or ask someone with access to run `npm run supabase:deploy:summarize`

Docker is **not** required for `secrets set` or `functions deploy` (only for `supabase start` local DB).

## 4. Common errors

| Message | Cause | Fix |
|---------|--------|-----|
| **entry point path does not exist** (400) | Wrong folder or no `npm install` | `cd meeting-pro-hackathon`, `npm install`, `npm run preflight` |
| **failed to read file** | Missing `node_modules` or assets | `npm install` from repo root |
| **env-file not found** | Ran secrets from wrong directory | `cd` to repo root; file must be `supabase\.env.local` |
| **supabase is not recognized** | CLI not on PATH | Use `npm run supabase:*` scripts (npx) |
| **403 privileges** on deploy | Not logged in or no project access | `npm run supabase:login` + Lumiq org invite |

## 5. Muse key scope

`MODEL_API_KEY` runs on **Supabase Edge** (server), not in the Expo app. You do not put it in `.env` for the web build.
