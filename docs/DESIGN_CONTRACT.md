# Meeting Pro — ECC design contract

**Skill:** `frontend-design-direction` (ECC) + VILATECH liquid glass (`docs/BULLETIC_GLASS.md`).  
**Chat / ad block:** `docs/MEETING_PRO_BLOCK.md` (Agency, Responsibility, calm motion, 9:16 ad spec).

| Field | Value |
|--------|--------|
| **Purpose** | Review WhatsApp Business call transcripts, contacts, and meeting-minutes email prefs after sign-in. |
| **Audience** | Business operators (VILATECH clients), daily repeat use. |
| **Tone** | Refined, calm, high-trust SaaS — not marketing landing page. |
| **Memorable detail** | Centered liquid-glass panel on web (#050505 canvas) matching vilatech.co. |
| **Primary action** | Sign in → scan recent calls/transcripts → open detail or add contact. |
| **Viewports** | `390x844` (mobile), `1440x900` (desktop framed web). |

## Content states (ECC)

| State | Implementation |
|--------|----------------|
| Loading | `LoadingScreen` + skeleton copy on data hooks |
| Empty | Contacts, Archive, Calls empty cards with next action |
| Error | Sign-in, list hooks show specific message + retry path |
| Permission | Sign-in gate; Clerk + Supabase RLS; copy on Contacts re Business API |
| Success | Transcript detail, email prefs save on blur |

## Anti-patterns avoided

- No nested cards; hero is a single glass surface (not card-in-card).
- No generic purple marketing hero; WhatsApp green used as accent only.
- Tool-first home: stats + recent transcripts above fold.
