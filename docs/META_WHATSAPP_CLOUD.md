# WhatsApp Cloud API — Meeting Pro integration

Meeting Pro does **not** capture call audio on the device. Integration is entirely **server-side**:

```
WhatsApp call (Cloud API number, Calling + transcription enabled)
        → Meta transcribes on Meta servers
        → Webhook: call_transcription_available
        → Supabase Edge Function: whatsapp-webhook
        → Postgres (calls, transcripts, segments)
        → React Native / web app (signed-in read)
```

## Webhook endpoint

After deploy:

`https://<project-ref>.supabase.co/functions/v1/whatsapp-webhook`

Dev project ref: **duurebydckodwznnmwoc**

- **GET** — Meta verification (`hub.verify_token` must match `META_VERIFY_TOKEN`).
- **POST** — Signed with `X-Hub-Signature-256` using `META_APP_SECRET`.

Deploy with JWT verification **off** for this function only:

```bash
supabase functions deploy whatsapp-webhook --no-verify-jwt
```

## Required Supabase secrets

| Secret | Purpose |
|--------|---------|
| `META_APP_SECRET` | Verify webhook signatures |
| `META_VERIFY_TOKEN` | Your chosen string; same value in Meta webhook config |
| `META_ACCESS_TOKEN` | Download transcript media from Meta (short-lived URLs) |

## Database

Each business row in `businesses` must have a row in `whatsapp_numbers` linking Meta `phone_number_id` / WABA to that tenant. Webhooks route by phone number id.

## Testing without Meta

Offline tests: `bash supabase/functions/whatsapp-webhook/run-tests.sh`

## What is not in scope yet

- In-app “connect number” (Meta registration is manual)
- Voice notes pipeline
- Per-business Meta tokens in Vault (single token env var today)
