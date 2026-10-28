# Meeting Pro — product vision & WhatsApp limits

## What you get (v1)

1. **Sign in** to your Lumiq business workspace (admin-provisioned accounts).
2. **Add business contacts** — names and WhatsApp numbers for clients, suppliers, and partners.
3. **WhatsApp Business calls** on your **registered Cloud API number** are transcribed by Meta after the call ends.
4. **AI meeting minutes** — title, thorough summary, and action items are stored in the app.
5. **Email** — when summarisation completes, members who opted in receive a meeting-minutes email (Resend).

## Personal WhatsApp vs Business API

Meeting Pro does **not** read or record the WhatsApp app on your phone. Transcripts come from **Meta’s WhatsApp Business Platform** for calls on a **linked Business number**.

| Scenario | Supported in v1? |
|----------|------------------|
| Call on your **WhatsApp Business** line connected to Meeting Pro | Yes |
| Match caller to a **business contact** you added | Yes (by phone number) |
| **Consumer / personal** WhatsApp on your private number | No — Meta does not expose this to third parties |

If you need work calls captured, use your **Business line** (or forward/port that workflow to the registered number). Personal-number calls cannot be transcribed with the current architecture.

## Backend checklist (ops)

- Apply migration `20261016100000_contacts_and_meeting_email.sql` on dev/prod Supabase.
- Deploy edge functions: `summarize-transcript`, `send-meeting-minutes`, `whatsapp-webhook`.
- Secrets: `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `MEETING_MINUTES_FROM`, optional `MEETING_MINUTES_HOOK_SECRET`.
- Meta: webhook URL, `META_*` secrets, row in `whatsapp_numbers` for the business.
