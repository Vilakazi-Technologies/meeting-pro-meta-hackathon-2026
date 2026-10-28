# Meeting Pro — WhatsApp call transcription

**VILATECH** · Meeting Pro · Expo SDK 58 · React Native 0.88 · Supabase

Meeting Pro turns business WhatsApp calls into searchable, speaker-separated transcripts.

**Meta Global AI Hackathon (startup track):** [docs/HACKATHON_SUBMISSION.md](docs/HACKATHON_SUBMISSION.md) · [docs/META_HACKATHON_STARTUP.md](docs/META_HACKATHON_STARTUP.md) (demo script, due **Nov 4**).

**This is work in progress, not a working product.** Read *What works* and *What does not* before relying on anything here.

---

## The one fact you must know

**A phone cannot record a WhatsApp call — not on iOS, not on Android, with no workaround short of rooting or jailbreaking the device.** WhatsApp calls run inside the operating system's calling sandbox, and both platforms deliberately block other apps from capturing that audio.

So the phone records nothing. **Meta does the transcription on its own servers**, through the WhatsApp Business Calling API. When a call ends, Meta sends the transcript to our backend as a webhook — speakers already separated, word timings included. Our backend verifies it and stores it in Supabase. **The app only reads from the database.**

```
WhatsApp call on a business number
        │
Meta Cloud API ── records and transcribes on Meta's servers
        │  webhook: call_transcription_available
        ▼
Supabase Edge Function  supabase/functions/whatsapp-webhook
        │  verify signature → log → fetch transcript → verify hash → store
        ▼
Postgres: calls, transcripts, transcript_segments
        │
        ▼
React Native app ── signs in, reads; never records
```

Any design that has the phone capture call audio is a dead end. Constraints that follow from Meta's side:

- Only numbers on the WhatsApp **Cloud API** with Calling enabled can do this; the WhatsApp Business *app* cannot.
- Both parties hear a mandatory announcement that the call is being transcribed. It cannot be turned off.
- Meta deletes the transcript after **7 days**, and download links expire after **5 minutes**. The backend copies the transcript immediately and keeps it.
- Language detection covers about 54 languages, including Afrikaans. **Zulu and Xhosa are not supported.**

---

## What works

Each item says what was proven and on which infrastructure. "Local" means a Supabase stack in Docker on a developer machine. "Dev" means the hosted Supabase project `meeting-pro-dev` (Frankfurt).

### Database schema — `supabase/migrations/`

The schema is multi-tenant: every business's data is isolated by RLS (row-level security — the database's own rules deciding who can read which rows). It has ten tables: businesses, members, WhatsApp numbers, webhook log, calls, transcripts, segments, action items, tags and transcript tags.

| Proof | Where |
|---|---|
| `tests/01_schema_verification.sql`: tenant isolation, column-level edit rights, webhook deduplication, full-text and typo-tolerant search — **30/30** | Local |
| Migration applied; trigram index, generated search column and edit-rights split all confirmed from the live catalogue | Dev |

### Anon lock-down — `20260918090000_revoke_anon_privileges.sql`

Without signing in, nothing in the database can be read or written. The migration also stops future tables from reopening that access.

| Proof | Where |
|---|---|
| `tests/02_anon_denied.sql`: **10/40 before** the migration, **40/40 after**, on real seeded rows | Local |
| Applied. Same test: **10/40 before, 40/40 after**. The original 30-check schema test still passes **30/30**, and `anon` now holds **zero** privileges on every table | Dev |

### Webhook receiver — `supabase/functions/whatsapp-webhook/`

The function:

- answers Meta's subscription challenge;
- verifies every request's HMAC signature against the raw body, using a constant-time comparison;
- replies 200 immediately, then does the work;
- logs every event before interpreting it;
- absorbs Meta's retries without creating duplicates;
- routes each event to the right business by phone number;
- fetches the transcript, verifies its SHA-256 hash, and stores both the raw document and normalised rows;
- records a **failed** transcript when the download or verification fails, so the call never silently disappears. A failed row holds only Meta's references, never unverified content, and a transcript that is already stored is never overwritten by a later failure.

Requests with a bad signature are logged but never acted on. A transcript that arrives before its call's lifecycle event still lands; the call's direction starts as `unknown` and is filled in later.

| Proof | Where |
|---|---|
| 53 offline tests against fixtures based on Meta's documented payloads, no network | Node 20 |
| Deployed: challenge (200 / 403 / 400); signed ingest wrote the transcript plus 4 segments; an identical retry changed nothing; a forged signature was logged and ignored; replied in ~0.4 s | Dev (Deno) |

**Caveat:** in the dev proof, the transcript was downloaded from a Supabase signed URL standing in for Meta's servers. A *successful* download from Meta itself is **unproven** until real Meta credentials exist. The *failure* path is proven against Meta: with placeholder credentials Meta's Media API answered HTTP 401 and a failed transcript was recorded.

### Retry — `supabase/functions/retry-transcript/`

When a transcript failed, the app can ask the server to fetch it again. The function checks, using the caller's own credentials so RLS decides, that they may see the transcript before anything runs with elevated access; a transcript they cannot see is reported as not found rather than forbidden. It always goes through Meta's Media API, since the link in the webhook expired after five minutes, and refuses without contacting Meta when the transcript is already stored, when there is no hash to verify against, or when it is past Meta's 7-day retention.

| Proof | Where |
|---|---|
| 9 offline tests: success, refusal without credentials, expiry, hash missing, caller not permitted, already stored | Node 20 |
| Deployed. Retry from the app returned HTTP 200 and a plain failure message; the transcript stayed failed and the stored good transcript was untouched | Dev (Deno) |

### Summaries — `supabase/functions/summarize-transcript/`

**Built and deployed, but switched OFF.** It needs an Anthropic API key and does nothing until one exists. See *Turning summaries on* below.

Meta returns transcripts, never summaries. This sends the transcript text to **Muse Spark (`muse-spark-1.3`)** via the Meta Model API when `MODEL_API_KEY` is set, or **Claude Haiku 4.5** as a fallback, and stores a short title, a summary and any action items. It runs automatically after a transcript lands, and can be re-run by hand.

Two rules shape it:

- **Never a partial summary.** The model must return a single JSON object. The parser is lenient only about an unambiguous markdown fence and strict about everything else. On any failure the transcript keeps its text untouched and `summary_status` becomes `failed` with the reason recorded. The write goes through `apply_transcript_summary()`, which replaces the AI action items and marks the transcript ready in **one transaction**.
- **Never invent action items.** The prompt states that an empty list is the correct answer for a call with no commitments, and a test asserts that instruction is actually in the prompt.

Re-running is safe: an already-summarised transcript is skipped without a model call, and a forced re-run replaces the AI action items while leaving anything a person added by hand alone.

| Proof | Where |
|---|---|
| 11 offline tests: parsing (valid, fenced, eight malformed shapes), idempotency, forced re-run, model error, caller not permitted, no text to summarise | Node 20 |
| Deployed; guards verified — 401 unauthenticated, 400 on a malformed id, 404 unknown, and 404 when a user from another business asks. The transcript was left untouched by all of it | Dev (Deno) |
| **The model call itself is UNTESTED** — no API key is set, so Claude has never been called | — |

**Rough cost, estimated not measured:** Haiku 4.5 is $1 per million input tokens and $5 per million output. A 30-minute call works out around **$0.0075** — under a cent — so roughly **$8 per 1,000 calls**. The prompt is about 400 tokens of every request.

### App — sign-in and real transcript data

- Email and password sign-in gates the whole app.
- Home's recent list, the Archive and the transcript screen read real rows from Supabase.
- Failed transcripts are shown with a red badge, an explanation and a **Retry download** button — never hidden.
- Settings shows the signed-in email and a sign-out button.
- The dashboard figures (sessions, hours, outstanding actions) are counted from real rows. A figure with no source shows an em dash rather than a zero that would read as a fact.
- A business with no calls gets a proper empty state instead of zeros and blank lists.
- WhatsApp connection status is read from the database, so it says "Not connected" when no number is registered instead of claiming otherwise.
- With summaries switched off, the transcript screen says so plainly — the transcript still renders in full, and nothing implies a summary failed.
- Setting `EXPO_PUBLIC_DATA_SOURCE=mock` switches back to the old demo data, for side-by-side comparison.

| Proof | Where |
|---|---|
| In a real browser: sign-in, then the seeded transcript and its 4 segments rendered; an edit made directly in the database appeared in the app; mock mode made zero network calls | Local |
| In a real browser: sign-in; both transcripts listed, the failed one visible with its badge; 4 segments rendered; Retry returned a plain failure message without crashing; sign-out cleared the session and returned to the sign-in screen | Dev |
| Two businesses checked in a browser: one with data (Sessions 2, Hours <0.1, Actions 0 — matching the database exactly) and one with none (Sessions 0, Hours —, empty-state card, Archive's "nothing yet" message) | Dev |

---

## What does not work (yet)

- **No real Meta credentials.** The dev deployment runs on throwaway test secrets. No real WhatsApp call has ever reached this system.
- **`mockData.ts` is gone.** No screen shows invented data. Demo transcripts survive only behind `EXPO_PUBLIC_DATA_SOURCE=mock`, which no live path uses.
- **Summaries are off.** `summarize-transcript` is deployed but has never called the model: no API key is set. Every transcript reads "not available yet", transcript titles stay placeholders ("WhatsApp call · +27…"), and the outstanding-actions tile reads 0. One command switches it on — see below.
- **The Live screen does nothing yet.** Its fake recorder has been removed; it now says so plainly. It should become a call status view driven by the call lifecycle webhooks — see the TODO at the top of the file.
- **No plan or billing.** Nothing stores a subscription tier. The plan card has been removed rather than showing an invented one; rebuild it when a real subscription exists.
- **Voice notes and live call status do not exist.** The "Voice Note → Text" and "Live Call Transcription" cards on Home and Onboarding still describe them as if they work — that copy has not been corrected yet. The Live screen itself says plainly that it is not available.
- **Connecting a number has no in-app flow.** Registering a WhatsApp Business number is done on Meta's side; the button is disabled and labelled "coming soon".
- **No voice notes.** They need a separate pipeline (Meta's transcription covers calls only) and none exists.
- **No sign-up or password reset.** Accounts are created by an admin. Signing out works.
- **One Meta access token for everyone.** The schema is designed for a token per business, stored in Supabase Vault, but the function still reads a single environment variable. This must change before a second business is onboarded.
- **Call recording is not enabled.** Transcription only.
- `expo-audio` and `expo-file-system` are installed but imported nowhere. The microphone permissions they implied have been removed from `app.json`; remove the packages too once in-app meeting recording is ruled out.

---

## Setup from a fresh clone

**Windows:** see [docs/WINDOWS_LOCAL.md](docs/WINDOWS_LOCAL.md) (wrong folder → “entry point does not exist”; use `npm run supabase:*`, not bare `supabase`).

### Prerequisites

- Node 20 and npm
- [Supabase CLI](https://supabase.com/docs/guides/cli) (tested on 2.105)
- Docker Desktop — only needed for a local database
- `psql` — only needed for the SQL tests

```bash
npm install
cp .env.example .env
```

### App environment variables — `.env`

`.env` is gitignored. Never commit it.

| Variable | What it is | Where to get it |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project's API URL | **Local:** `API_URL` from `supabase status -o env`. **Dev:** Supabase dashboard → project → Project Settings → API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | The public "anon" key | Same places (`ANON_KEY` locally). It is meant to ship inside the app: the database's rules protect the data, not the secrecy of this key |
| `EXPO_PUBLIC_DATA_SOURCE` | `supabase` (default) or `mock` | Your choice. Change it **in `.env`** and restart with `npx expo start --clear`. Setting it on the command line does not work in this Expo version |

### Option A — local database (no accounts needed)

```bash
supabase start                 # first run downloads images; applies all migrations
supabase status -o env         # copy API_URL and ANON_KEY into .env
npx expo start --web           # or `npx expo start` and scan with Expo Go
```

A fresh local database is empty, so there is nothing to sign in to. Create a user in Supabase Studio (http://127.0.0.1:54323 → Authentication → Add user, with **auto-confirm** ticked). Then run this in Studio's SQL editor:

```sql
insert into public.businesses (id, name)
  values ('aaaa1111-0000-4000-8000-000000000001', 'Local Test Co');
insert into public.business_members (business_id, user_id, role)
  select 'aaaa1111-0000-4000-8000-000000000001', id, 'member'
    from auth.users where email = '<the email you just created>';
```

The Archive will be empty until transcripts exist. Insert some directly, or run the webhook tests to see the shapes.

### Option B — the shared dev project

Ask Panky for access to the **Lumiq Industries** organisation in Supabase. Then:

```bash
supabase login
supabase link --project-ref duurebydckodwznnmwoc
```

Put the dev URL and anon key in `.env`. The dev project is on the free tier and **pauses itself after about a week without use**. If queries fail with "tenant not found", restore it from the dashboard.

### Edge Function secrets

These live on Supabase, not in `.env`. Set them with `supabase secrets set --env-file supabase/.env.local`; that file is gitignored.

| Secret | What it is | Where to get it |
|---|---|---|
| `META_APP_SECRET` | Key used to verify Meta's webhook signatures | Meta app dashboard → App settings → Basic → App secret |
| `META_VERIFY_TOKEN` | Shared string Meta echoes back when you register the webhook | You make it up; enter the same value in Meta's webhook configuration |
| `META_ACCESS_TOKEN` | Token for downloading transcripts from Meta | Meta Business Suite → System users → generate a token with WhatsApp Business permissions |
| `MODEL_API_KEY` | Turns summaries on (Muse Spark) — see below | [Meta Model API](https://dev.meta.ai/docs/quickstart) |
| `ANTHROPIC_API_KEY` | Summaries fallback if `MODEL_API_KEY` is unset | console.anthropic.com → API keys |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected by Supabase automatically.

Deploy the webhook with `--no-verify-jwt`: Meta signs its requests itself and never sends a Supabase login token. The retry function is the opposite — it is called by a signed-in user, so it keeps the default JWT check:

```bash
supabase functions deploy whatsapp-webhook --no-verify-jwt
supabase functions deploy retry-transcript
supabase functions deploy summarize-transcript
```

### Turning summaries on

`summarize-transcript` is deployed and wired up, but it has no API key, so it does nothing. Every transcript shows "summary not available yet" until you run:

```bash
supabase secrets set MODEL_API_KEY=...
```

(Or `ANTHROPIC_API_KEY=...` if you are not using Meta Model API.)

That is the whole switch — no redeploy, no code change. New transcripts are summarised automatically as they arrive. Existing ones need a re-run:

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/summarize-transcript" \
  -H "Authorization: Bearer <service-role-key>" \
  -H "Content-Type: application/json" \
  -d '{"transcript_id":"<uuid>","force":true}'
```

Costs land on the Anthropic account that owns the key — see the cost estimate above.

### Demo data

`supabase/seed/demo_khaya.sql` seeds a fictional Johannesburg property business,
Khaya Property Services, with fourteen WhatsApp calls spread over the last few
weeks: a plumbing quote, a delivery dispute, a burst geyser, a recruitment
screen, a supplier negotiation and so on, in South African English with some
Afrikaans. Thirteen are transcribed; one failed to download, so the failure
state and its Retry button can be shown.

Every summary, title and action item in it is **pre-written demo content**. No
model produced any of it — `summary_model` reads `seeded-demo-content` rather
than naming a model, so nothing in the database pretends otherwise.

```bash
psql "$DATABASE_URL" -f supabase/seed/demo_khaya.sql
```

Dates are relative to `now()`, so the demo never looks stale. The demo user is
created separately through the auth admin API and added to `business_members`.

### Running the tests

```bash
# Webhook, retry and summaries — offline, no Docker, no network (53 tests)
bash supabase/functions/whatsapp-webhook/run-tests.sh

# Schema — each test runs in a transaction that rolls back, so it is safe
# against any project
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/01_schema_verification.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/02_anon_denied.sql

# App type-check
npx tsc --noEmit
```

After any migration, regenerate the app's database types:

```bash
supabase gen types typescript --local --schema public > src/lib/database.types.ts
```

---

## Repository layout

```
App.tsx                           Expo entry
src/
  App.tsx                         providers, sign-in gate, navigator
  lib/supabase.ts                 the single Supabase client
  lib/database.types.ts           generated from the schema — do not edit
  contexts/AuthContext.tsx        session state, sign-in
  data/transcriptSource.ts        real-or-demo transcripts + database→UI mapping
  data/dashboardStats.ts          dashboard figures counted from the database
  data/demoTranscripts.ts         demo fixtures, only for EXPO_PUBLIC_DATA_SOURCE=mock
  constants/content.ts            static product copy (not data)
  screens/                        SignIn, Home, Live, Archive, TranscriptDetail, Settings, …
  components/                     glass UI components
supabase/
  migrations/                     schema — never edit an applied migration; add a new one
  tests/                          SQL verification scripts
  functions/whatsapp-webhook/     webhook receiver, fixtures, offline tests
  functions/retry-transcript/     re-downloads a failed transcript, for a signed-in user
  functions/summarize-transcript/ title, summary and action items via Claude (needs a key)
  functions/_shared/              code shared between functions
PROJECT_BRIEF.md                  original research brief (2026-08-07), historical
```

The database and the UI types were designed separately and disagree in places: titles, participant names, speakers. `src/data/transcriptSource.ts` maps between them and marks each judgment call `MISMATCH`.

On iOS 26+, `src/utils/platform.ts` switches the glass components to Liquid Glass styling. Everywhere else they use standard blur.
