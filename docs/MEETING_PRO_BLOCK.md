# Meeting Pro block

Copy-paste block for Cursor chats, design reviews, and Meta ad production.  
**Project folder:** `WhatsAppTranscriber` · **Live:** [meeting-pro-rho.vercel.app](https://meeting-pro-rho.vercel.app)

---

## Paste into a new chat (full block)

```
You are working on Meeting Pro (WhatsAppTranscriber) for Lumiq Industries.

MANDATORY skills: frontend-design-direction, apple-design-principles, motion-foundations, motion-patterns (calm UI only — no decorative loops on data paths).

Product: Expo 54 (iOS, Android, web). Clerk auth, Supabase data, Meta WhatsApp Business Cloud API for call transcripts (not on-device recording). Trust green + quality blue on luminescent story canvas; liquid glass on tab bar only.

── Agency (people feel in control) ──
• Sign out, theme (light/dark), and email-minutes prefs are always reachable in Settings.
• Destructive or irreversible actions need explicit confirmation; everything else is undo-friendly or low-risk.
• No forced linear traps: scroll works on sign-in and onboarding; dashboard is default after auth.
• Loading and errors name what failed and offer retry or a safe next step (refresh, go back, contact admin).
• AI summaries and emailed minutes are opt-in; user chooses override email; can turn off without losing account access.

── Responsibility (transcripts & AI) ──
• Plain copy: transcripts come from Meta on the linked Business number; personal WhatsApp is not read.
• No Meta WhatsApp logo in UI — Meeting Pro mark only.
• AI summaries are assistive, not authoritative: show source call, date, and “review before sharing with clients.”
• When summary or transcript is missing/failed, say so clearly; offer retry where backend supports it; never invent content.
• Permissions and integrations (Business line, email minutes) explain why before asking; secrets only on Supabase Edge, never client bundles.
• Hackathon / marketing language must match product truth: calls via Cloud API today; voice-note pipeline separate if not shipped.

── Calm motion ──
• Motion guides attention or state only (tab change, sheet, refresh, loading progress) — not ambient jitter on lists or metrics.
• Story background: slow drift (web) or static washes (native); respect prefers-reduced-motion (disable drift, opacity-only ≤200ms).
• Glass tab bar: subtle press scale; no bouncing loaders on call history rows.
• Durations: fast for taps, normal for modals, slow only for splash/onboarding hero — never loop anxiety on “waiting for transcript.”

── Meta ad spec: 9:16 “voice note → decision” (≤10s, motion-only) ──
Format: 1080×1920, 9:16, Reels/Stories. No static poster frame as the ad. Safe zones: top 12% and bottom 20% clear for UI chrome and captions.

| Time | Visual (motion) | On-screen text (optional, short) |
|------|-----------------|----------------------------------|
| 0.0–1.5s | Phone POV: WhatsApp-style chat blur (generic UI, not Meta marks). Voice note bubble pulses once, calm waveform. | “That voice note?” |
| 1.5–3.5s | Match cut to Meeting Pro app (real UI or faithful mock): transcript lines type in softly; speaker chips appear. | “Becomes minutes.” |
| 3.5–5.5s | Highlight AI summary card: decision + one action item staggers in (opacity, no bounce). Trust green accent on “decision.” | “Decision. Owner. Due.” |
| 5.5–7.5s | Quick glance: Archive search + dashboard ring gauge (answer rate) — single cross-dissolve, no flashy charts. | “Searchable. Measurable.” |
| 7.5–10s | End card: Meeting Pro mark on story gradient; Lumiq Industries wordmark small. | “Meeting Pro · Business calls → minutes” + CTA “Link your Business line” |

Audio: single understated bed (optional); no voice-over required. If VO: South African business tone, not hype.  
Brand: premium, classy, luminescent gradients — same family as vilatech.co story canvas, not purple marketing blobs.

Deliverables when implementing: scorecard notes for Agency/Responsibility gaps in app copy + this ad as Remotion/storyboard reference.

Docs in repo: docs/DESIGN_CONTRACT.md, docs/WHATSAPP_BUSINESS_SETUP.md, docs/PHANKY Final Steps.md.
```

---

## Agency — product checklist

| Area | Expectation in Meeting Pro |
|------|----------------------------|
| Settings | Theme, email minutes, sign out, integration status visible |
| Navigation | Back works; tab bar predictable; no dead-end onboarding |
| Errors | Specific message + retry/refresh where possible |
| AI / email | Opt-in; clear off switch; no silent send |
| Exploration | Dashboard first; connect flow documented, not fake “Connected” |

---

## Responsibility — transcripts & AI

| Topic | Copy / behavior standard |
|-------|---------------------------|
| Data source | “Transcribed by WhatsApp Business Cloud API after the call ends — not recorded on this device.” |
| Scope | Business Cloud API number only; personal WhatsApp out of scope |
| AI summaries | Label as draft assistance; user reviews before client-facing share |
| Failure | `failed` transcript state with retry + 7-day Meta retention note |
| Brand / legal | Meeting Pro icon; no `logo-whatsapp` in product UI |
| Secrets | `META_*`, `CLERK_SECRET_KEY`, model keys on Supabase Edge only |

---

## Calm motion — implementation notes

| Surface | Rule |
|---------|------|
| `GlassBackground` | Story gradients; web ambient drift **off** when reduced motion |
| Lists (Calls, Archive) | Pull-to-refresh only; no infinite shimmer on rows |
| `LoadingScreen` | One hero entrance; no looping panic animation on metrics |
| Tab bar | Liquid glass + press feedback; no continuous glow pulse |
| Clerk sign-in | No overlapping motion on hero + card |

Reference tokens (when adding web motion): prefer **gentle** / **snappy** springs; **fast** (≤200ms) under reduced motion.

---

## 9:16 ad — production brief (standalone)

**Title:** Voice note → decision  
**Length:** 6–10 seconds (deliver 10s master, cut 6s variant at 5.5s end card)  
**Aspect:** 9:16 (1080×1920)  
**Style:** Motion-only, luminescent dark canvas, trust green + quality blue accents  
**Story arc:** confusion in chat → clarity in Meeting Pro → accountable decision → trust CTA  
**Avoid:** Meta WhatsApp logo, fake “we read your chats” implication, jitter loaders, stock corporate handshake clips  

**CTA:** Link WhatsApp Business line (see `docs/WHATSAPP_BUSINESS_SETUP.md`)  
**End card lockup:** Meeting Pro mark + “Lumiq Industries”

---

## Related files

- [DESIGN_CONTRACT.md](./DESIGN_CONTRACT.md) — ECC viewport + states  
- [BULLETIC_GLASS.md](./BULLETIC_GLASS.md) — glass on nav only  
- [VISION_AND_WHATSAPP.md](./VISION_AND_WHATSAPP.md) — product limits  
