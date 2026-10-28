# Clerk + Supabase (Meeting Pro)

Identity is **Clerk**. Data stays on **Supabase** with RLS, using a Clerk JWT.

## 1. Clerk application (Meeting Pro)

In Clerk Dashboard → **Meeting Pro** (instance slug may show as `intent-mayfly-1900` in URLs — that is normal for dev; users never see it in the app UI).

1. **Settings → Application name:** `Meeting Pro` (or `Lumiq Industries`).
2. Enable **Email + Password** (or your chosen strategies).
3. **JWT templates** → create template named **`supabase`** (exact name — the app requests this).
4. Configure the template per [Supabase third-party auth (Clerk)](https://supabase.com/docs/guides/auth/third-party/clerk).
5. Copy the **Publishable key** → `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in `.env` and Vercel (or `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` on Vercel — the app reads both).

## 2. Supabase project

1. **Authentication → Third-party auth → Clerk** — connect your Clerk instance.
2. Apply migration `20261019120000_clerk_third_party_auth.sql` (`supabase db push`).
3. Provision members with **`clerk_user_id`** = Clerk user id (`user_…`), not Supabase `auth.users`:

```sql
update public.business_members
set clerk_user_id = 'user_xxxxxxxx'
where /* your row */;
```

Legacy rows that still use `user_id` (Supabase Auth UUID) continue to work until migrated.

## 3. Edge functions

- `CLERK_SECRET_KEY` **only** as a Supabase Edge Function secret (never in `.env` for Expo or Vercel web — it would leak into builds). Used for meeting-minutes email lookup.

## 4. Local / web

```bash
cp .env.example .env
# EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
# EXPO_PUBLIC_SUPABASE_URL=...
# EXPO_PUBLIC_SUPABASE_ANON_KEY=...
npx expo start --clear
```

Sign-in on **web** uses Clerk’s embedded **SignIn / SignUp** (hash routes) inside the **VILATECH** `AuthScreenShell`. **Expo / iOS / Android** use the same shell plus **Continue with Google** and email/password.

In Clerk Dashboard → **User & authentication**, enable **Email + Password**, **Google**, and **Sign-up**.

### Google on Expo Go / native

1. **Configure → SSO connections → Google** — enable for your application.
2. **Configure → Developers → Native applications** (or **Redirect URLs**) — add the redirect from the app console on first OAuth attempt, or add:
   - `meetingpro://oauth-callback`
   - Your Expo Go URL from `expo-auth-session` (often `exp://…/--/oauth-callback` when testing in Expo Go).

If email/password sign-in says **verification strategy is not valid**, the account was created with **Google** — use **Continue with Google** (not password).

### Domains — what `intent-mayfly-1900.clerk.accounts.dev` is

That **`.clerk.accounts.dev`** host is Clerk’s **Frontend API** for your dev instance. It is **read-only** in the dashboard and is **already wired** through your publishable key (`pk_test_…`).

You do **not** add it to Vercel, DNS, or Supabase. You also do **not** replace it with `meeting-pro-rho.vercel.app` in the “Primary domain” slot — that slot is for Clerk’s hosted Account Portal, not your app.

What you **do** configure is **your app’s URL** (where Meeting Pro runs):

| Clerk Dashboard location | What to set |
|--------------------------|-------------|
| **Configure → Paths** (or **Settings → Paths**) | **Home URL:** `https://meeting-pro-rho.vercel.app` |
| Same **Paths** page | **Sign-in URL:** `https://meeting-pro-rho.vercel.app` |
| **Configure → Developers → Allowed redirect URLs** (wording may vary) | `https://meeting-pro-rho.vercel.app/*` |
| **Configure → Developers → Allowed origins** (if shown) | `https://meeting-pro-rho.vercel.app` |
| Local dev | `http://localhost:8081` (and `http://127.0.0.1:8081` if you use it) in the same redirect/origin lists |

Optional later: **Configure → Domains → Add domain** is only if you want a **custom Clerk Account Portal** host (e.g. `accounts.lumiq.com`). Meeting Pro does **not** need that for embedded sign-in on Vercel.

Enable **Email + Password** (and any social providers you want) for the application.

**Secret key (`sk_test_…`):** set only in Supabase → Edge Functions secrets as `CLERK_SECRET_KEY` (meeting-minutes email). Never in `.env`, Vercel, or git — the Expo web bundle must not contain it.
