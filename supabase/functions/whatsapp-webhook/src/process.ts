import { buildDedupeKey, canonicalJson } from "./dedupe.ts";
import { sha256Hex } from "./crypto.ts";
import { DuplicateEventError } from "./db.ts";
import type { Db } from "./db.ts";
import { MetaClient } from "./meta.ts";
import { fetchAndStoreTranscript } from "./transcript.ts";
import { logError, logInfo, logWarn, redact, shortId } from "./log.ts";
import type {
  MetaCallObject,
  MetaChangeValue,
  MetaStatusObject,
  MetaWebhookBody,
} from "./types.ts";

export interface ProcessDeps {
  db: Db;
  /** Resolves the Meta access token for a tenant. Never logged, never stored. */
  resolveAccessToken: (businessId: string, whatsappNumberId: string | null) => Promise<string>;
  makeMetaClient?: (token: string) => MetaClient;
  now?: () => Date;
}

export interface ProcessOutcome {
  logged: number;
  duplicates: number;
  processed: number;
  skippedUnverified: number;
  unroutable: number;
  errors: number;
}

function unixToIso(value: string | number | undefined | null): string | null {
  if (value === undefined || value === null || value === "") return null;
  const seconds = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(seconds)) return null;
  return new Date(seconds * 1000).toISOString();
}

/** Meta sends UPPERCASE; the call_direction enum in Postgres is lowercase. */
function mapDirection(raw: string | undefined): "business_initiated" | "user_initiated" | null {
  if (raw === "BUSINESS_INITIATED") return "business_initiated";
  if (raw === "USER_INITIATED") return "user_initiated";
  return null;
}

/**
 * Pick the other party's identifiers.
 *
 * Direction decides which end of the call is the counterparty: on a
 * user-initiated call the customer is the `from` side, on a business-initiated
 * call they are the `to` side. The business-scoped user id is preferred over the
 * phone number because Meta omits `from` entirely when the user has adopted a
 * WhatsApp username.
 */
function counterparty(call: MetaCallObject, direction: string | null) {
  if (direction === "business_initiated") {
    return {
      counterparty_bsuid: call.to_user_id ?? null,
      counterparty_parent_bsuid: call.to_parent_user_id ?? null,
      counterparty_phone: call.to ?? null,
    };
  }
  return {
    counterparty_bsuid: call.from_user_id ?? null,
    counterparty_parent_bsuid: call.from_parent_user_id ?? null,
    counterparty_phone: call.from ?? null,
  };
}


/**
 * Handle one call object end to end.
 *
 * The order here is deliberate and is the heart of the idempotency guarantee:
 *   1. Build the dedupe key from the call object.
 *   2. Insert into webhook_events FIRST, before interpreting anything. If that
 *      raises a unique violation the delivery is a retry — acknowledge and stop.
 *      No interpretation has happened yet, so there is nothing to unwind.
 *   3. Only then route, and only then act.
 *
 * A failure after step 2 leaves the event logged with processed_at null and the
 * error recorded, which is exactly what a replay worker needs.
 */
async function processCall(
  call: MetaCallObject,
  value: MetaChangeValue,
  wabaId: string | null,
  signatureVerified: boolean,
  deps: ProcessDeps,
  out: ProcessOutcome,
): Promise<void> {
  const phoneNumberId = value.metadata?.phone_number_id ?? null;
  const dedupeKey = await buildDedupeKey(call);
  const eventType = String(call.event ?? "unknown");

  // Route first so the log row can carry the tenant, but never act on the result
  // until the signature has been confirmed.
  const route = phoneNumberId ? await deps.db.findNumberByPhoneNumberId(phoneNumberId) : null;

  let eventId: string;
  try {
    const inserted = await deps.db.insertWebhookEvent({
      business_id: route?.business_id ?? null,
      whatsapp_number_id: route?.whatsapp_number_id ?? null,
      event_type: eventType,
      payload: call,
      signature_verified: signatureVerified,
      meta_waba_id: wabaId,
      meta_phone_number_id: phoneNumberId,
      dedupe_key: dedupeKey,
    });
    eventId = inserted.id;
    out.logged++;
  } catch (err) {
    if (err instanceof DuplicateEventError) {
      out.duplicates++;
      logInfo("webhook.duplicate_absorbed", {
        call_id: shortId(call.id),
        call_event: eventType,
      });
      return;
    }
    throw err;
  }

  // Unverified events are recorded for forensics and then stopped. This is the
  // line between "we can see the attack" and "we acted on the attack".
  if (!signatureVerified) {
    out.skippedUnverified++;
    await deps.db.markEventProcessed(eventId, "signature not verified — logged only, not acted on");
    logWarn("webhook.unverified_not_processed", {
      call_id: shortId(call.id),
      call_event: eventType,
      phone_number_id: phoneNumberId,
    });
    return;
  }

  if (!route) {
    out.unroutable++;
    await deps.db.markEventProcessed(
      eventId,
      `no whatsapp_numbers row for phone_number_id ${phoneNumberId ?? "(absent)"}`,
    );
    logWarn("webhook.unknown_tenant", { phone_number_id: phoneNumberId, call_event: eventType });
    return;
  }

  try {
    if (eventType === "call_transcription_available") {
      await ingestTranscript(call, route, deps, phoneNumberId);
    } else if (
      eventType === "connect" || eventType === "call_created" || eventType === "terminate"
    ) {
      await ingestLifecycle(call, route, deps, phoneNumberId);
    } else {
      // Unknown or not-yet-supported event (call_recording_available lands here).
      // It is logged and acknowledged rather than errored: an unrecognised event
      // is not a failure, and erroring would make Meta retry it forever.
      logInfo("webhook.event_not_handled", { call_event: eventType, call_id: shortId(call.id) });
    }
    await deps.db.markEventProcessed(eventId, null);
    out.processed++;
  } catch (err) {
    out.errors++;
    const message = redact(err instanceof Error ? err.message : String(err));
    await deps.db.markEventProcessed(eventId, message);
    logError("webhook.processing_failed", {
      call_id: shortId(call.id),
      call_event: eventType,
      error: message,
    });
  }
}

async function ingestLifecycle(
  call: MetaCallObject,
  route: { business_id: string; whatsapp_number_id: string },
  deps: ProcessDeps,
  phoneNumberId: string | null = null,
): Promise<void> {
  const direction = mapDirection(call.direction);
  if (!direction) {
    throw new Error(
      `unrecognised direction "${call.direction ?? "(absent)"}" — refusing to guess`,
    );
  }

  const startedAt = call.event === "terminate"
    ? unixToIso(call.start_time) ?? unixToIso(call.timestamp)
    : unixToIso(call.timestamp);

  await deps.db.upsertCall({
    business_id: route.business_id,
    whatsapp_number_id: route.whatsapp_number_id,
    meta_call_id: call.id,
    direction,
    ...counterparty(call, direction),
    started_at: startedAt,
    ended_at: call.event === "terminate" ? unixToIso(call.end_time) : null,
    duration_seconds: typeof call.duration === "number" ? call.duration : null,
    status: call.status ?? call.event ?? null,
  });

  logInfo("webhook.call_upserted", {
    call_id: shortId(call.id),
    call_event: call.event,
    direction,
    phone_number_id: phoneNumberId,
  });
}

async function ingestTranscript(
  call: MetaCallObject,
  route: { business_id: string; whatsapp_number_id: string },
  deps: ProcessDeps,
  phoneNumberId: string | null = null,
): Promise<void> {
  const doc = call.call_transcript?.document;
  if (!doc?.id) throw new Error("call_transcription_available carried no document id");

  // The transcription webhook carries no `direction`. Meta gives no ordering
  // guarantee between the lifecycle and transcription webhooks and retries for up
  // to seven days, so a transcript arriving first is normal, not an error — and a
  // missing lifecycle event must never stop a transcript from landing.
  //
  // Create the call row with direction 'unknown'. The lifecycle event upgrades it
  // in place when it arrives (upsertCall merges on meta_call_id). Note this is
  // create-if-missing: an existing row keeps its real direction and is never
  // downgraded back to 'unknown' by a late or replayed transcription event.
  let existing = await deps.db.findCallByMetaId(call.id);
  if (!existing) {
    const created = await deps.db.upsertCall({
      business_id: route.business_id,
      whatsapp_number_id: route.whatsapp_number_id,
      meta_call_id: call.id,
      direction: "unknown",
      ...counterparty(call, null), // no direction, so the `from` side is all we have
      started_at: null,
      ended_at: null,
      duration_seconds: null,
      status: null,
    });
    existing = { id: created.id, business_id: route.business_id };
    logInfo("webhook.call_created_from_transcript", {
      call_id: shortId(call.id),
      direction: "unknown",
    });
  }

  // Idempotency on (meta_call_id, event): if this transcript is already stored and
  // verified against the same document hash, do not re-download it. Meta deletes
  // media after 7 days and the Media API is rate limited; a needless refetch is a
  // real cost, not just a wasted cycle.
  const current = await deps.db.findTranscriptByCallId(existing.id);
  if (current && current.status === "ready" && current.media_sha256 === doc.sha256) {
    logInfo("webhook.transcript_already_ingested", { call_id: shortId(call.id) });
    return;
  }

  await fetchAndStoreTranscript(doc, {
    businessId: route.business_id,
    whatsappNumberId: route.whatsapp_number_id,
    callRowId: existing.id,
    metaCallId: call.id,
    phoneNumberId,
  }, deps);
}

/**
 * Call status webhooks (RINGING / ACCEPTED / REJECTED) use a `statuses` array
 * instead of `calls`. They are logged so nothing is silently dropped, but they
 * carry no call detail worth normalising into the calls table.
 */
async function processStatus(
  status: MetaStatusObject,
  value: MetaChangeValue,
  wabaId: string | null,
  signatureVerified: boolean,
  deps: ProcessDeps,
  out: ProcessOutcome,
): Promise<void> {
  const phoneNumberId = value.metadata?.phone_number_id ?? null;
  const route = phoneNumberId ? await deps.db.findNumberByPhoneNumberId(phoneNumberId) : null;
  const fingerprint = await sha256Hex(canonicalJson(status));
  const dedupeKey =
    `${status.id}:call_status:${status.status ?? "unknown"}:${status.timestamp}:${fingerprint}`;

  try {
    const inserted = await deps.db.insertWebhookEvent({
      business_id: route?.business_id ?? null,
      whatsapp_number_id: route?.whatsapp_number_id ?? null,
      event_type: "call_status",
      payload: status,
      signature_verified: signatureVerified,
      meta_waba_id: wabaId,
      meta_phone_number_id: phoneNumberId,
      dedupe_key: dedupeKey,
    });
    out.logged++;
    await deps.db.markEventProcessed(inserted.id, null);
    out.processed++;
  } catch (err) {
    if (err instanceof DuplicateEventError) {
      out.duplicates++;
      return;
    }
    throw err;
  }
}

/**
 * Walk the whole webhook body.
 *
 * entry, changes, calls and statuses are ALL arrays. One POST can legitimately
 * carry several calls — reading calls[0] would silently discard the rest.
 */
export async function processWebhookBody(
  body: MetaWebhookBody,
  signatureVerified: boolean,
  deps: ProcessDeps,
): Promise<ProcessOutcome> {
  const out: ProcessOutcome = {
    logged: 0,
    duplicates: 0,
    processed: 0,
    skippedUnverified: 0,
    unroutable: 0,
    errors: 0,
  };

  for (const entry of body.entry ?? []) {
    const wabaId = entry.id ?? null;
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value) continue;

      for (const call of value.calls ?? []) {
        if (!call?.id) continue;
        await processCall(call, value, wabaId, signatureVerified, deps, out);
      }

      for (const status of value.statuses ?? []) {
        if (!status?.id) continue;
        await processStatus(status, value, wabaId, signatureVerified, deps, out);
      }
    }
  }

  return out;
}
