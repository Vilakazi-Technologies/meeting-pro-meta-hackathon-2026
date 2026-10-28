> **Historical document.** This is the research brief as of 2026-08-07, kept for its reasoning. Its description of what is built is out of date — see README.md for current status.

# Meeting Pro — Project Brief

**Status as of 2026-08-07.** This document is a handoff brief. It describes what the product is, what is actually built, the single research finding that determines the architecture, and the decisions still open. It is written to be pasted into a fresh conversation so a new collaborator can get to full context in one read.

---

## 1. The product

**Meeting Pro** transcribes WhatsApp calls and voice notes for business users — people who take client calls on WhatsApp and want searchable, summarised, actionable records of them.

- **Company:** Lumiq Industries (the combined entity of Infinity Colon and VILATECH)
- **Site:** vilatech.co — Meeting Pro is a product tier there
- **Market:** South Africa primary (business phone numbers on +27)
- **Repo:** `meeting-pro`, package name `whatsapp-transcriber`

Intended feature set: voice note → text, live call transcription, searchable archive with keyword tagging, AI summaries and action items, speaker identification, transcript delivery back into WhatsApp chat, CRM export.

---

## 2. What is actually built

**The app is a UI prototype with no functionality behind it.** This is the single most important thing to understand before reasoning about the codebase. The README describes features in the present tense as though implemented; they are not.

Verified by reading the full source on 2026-08-07:

- **No audio recording.** No mic permission is requested at runtime. Nothing records.
- **No network calls anywhere in `src/`.** Grepped for `fetch`, `axios`, `supabase`, `openai`, and bare URLs — zero hits.
- **No transcription.** `LiveScreen.tsx` lines 20–24 hold three hardcoded strings that render on a 2.8-second `setInterval` when you press record. The record button sets a boolean and starts a timer.
- **No WhatsApp connection.** `WhatsAppConnectScreen.tsx` line 41 renders the literal text "Connected" and a fake masked number. There is no OAuth, no API call, no state.
- **All screen data is mock,** from `src/data/mockData.ts`.
- **Only real persistence** is the light/dark theme preference in AsyncStorage.

### What is genuinely good

~3,100 lines of clean, consistent React Native. Well-organised component structure, a coherent design system (glass morphism, iOS 26 Liquid Glass detection in `src/utils/platform.ts`), fully typed domain models in `src/types/index.ts`, sensible navigation. **The design work is worth keeping.** The gap is the entire data, audio, and backend layer — which is to say, the product.

### Stack

Expo SDK 54 · React Native 0.81.5 · React 19.1 · TypeScript · React Navigation v6 (deprecated, v7 is the migration path)

Dependencies installed but **not yet imported anywhere**: `@supabase/supabase-js`, `expo-audio`, `expo-file-system`, `react-native-url-polyfill`. These are uncommitted additions staging the next phase.

### Repo layout

```
App.tsx                     # Expo entry, 2 lines
src/
├── App.tsx                 # providers + navigator
├── navigation/RootNavigator.tsx   # stack: Onboarding, Main(tabs), TranscriptDetail, WhatsAppConnect
├── screens/                # Home, Live, Archive, Settings, Onboarding, TranscriptDetail, WhatsAppConnect, Loading
├── components/             # GlassCard, GlassBackground, GlassTabBar, LiveWaveform, TranscriptCard, SpeakerChip, …
├── constants/theme.ts      # palette, typography, radii, brand colours
├── constants/layout.ts     # spacing scale
├── contexts/ThemeContext.tsx
├── data/mockData.ts        # all displayed data
├── types/index.ts          # Transcript, TranscriptSegment, Speaker, ActionItem, DashboardStats
└── utils/platform.ts       # iOS 26 Liquid Glass detection
```

### Existing domain types

These were designed for the mock UI but map closely onto what Meta actually returns, which is convenient:

```ts
type TranscriptSource = 'whatsapp_voice' | 'whatsapp_call' | 'meeting' | 'upload';
type TranscriptStatus = 'completed' | 'processing' | 'live';

interface Transcript {
  id, title, source, status, date, duration,
  participants: string[], tags: string[],
  summary?, actionItems?, segments?, keywordMatches?
}
interface TranscriptSegment { id, speakerId, text, timestamp }
```

---

## 3. The finding that determines the architecture

This is the crux. Read this section carefully — it reverses the obvious assumption.

### You cannot capture WhatsApp calls on the device. Ever.

- **iOS** — there is no API to record another app's audio. WhatsApp calls run inside the CallKit sandbox. Apple additionally rejects call-recording apps in review.
- **Android** — `MediaRecorder.AudioSource.VOICE_CALL` was restricted to system/carrier apps in API 29. Playback capture (`AudioPlaybackCaptureConfiguration`) exists but excludes `USAGE_VOICE_COMMUNICATION`, which is what all VoIP including WhatsApp uses.

No workaround exists short of root/jailbreak. Any product plan that assumes the phone can listen to a WhatsApp call is dead on arrival. **The `RECORD_AUDIO` permission and `UIBackgroundModes: ["audio"]` currently declared in `app.json` reflect that dead assumption.**

### But Meta does it natively, server-side.

On **30 June 2026** Meta launched **call transcription** for the WhatsApp Business Calling API. **Call recording** is native too. Both are first-party Meta features, not partner add-ons. (Note: several BSP blogs — Wati, respond.io, Gupshup — still say recording requires a Solution Partner. They predate the launch. Meta's own docs are authoritative.)

Enable per-call by adding an object to `POST /<PHONE_NUMBER_ID>/calls`:

```json
{
  "transcription": {
    "status": "ENABLED",
    "purpose": "quality assurance",
    "announcement_language": "en_US"
  },
  "recording": { "status": "ENABLED", "purpose": "…", "announcement_language": "en_US" }
}
```

Two webhooks then fire under the `calls` field, typically within a minute of call end:

| Webhook | Payload |
|---|---|
| `call_recording_available` | Audio as `audio/ogg; codecs=opus` — media ID, SHA-256, short-lived URL |
| `call_transcription_available` | JSON transcript — media ID, SHA-256, short-lived URL |

The transcript JSON contains `metadata` (duration, sample rate, channels) and `transcript` with:
- `text` — full conversation with `[Business]` / `[Customer]` speaker labels
- `language` — auto-detected ISO 639 code
- `confidence` — 0–1
- `segments[]` — each with `speaker`, `channel` (0 = business, 1 = customer), `start`, `end`, `text`, `confidence`, and a `words[]` array carrying **word-level timings and per-word confidence**

**Speaker separation and timestamped segments arrive for free.** No Whisper, no diarization pipeline, no audio infrastructure to build. Roughly 54 languages auto-detected. **Afrikaans is supported; Zulu and Xhosa are not** — relevant for the SA market.

### Constraints this imposes

| Constraint | Consequence for the build |
|---|---|
| **7-day retention** | Meta deletes media after 7 days. Must mirror to Supabase Storage on webhook receipt. Non-negotiable. |
| **Download URLs expire in 5 minutes** | Fetch immediately, or re-request a fresh URL via the Media API using `document.id`. |
| **Mandatory audible consent announcement** | Both parties hear *"The audio of this call will be recorded and transcribed for the following purpose: …"*. **Cannot be disabled.** Solves legal exposure; changes the UX. Every call opens with a robot disclaimer. |
| **Cloud API required** | The WhatsApp Business *app* cannot do this. Number must be on Cloud API with Calling enabled. |
| **2,000 daily unique recipients** | Production messaging-limit tier requirement. |
| **Business-initiated calling geo-blocked** | Unavailable in US, Canada, Egypt, Vietnam, Nigeria. **South Africa is fine.** |
| **Cost** | User-initiated calls are free. Business-initiated billed per 6-second pulse. ZAR is not a billing currency; expect USD. |

**Sources:** [Call transcription](https://developers.facebook.com/documentation/business-messaging/whatsapp/calling/call-transcription/) · [Call recording](https://developers.facebook.com/documentation/business-messaging/whatsapp/calling/call-recording/) · [Cloud API Calling](https://developers.facebook.com/documentation/business-messaging/whatsapp/calling) · [SIP](https://developers.facebook.com/documentation/business-messaging/whatsapp/calling/sip) · [Pricing](https://developers.facebook.com/documentation/business-messaging/whatsapp/calling/pricing)

---

## 4. What this means for the architecture

**The phone records nothing. The app is a client, not a recorder.**

```
WhatsApp call on business number
        ↓
Meta Cloud API  (records + transcribes server-side)
        ↓  webhooks: call_recording_available / call_transcription_available
Supabase Edge Function  (verify signature → fetch media within 5 min → mirror to Storage)
        ↓
Postgres (transcripts, segments, action items)  +  Storage (ogg/opus audio)
        ↓  realtime subscription
React Native app  (reads; never records)
```

Consequences for existing code:

- **`LiveScreen`'s mic button is conceptually wrong** for WhatsApp calls. It should become a live *call status* view driven by call-lifecycle webhooks, not a recorder.
- **`RECORD_AUDIO` / `UIBackgroundModes: audio` in `app.json`** are only justified if in-app meeting recording stays in scope as a separate feature. Otherwise they should go — unnecessary permissions hurt store review.
- **The real work is in Supabase, not React Native.** The screens are broadly the right screens; they need real data.
- Voice notes are a **separate, simpler pipeline** — inbound `audio` messages via the Messages API, transcribed by your own STT (Meta's transcription covers calls, not voice notes).

---

## 5. Decisions made

- **Backend is Supabase** — user has a project ready.
- **Path: WhatsApp Business Calling API**, chosen over the alternatives (Twilio conference bridge, device-side recording, voice-notes-only).
- **Research phase complete** — the API supports what the product needs.

## 6. Open questions

1. **Does the business have WhatsApp Business Cloud API access today?** A Meta app, verified business, phone number registered on Cloud API with Calling enabled. This gates all live testing. If not yet approved, the entire backend can and should be built against Meta's documented payload shapes and mock webhooks in the meantime.
2. **Supabase project ref / connection details** — needed to write Edge Functions and schema.
3. **Is the forced consent announcement acceptable to customers?** There is no silent-recording option. If it is a dealbreaker for the target market, the product thesis needs revisiting before code is written.
4. **Does in-app meeting recording stay in scope?** It is unblocked and easy, but it is a different feature from WhatsApp call transcription and drives the audio permissions.
5. **Summaries and action items** — Meta returns transcripts, not summaries. An LLM pass is needed. Model and cost not yet chosen.
6. **Multi-tenant or single-business?** Determines whether Meta credentials are per-user (embedded signup) or one set for Lumiq. Large architectural fork.

## 7. Immediate build order (proposed)

1. Supabase schema — `transcripts`, `segments`, `action_items`, `calls`, tenant/auth model
2. Edge Function webhook receiver — signature verification, event routing
3. Media mirroring job — fetch inside the 5-minute window, store in Supabase Storage, handle URL refresh
4. Replace `mockData.ts` with real Supabase queries; wire realtime
5. Rework `LiveScreen` from recorder to call-status view
6. LLM summarisation pass for summaries and action items
7. Voice-note pipeline (separate STT)
8. Reconcile `app.json` permissions with what is actually used

## 8. Housekeeping

- `npm run dev` does not exist — scripts are `start`, `android`, `ios`, `web`
- Install was broken by a corrupted npm cache entry; fixed by removing `node_modules` and `npm cache clean --force`. Currently builds clean (1,422 modules, no errors).
- 13 npm vulnerabilities (12 moderate, 1 high) — **do not run `npm audit fix --force`**, it will break the pinned Expo SDK 54 dependency tree
- `@react-navigation` v6 packages are all deprecated; v7 migration pending
- EAS `projectId` in `app.json` is still `"placeholder-update-before-build"`

---

## How to help

The useful contribution right now is **direction on sections 5 and 6**, especially the multi-tenancy fork (Q6) and whether the consent announcement is commercially acceptable (Q3) — both are cheap to decide now and expensive to reverse later.

Assume the constraints in section 3 are settled and verified against Meta's live documentation. Do not propose device-side WhatsApp call capture; it is not possible.
