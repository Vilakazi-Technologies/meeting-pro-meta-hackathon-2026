# Webhook fixtures

Mock payloads for the `whatsapp-webhook` function. These drive the offline test
suite (`../run-tests.sh`). No live Cloud API access is assumed anywhere.

## Sources

Shapes are taken from Meta's own documentation, retrieved 2026-09-12:

- [Calling API and Webhook Reference](https://developers.facebook.com/documentation/business-messaging/whatsapp/calling/reference/) — connect, terminate, call status and call-created payloads
- [Call transcription](https://developers.facebook.com/documentation/business-messaging/whatsapp/calling/call-transcription/) — `call_transcription_available` payload and the transcript document
- [Cloud API media reference](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media) — retrieving a fresh media URL by id

Confirmed from those pages and relied on in the code:

| Fact | Consequence |
|---|---|
| `direction` is `BUSINESS_INITIATED` / `USER_INITIATED` (uppercase) | Mapped to the lowercase `call_direction` enum in Postgres |
| `event` values are `call_created`, `connect`, `terminate` | Plus `call_transcription_available` from the transcription page |
| Terminate `status` is `COMPLETED` or `FAILED` | Stored in `calls.status`, which is free text pending a confirmed vocabulary |
| Terminate `duration` is seconds | Docs example: `start_time` 1671644824, `end_time` 1671644944, `duration` 120 |
| Call status events use a `statuses` array, **not** `calls` | The handler loops both; a status webhook carries no call object at all |
| `document.sha256` is **base64**, not hex | Verified as base64 before the document is stored |
| Media URLs expire after 5 minutes, and download requires the Bearer token | Drives the Media API fallback path |
| Media lookup accepts an optional `phone_number_id` | Sent whenever known, to disambiguate across tenants |

## Files

| File | What it is |
|---|---|
| `01-call-connect.json` | Call answered. Creates the `calls` row. |
| `02-call-terminate.json` | Call ended, with start, end and duration. |
| `03-call-transcription-available.json` | Transcript ready, with a real document hash. |
| `04-call-transcription-available-retry.json` | **Byte-identical** redelivery of 03. Proves retries are absorbed. |
| `05-call-status.json` | `RINGING` status, using `statuses[]` instead of `calls[]`. |
| `06-unknown-phone-number-id.json` | A number belonging to no tenant. |
| `transcript-document.json` | The document served at the download URL. |

`03`'s `call_transcript.document.sha256` is the genuine base64 SHA-256 of
`transcript-document.json`, so the integrity check is really exercised rather
than stubbed. **If you edit the transcript document, recompute it:**

```sh
openssl dgst -sha256 -binary fixtures/transcript-document.json | base64
```

## Adapted, not invented

Identifiers and names are localised for the South African market (`+27` numbers,
local names, an invoice-reconciliation conversation). Structure, field names and
value formats are unchanged from Meta's examples. Timestamps are plausible unix
seconds chosen to be internally consistent.

## Flagged — not confirmed, do not treat as settled

These are the places where documentation ran out. Each is called out rather than
quietly guessed at.

1. **`session.sdp_type` on a user-initiated `connect`.** Meta's example shows
   `"answer"` on a *business-initiated* call. `"offer"` is inferred for the
   user-initiated direction and is not confirmed. Nothing in the handler reads
   this field, so the inference is inert — but do not treat the fixture as
   authoritative.

2. **`from_user_id` / `from_parent_user_id` on connect and terminate.** Meta's
   connect and terminate examples show `to_user_id` and `to_parent_user_id`, and
   carry the other party's BSUID in the `contacts[]` array. The transcription
   example *does* show `from_user_id`. Including it on the lifecycle fixtures is
   an inference. The handler tolerates its absence — `counterparty_bsuid` simply
   becomes null — but the mapping should be re-checked against a real payload.

3. **`call_recording_available` payload shape is unknown.** The feature is
   documented, the webhook body is not, and v1 does not enable recording. The
   handler logs and acknowledges it without interpreting it. No fixture written,
   because there is nothing reliable to base one on.

4. **`calls.status` vocabulary beyond `COMPLETED` / `FAILED`.** The migration
   deliberately leaves this as free text rather than an invented enum.

5. **Graph API version `v23.0`** is a chosen default in `src/meta.ts`, not a
   documented requirement. Confirm the current version before deploying.

## Out-of-order delivery — decided

**The `call_transcription_available` payload carries no `direction` field.**
Confirmed by the documented example.

Meta gives no ordering guarantee between the lifecycle and transcription
webhooks, and retries for up to seven days, so a transcript arriving before its
lifecycle event is ordinary traffic rather than an error. A missing lifecycle
event must never stop a transcript from landing.

Resolved by adding `unknown` to the `call_direction` enum — `NOT NULL` is kept,
so a row always states what is known, including that nothing is:

- A transcription event with no existing call row **creates** one with
  `direction = 'unknown'` and stores the transcript normally.
- The lifecycle event, whenever it arrives, **upgrades the same row in place**
  to the real direction.
- A late or replayed transcription event **never downgrades** a known direction
  back to `unknown`.

Three tests cover this: *"a transcript arriving before its lifecycle event still
lands"*, *"a late lifecycle event upgrades 'unknown' to the real direction"*, and
*"a replayed transcription event never downgrades a known direction"*.

Log-and-leave-for-replay still applies to everything else that is genuinely
missing — an absent document id, an unroutable phone number, a failed download.
Direction alone no longer triggers it.

A `calls` row sitting on `unknown` long after the call means a lifecycle webhook
was lost, and is worth alerting on.
