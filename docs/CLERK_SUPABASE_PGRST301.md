# Fix: `No suitable key or wrong key type` (PGRST301)

Supabase returns this when PostgREST cannot verify the **Authorization** JWT.

---

## Your project uses ES256 signing keys (not legacy HS256)

JWKS URL (yours):

`https://mjxfpovawoztumfcblhm.supabase.co/auth/v1/.well-known/jwks.json`

Example key id: `435c836f-f87c-446b-88f2-6a7dc4a04488`, algorithm **ES256**.

**Do not** paste this JWKS JSON into Clerk. It is only for tokens **issued by Supabase Auth**, not for Clerk.

On ES256 projects, the old **JWT template + shared JWT secret** flow often causes **PGRST301** (“wrong key type”). Use **Clerk third-party auth** instead.

---

## Correct setup (ES256 / modern Supabase)

### 1. Clerk — activate Supabase compatibility

1. [Clerk Dashboard](https://dashboard.clerk.com) → app **intent-mayfly-1900**
2. **Configure → Integrations → Supabase** → **Activate** / **Connect**
3. This adds **`role: authenticated`** (and related claims) to **session tokens**

Without this step, session JWTs may be valid for Clerk but rejected by Supabase.

### 2. Supabase — Clerk provider

1. **Authentication → Sign In / Providers → Clerk**
2. Clerk domain: **`intent-mayfly-1900.clerk.accounts.dev`**
3. Save

### 3. App

- Uses **`session.getToken()`** (Clerk session JWT), not the deprecated HS256 template first.
- `.env`: `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` from **the same** Clerk app.
- Sign **out** → `npm run web:clear` → sign in with Google again.

### 4. Database row (Khaya demo)

```sql
select business_id, clerk_user_id from public.business_members
where clerk_user_id = 'user_3KyeB5EWkTYwIrctGOwlxpr5fbz';
```

---

## Legacy path (only if your project still has HS256 JWT secret)

If Supabase **only** offers a shared **JWT secret** (no ES256 JWKS), you may use Clerk **JWT template** named `supabase`.  
**Your project has JWKS ES256 — skip this unless Supabase support tells you otherwise.**

---

## Quick checklist

| Item | |
|------|---|
| Clerk **Supabase integration** activated | |
| Supabase **Clerk** provider = `intent-mayfly-1900.clerk.accounts.dev` | |
| No HS256 `supabase` JWT template fighting ES256 | |
| Sign out + fresh sign-in after changes | |

See also [CLERK_SUPABASE_SETUP_STEPS.md](./CLERK_SUPABASE_SETUP_STEPS.md).
