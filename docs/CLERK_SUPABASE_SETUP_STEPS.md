# Clerk + Supabase — step-by-step (Option 2 / Khaya demo)

Your Google sign-in is **Clerk** (`user_3KyeB5EWkTYwIrctGOwlxpr5fbz`). Supabase only trusts requests that carry a **Clerk session token**. Do **Part A + Part B** once.

---

## Part A — Clerk (≈5 minutes)

### 1. Google sign-in (you already use this)

1. Open [Clerk Dashboard](https://dashboard.clerk.com) → your **Meeting Pro** application.
2. **Configure → User & authentication**.
3. Under **Social connections**, ensure **Google** is **on** for sign-in and sign-up.

### 2. Connect Clerk to Supabase

**Do both** if Calls/Settings show empty and the console mentions **no suitable key** (PGRST301):

**B1 — Native (Supabase dashboard)**  
1. Clerk → **Integrations → Supabase** → **Activate**  
2. Copy domain: `intent-mayfly-1900.clerk.accounts.dev`  
3. Supabase → **Authentication → Providers → Clerk** → paste domain → Save  

**B2 — JWT template (recommended for this Expo app)**  
1. Supabase → **Project Settings → API → JWT Secret** (copy)  
2. Clerk → **JWT Templates → New → Supabase** → name **`supabase`** → paste JWT secret → Save  

The app requests the `supabase` template first, then the session token.

Details: [CLERK_SUPABASE_PGRST301.md](./CLERK_SUPABASE_PGRST301.md)

### 3. Redirect URLs (web + local)

**Configure → Developers** (or **Paths** / **Allowed redirect URLs**):

| URL | Why |
|-----|-----|
| `http://localhost:8081/*` | Local `npm run web:clear` |
| `http://127.0.0.1:8081/*` | Alternate local |
| `https://meeting-pro-rho.vercel.app/*` | Production demo |

**Allowed origins** (if shown): same hosts without `/*`.

### 4. Publishable key in `.env`

**Configure → API Keys** → copy **Publishable key** (`pk_test_…` or `pk_live_…`):

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

Restart Expo after changing `.env`.

---

## Part B — Supabase (≈3 minutes)

Project: **mjxfpovawoztumfcblhm**

### 1. Add Clerk as auth provider

1. [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. **Authentication** → **Sign In / Providers** (or **Third-party auth**).
3. **Add provider** → **Clerk**.
4. Paste the **Clerk domain** from Part A step 2.
5. Save.

### 2. API keys in `.env`

**Project Settings → API** (or **Data API**):

```env
EXPO_PUBLIC_SUPABASE_URL=https://mjxfpovawoztumfcblhm.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # anon / publishable key
EXPO_PUBLIC_DATA_SOURCE=supabase
```

### 3. Database (already done for you)

- Clerk column migration (`clerk_user_id`) — applied.
- Khaya membership for `user_3KyeB5EWkTYwIrctGOwlxpr5fbz` — applied.

---

## Part C — Prove it works

1. `npm run web:clear`
2. **Continue with Google** (your account).
3. **Settings** → **Khaya Property Services**, WhatsApp **Connected**.
4. **Calls** → list of demo calls.

If **Calls** is empty or Settings shows an error:

- Sign out → sign in again (fresh token).
- Clerk: Supabase integration **activated**?
- Supabase: Clerk provider saved with correct domain?
- Browser devtools → Network → a Supabase request returns **401** → Clerk/Supabase link is still wrong.

---

## Fallback — JWT template named `supabase` (legacy)

Only if Part A step 2 is unavailable:

1. Clerk → **JWT Templates** → **New template** → choose **Supabase** preset if offered.
2. Name the template **`supabase`** (exact spelling).
3. Paste Supabase **JWT secret** from Supabase **Project Settings → API → JWT Settings** (legacy).
4. Save.

The app tries the **native session token first**, then this template.

---

## What you sign in with (reminder)

| Use | Do not use |
|-----|------------|
| **Continue with Google** (your Google account) | Typing `user_3KyeB5EWkTYwIrctGOwlxpr5fbz` in the app |
| Same user as in `business_members` | Supabase Dashboard login |
| | A special “Khaya” password |

---

## Vercel (judges)

Same four variables in Vercel → **Environment Variables** → redeploy:

- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_DATA_SOURCE=supabase`

See also [CLERK_SETUP.md](./CLERK_SETUP.md).
