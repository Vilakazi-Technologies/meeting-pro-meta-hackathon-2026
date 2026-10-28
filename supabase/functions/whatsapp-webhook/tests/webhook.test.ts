import test from "node:test";
import assert from "node:assert/strict";

import { handleRequest, handleVerification } from "../src/handler.ts";
import { retryTranscript } from "../src/retry.ts";
import { summarizeTranscript } from "../src/summary.ts";
import { timingSafeEqual } from "../src/crypto.ts";
import { sha256Hex } from "../src/crypto.ts";
import { buildDedupeKey, canonicalJson } from "../src/dedupe.ts";
import type { MetaWebhookBody } from "../src/types.ts";
import {
  ACCESS_TOKEN,
  APP_SECRET,
  BUSINESS_ID,
  fixtureJson,
  fixtureText,
  freshDb,
  makeDeps,
  PHONE_NUMBER_ID,
  signedRequest,
  unsignedRequest,
  VERIFY_TOKEN,
} from "./helpers.ts";

const CONFIG = { appSecret: APP_SECRET, verifyToken: VERIFY_TOKEN };
const CALL_ID =
  "wacid.HBgLMjc4MjEyMzQ1NjcVAgASGCA5QkE3RjkxMEQwQzlDNEE1RjM4RDJCMUM3RUYyQTRCNQA=";

function url(qs: string): URL {
  return new URL(`https://example.test/whatsapp-webhook?${qs}`);
}

/** Drive one fixture through the full handler and wait for background work. */
async function deliver(
  fixture: string,
  db = freshDb(),
  deps = makeDeps(db),
  sign = true,
) {
  const raw = fixtureText(fixture);
  const req = sign ? await signedRequest(raw) : unsignedRequest(raw);
  const { response, processing } = await handleRequest(req, CONFIG, deps);
  const outcome = await processing;
  return { db, deps, response, outcome };
}

// ---------------------------------------------------------------------------
// 1. Primitives
// ---------------------------------------------------------------------------

test("sha256 matches published NIST vectors", async () => {
  assert.equal(
    await sha256Hex(""),
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  );
  assert.equal(
    await sha256Hex("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
  assert.equal(
    await sha256Hex("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"),
    "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1",
  );
});

test("timing-safe compare returns correct results", () => {
  assert.equal(timingSafeEqual("abc123", "abc123"), true);
  assert.equal(timingSafeEqual("abc123", "abc124"), false);
  assert.equal(timingSafeEqual("abc", "abcdef"), false);
  assert.equal(timingSafeEqual("", ""), true);
});

test("dedupe key is stable when Meta reorders JSON keys", async () => {
  const a = { id: "wacid.X", event: "terminate", timestamp: "1757671422", duration: 220 };
  const b = { duration: 220, timestamp: "1757671422", event: "terminate", id: "wacid.X" };
  assert.equal(canonicalJson(a), canonicalJson(b));
  assert.equal(await buildDedupeKey(a as never), await buildDedupeKey(b as never));
});

test("dedupe key changes when the call object content changes", async () => {
  const a = { id: "wacid.X", event: "terminate", timestamp: "1757671422", duration: 220 };
  const b = { id: "wacid.X", event: "terminate", timestamp: "1757671422", duration: 221 };
  assert.notEqual(await buildDedupeKey(a as never), await buildDedupeKey(b as never));
});

// ---------------------------------------------------------------------------
// 2. GET verification challenge
// ---------------------------------------------------------------------------

test("GET challenge echoes hub.challenge when the token matches", async () => {
  const res = handleVerification(
    url(`hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=1158201444`),
    CONFIG,
  );
  assert.equal(res.status, 200);
  assert.equal(await res.text(), "1158201444");
});

test("GET challenge is refused with 403 on a wrong verify token", async () => {
  const res = handleVerification(
    url("hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=1158201444"),
    CONFIG,
  );
  assert.equal(res.status, 403);
  assert.notEqual(await res.text(), "1158201444");
});

test("GET challenge is refused with 400 when parameters are missing", () => {
  assert.equal(handleVerification(url("hub.mode=subscribe"), CONFIG).status, 400);
  assert.equal(handleVerification(url("hub.challenge=123"), CONFIG).status, 400);
});

test("GET challenge is refused when hub.mode is not subscribe", () => {
  const res = handleVerification(
    url(`hub.mode=unsubscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=123`),
    CONFIG,
  );
  assert.equal(res.status, 400);
});

// ---------------------------------------------------------------------------
// 3. Signature enforcement
// ---------------------------------------------------------------------------

test("a correctly signed lifecycle event is accepted and stored", async () => {
  const { db, response, outcome } = await deliver("01-call-connect.json");
  assert.equal(response.status, 200);
  assert.equal(outcome?.processed, 1);
  assert.equal(db.events.length, 1);
  assert.equal(db.events[0].signature_verified, true);
  assert.equal(db.events[0].business_id, BUSINESS_ID);
  assert.equal(db.calls.length, 1);
  assert.equal(db.calls[0].direction, "user_initiated");
  assert.equal(db.calls[0].counterparty_phone, "27821234567");
  assert.equal(db.calls[0].counterparty_bsuid, "BSUID_NTOKOZO_0001");
});

test("an unsigned request is logged as unverified and NOT acted on", async () => {
  const db = freshDb();
  const { response, outcome } = await deliver("01-call-connect.json", db, makeDeps(db), false);
  assert.equal(response.status, 200, "200 so Meta does not retry a request we will never accept");
  assert.equal(outcome?.skippedUnverified, 1);
  assert.equal(outcome?.processed, 0);
  assert.equal(db.events.length, 1, "still logged, so attacks are visible");
  assert.equal(db.events[0].signature_verified, false);
  assert.equal(db.calls.length, 0, "but nothing was written to the calls table");
});

test("a forged signature is rejected", async () => {
  const db = freshDb();
  const raw = fixtureText("01-call-connect.json");
  const req = unsignedRequest(raw, "sha256=" + "0".repeat(64));
  const { processing } = await handleRequest(req, CONFIG, makeDeps(db));
  await processing;
  assert.equal(db.events[0].signature_verified, false);
  assert.equal(db.calls.length, 0);
});

test("a signature made with the wrong secret is rejected", async () => {
  const db = freshDb();
  const raw = fixtureText("01-call-connect.json");
  const req = await signedRequest(raw, "the-wrong-secret");
  const { processing } = await handleRequest(req, CONFIG, makeDeps(db));
  await processing;
  assert.equal(db.events[0].signature_verified, false);
  assert.equal(db.calls.length, 0);
});

test("a body altered after signing is rejected", async () => {
  const db = freshDb();
  const raw = fixtureText("01-call-connect.json");
  const req = await signedRequest(raw);
  // Same signature, different body — what a tampering attempt looks like.
  const tampered = new Request(req.url, {
    method: "POST",
    headers: req.headers,
    body: raw.replace("27821234567", "27829999999"),
  });
  const { processing } = await handleRequest(tampered, CONFIG, makeDeps(db));
  await processing;
  assert.equal(db.events[0].signature_verified, false);
  assert.equal(db.calls.length, 0);
});

// ---------------------------------------------------------------------------
// 4. Fast acknowledgement
// ---------------------------------------------------------------------------

test("the 200 is returned before background processing finishes", async () => {
  const db = freshDb();
  const deps = makeDeps(db);

  // Hold the very first database call open. Nothing downstream can run until it
  // is released, so if the response still arrives, it demonstrably did not wait.
  let release!: () => void;
  let signalEntered!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const entered = new Promise<void>((resolve) => { signalEntered = resolve; });
  const realInsert = db.insertWebhookEvent.bind(db);
  db.insertWebhookEvent = async (row) => {
    signalEntered();
    await gate;
    return realInsert(row);
  };

  const req = await signedRequest(fixtureText("01-call-connect.json"));
  const { response, processing } = await handleRequest(req, CONFIG, deps);

  // The response is complete and in hand right now.
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "EVENT_RECEIVED");

  // Wait for the work to reach its first database call rather than assuming how
  // many microtask ticks that takes — the fingerprint is an async digest.
  await entered;
  assert.equal(db.events.length, 0, "work still blocked, yet the 200 was already handed back");

  release();
  const outcome = await processing;
  assert.equal(outcome?.processed, 1, "the work completes after the response");
  assert.equal(db.events.length, 1);
});

// ---------------------------------------------------------------------------
// 5. calls is an ARRAY
// ---------------------------------------------------------------------------

test("every element of the calls array is processed, not just calls[0]", async () => {
  const body = fixtureJson<MetaWebhookBody>("01-call-connect.json");
  const first = body.entry![0].changes![0].value!.calls![0];
  const second = structuredClone(first);
  second.id = "wacid.SECONDCALLINSAMEPOST000000000000000000000=";
  second.from = "27835550123";
  second.from_user_id = "BSUID_SECOND_0002";
  const third = structuredClone(first);
  third.id = "wacid.THIRDCALLINSAMEPOST0000000000000000000000=";
  third.from_user_id = "BSUID_THIRD_0003";
  body.entry![0].changes![0].value!.calls = [first, second, third];

  const db = freshDb();
  const req = await signedRequest(JSON.stringify(body));
  const { processing } = await handleRequest(req, CONFIG, makeDeps(db));
  const outcome = await processing;

  assert.equal(outcome?.processed, 3);
  assert.equal(db.events.length, 3);
  assert.equal(db.calls.length, 3);
  assert.deepEqual(
    db.calls.map((c) => c.meta_call_id).sort(),
    [first.id, second.id, third.id].sort(),
  );
});

// ---------------------------------------------------------------------------
// 6. Transcript ingestion
// ---------------------------------------------------------------------------

async function deliverLifecycleThenTranscript(fetchOpts = {}) {
  const db = freshDb();
  const deps = makeDeps(db, fetchOpts);
  for (const fixture of ["01-call-connect.json", "02-call-terminate.json"]) {
    const { processing } = await handleRequest(
      await signedRequest(fixtureText(fixture)),
      CONFIG,
      deps,
    );
    await processing;
  }
  const { processing } = await handleRequest(
    await signedRequest(fixtureText("03-call-transcription-available.json")),
    CONFIG,
    deps,
  );
  const outcome = await processing;
  return { db, deps, outcome };
}

test("transcription webhook stores the transcript and its segments", async () => {
  const { db, outcome } = await deliverLifecycleThenTranscript();

  assert.equal(outcome?.processed, 1);
  assert.equal(outcome?.errors, 0);
  assert.equal(db.transcripts.length, 1);

  const t = db.transcripts[0];
  assert.equal(t.status, "ready");
  assert.equal(t.language, "en");
  assert.equal(t.confidence, 0.91);
  assert.equal(t.duration_seconds, 220.48);
  assert.equal(t.meta_media_id, "1002764438271669");
  assert.match(t.full_text!, /quarterly reconciliation/);

  // The complete raw document is kept, because Meta deletes media after 7 days.
  assert.ok(t.raw, "raw document stored");
  assert.equal((t.raw as { metadata?: { audio?: { sample_rate?: number } } })
    .metadata?.audio?.sample_rate, 16000);

  const segs = db.segmentsFor(t.id);
  assert.equal(segs.length, 4);
  assert.deepEqual(segs.map((s) => s.segment_index), [0, 1, 2, 3]);
  assert.deepEqual(segs.map((s) => s.channel), [0, 1, 0, 1]);
  assert.deepEqual(segs.map((s) => s.speaker), ["Business", "Customer", "Business", "Customer"]);
  assert.equal(segs[0].meta_segment_id, "1");
  assert.equal((segs[0].words as unknown[]).length, 8, "word-level timings preserved");
});

test("the lifecycle terminate event fills in end time and duration", async () => {
  const { db } = await deliverLifecycleThenTranscript();
  const call = db.calls[0];
  assert.equal(call.status, "COMPLETED");
  assert.equal(call.duration_seconds, 220);
  assert.equal(call.started_at, new Date(1757671202 * 1000).toISOString());
  assert.equal(call.ended_at, new Date(1757671422 * 1000).toISOString());
});

test("an expired download URL falls back to the Media API", async () => {
  const { db, deps, outcome } = await deliverLifecycleThenTranscript({ directUrlExpired: true });
  assert.equal(outcome?.errors, 0);
  assert.equal(db.transcripts.length, 1);
  assert.equal(db.transcripts[0].status, "ready");

  const urls = deps.fetchRecorder.calls.map((c) => c.url);
  assert.ok(urls.some((u) => u.includes("?mid=")), "tried the webhook URL first");
  assert.ok(urls.some((u) => u.includes("graph.facebook.com")), "asked the Media API for a fresh URL");
  assert.ok(
    urls.some((u) => u.includes(`phone_number_id=${PHONE_NUMBER_ID}`)),
    "sent phone_number_id so the media is unambiguous across tenants",
  );
  assert.ok(urls.some((u) => u.includes("/fresh/")), "downloaded from the fresh URL");
});

test("a document failing its sha256 check is recorded as failed, with no content", async () => {
  const { db, outcome } = await deliverLifecycleThenTranscript({ corruptBody: true });
  assert.equal(outcome?.errors, 1);

  // The failure is visible, so the call does not silently vanish from the app...
  assert.equal(db.transcripts.length, 1);
  const t = db.transcripts[0];
  assert.equal(t.status, "failed");
  // ...but nothing from the unverified document was stored.
  assert.equal(t.full_text, null, "no unverified text");
  assert.equal(t.raw, null, "no unverified document");
  assert.equal(db.segmentsFor(t.id).length, 0, "no unverified segments");
  // Meta's references are kept, so a retry knows what to fetch and verify.
  assert.equal(t.meta_media_id, "1002764438271669");
  assert.ok(t.media_sha256);

  const evt = db.events.find((e) => e.event_type === "call_transcription_available")!;
  assert.equal(evt.processed_at !== null, true);
  assert.match(evt.error!, /hash mismatch/i);
});

test("a transcript arriving before its lifecycle event still lands", async () => {
  // Meta gives no ordering guarantee and retries for up to seven days, so this is
  // normal traffic, not an error. The call row is created with direction 'unknown'.
  const db = freshDb();
  const { processing } = await handleRequest(
    await signedRequest(fixtureText("03-call-transcription-available.json")),
    CONFIG,
    makeDeps(db),
  );
  const outcome = await processing;

  assert.equal(outcome?.errors, 0, "not an error");
  assert.equal(outcome?.processed, 1);
  assert.equal(db.calls.length, 1);
  assert.equal(db.calls[0].direction, "unknown");
  assert.equal(db.transcripts.length, 1, "the transcript landed regardless");
  assert.equal(db.segmentsFor(db.transcripts[0].id).length, 4);
  assert.equal(db.events[0].error, null);
});

test("a late lifecycle event upgrades 'unknown' to the real direction", async () => {
  const db = freshDb();
  const deps = makeDeps(db);

  // Transcript first.
  let res = await handleRequest(
    await signedRequest(fixtureText("03-call-transcription-available.json")), CONFIG, deps);
  await res.processing;
  assert.equal(db.calls[0].direction, "unknown");
  const callRowId = db.calls[0].id;

  // Lifecycle second — the out-of-order case.
  res = await handleRequest(
    await signedRequest(fixtureText("02-call-terminate.json")), CONFIG, deps);
  await res.processing;

  assert.equal(db.calls.length, 1, "upgraded in place, not a second row");
  assert.equal(db.calls[0].id, callRowId, "same row");
  assert.equal(db.calls[0].direction, "user_initiated", "upgraded from unknown");
  assert.equal(db.calls[0].status, "COMPLETED");
  assert.equal(db.calls[0].duration_seconds, 220);
  assert.equal(db.transcripts.length, 1, "transcript untouched by the upgrade");
});

test("a replayed transcription event never downgrades a known direction", async () => {
  const db = freshDb();
  const deps = makeDeps(db);
  // Lifecycle first, so direction is real.
  let res = await handleRequest(
    await signedRequest(fixtureText("01-call-connect.json")), CONFIG, deps);
  await res.processing;
  assert.equal(db.calls[0].direction, "user_initiated");

  // Then a transcription event arrives.
  res = await handleRequest(
    await signedRequest(fixtureText("03-call-transcription-available.json")), CONFIG, deps);
  await res.processing;

  assert.equal(db.calls.length, 1);
  assert.equal(db.calls[0].direction, "user_initiated", "not downgraded to unknown");
});

// ---------------------------------------------------------------------------
// 7. Retries and idempotency — the point of the whole exercise
// ---------------------------------------------------------------------------

test("a retry of the same event is absorbed, not duplicated", async () => {
  const { db, deps } = await deliverLifecycleThenTranscript();

  const eventsAfterFirst = db.events.length;
  const transcriptId = db.transcripts[0].id;
  const segmentsAfterFirst = db.segmentsFor(transcriptId).length;
  const fetchesAfterFirst = deps.fetchRecorder.calls.length;

  // Fixture 04 is the SAME payload delivered again, byte for byte.
  const retryRaw = fixtureText("04-call-transcription-available-retry.json");
  assert.equal(
    retryRaw,
    fixtureText("03-call-transcription-available.json"),
    "the retry fixture really is byte-identical",
  );

  const { response, processing } = await handleRequest(
    await signedRequest(retryRaw),
    CONFIG,
    deps,
  );
  const outcome = await processing;

  assert.equal(response.status, 200, "a retry is acknowledged, never errored");
  assert.equal(outcome?.duplicates, 1, "recognised as a duplicate");
  assert.equal(outcome?.processed, 0, "and not processed again");
  assert.equal(outcome?.errors, 0, "a duplicate is not an error");

  assert.equal(db.events.length, eventsAfterFirst, "no second webhook_events row");
  assert.equal(db.transcripts.length, 1, "still exactly one transcript");
  assert.equal(db.segmentsFor(transcriptId).length, segmentsAfterFirst, "segments not duplicated");
  assert.equal(db.segmentsFor(transcriptId).length, 4);
  assert.equal(
    deps.fetchRecorder.calls.length,
    fetchesAfterFirst,
    "the document was not downloaded a second time",
  );
});

test("downstream processing is idempotent on (meta_call_id, event), not just the log", async () => {
  // A redelivery that is NOT byte-identical gets past the dedupe_key unique index.
  // The second line of defence must still prevent duplicate rows.
  const { db, deps } = await deliverLifecycleThenTranscript();
  const transcriptId = db.transcripts[0].id;

  const body = fixtureJson<MetaWebhookBody>("03-call-transcription-available.json");
  body.entry![0].changes![0].value!.calls![0].timestamp = "1757671999"; // different key
  const { processing } = await handleRequest(
    await signedRequest(JSON.stringify(body)),
    CONFIG,
    deps,
  );
  const outcome = await processing;

  assert.equal(outcome?.duplicates, 0, "a new dedupe_key, so the log accepted it");
  assert.equal(db.events.length, 4, "logged as a distinct event");
  assert.equal(db.transcripts.length, 1, "but still only one transcript row");
  assert.equal(db.segmentsFor(transcriptId).length, 4, "and segments were not doubled");
});

test("replaying a lifecycle event does not create a second call row", async () => {
  const db = freshDb();
  const deps = makeDeps(db);
  for (let i = 0; i < 2; i++) {
    const body = fixtureJson<MetaWebhookBody>("02-call-terminate.json");
    body.entry![0].changes![0].value!.calls![0].timestamp = `17576714${20 + i}`;
    const { processing } = await handleRequest(
      await signedRequest(JSON.stringify(body)),
      CONFIG,
      deps,
    );
    await processing;
  }
  assert.equal(db.events.length, 2);
  assert.equal(db.calls.length, 1, "upsert on meta_call_id, not insert");
});

// ---------------------------------------------------------------------------
// 8. Routing and robustness
// ---------------------------------------------------------------------------

test("an event for an unknown phone_number_id is logged but not acted on", async () => {
  const { db, outcome } = await deliver("06-unknown-phone-number-id.json");
  assert.equal(outcome?.unroutable, 1);
  assert.equal(outcome?.processed, 0);
  assert.equal(db.events.length, 1);
  assert.equal(db.events[0].business_id, null, "no tenant to attribute it to");
  assert.equal(db.events[0].meta_phone_number_id, "999999999999999");
  assert.match(db.events[0].error!, /no whatsapp_numbers row/);
  assert.equal(db.calls.length, 0);
});

test("a call status webhook using statuses[] is logged without crashing", async () => {
  const { db, response, outcome } = await deliver("05-call-status.json");
  assert.equal(response.status, 200);
  assert.equal(outcome?.errors, 0);
  assert.equal(db.events.length, 1);
  assert.equal(db.events[0].event_type, "call_status");
  assert.equal(db.calls.length, 0, "a RINGING status carries nothing to normalise");
});

test("an unparseable body is acknowledged without throwing", async () => {
  const db = freshDb();
  const req = await signedRequest("this is not json");
  const { response, processing } = await handleRequest(req, CONFIG, makeDeps(db));
  assert.equal(response.status, 200);
  assert.equal(await processing, null);
  assert.equal(db.events.length, 0);
});

test("a body with no entries is handled cleanly", async () => {
  const db = freshDb();
  const req = await signedRequest(JSON.stringify({ object: "whatsapp_business_account" }));
  const { response, processing } = await handleRequest(req, CONFIG, makeDeps(db));
  const outcome = await processing;
  assert.equal(response.status, 200);
  assert.equal(outcome?.logged, 0);
  assert.equal(db.events.length, 0);
});

test("a non-GET, non-POST method is refused", async () => {
  const req = new Request("https://example.test/whatsapp-webhook", { method: "DELETE" });
  const { response } = await handleRequest(req, CONFIG, makeDeps(freshDb()));
  assert.equal(response.status, 405);
});

test("an unrecognised event type is acknowledged rather than errored", async () => {
  const body = fixtureJson<MetaWebhookBody>("01-call-connect.json");
  body.entry![0].changes![0].value!.calls![0].event = "call_recording_available";
  const db = freshDb();
  const { processing } = await handleRequest(
    await signedRequest(JSON.stringify(body)),
    CONFIG,
    makeDeps(db),
  );
  const outcome = await processing;
  assert.equal(outcome?.errors, 0, "erroring would make Meta retry it forever");
  assert.equal(outcome?.processed, 1);
  assert.equal(db.calls.length, 0, "but nothing was invented from it");
});

// ---------------------------------------------------------------------------
// 9. Secrets and content must never reach the logs
// ---------------------------------------------------------------------------

test("logs contain neither the access token nor transcript text", async () => {
  const written: string[] = [];
  const orig = { log: console.log, warn: console.warn, error: console.error };
  for (const k of ["log", "warn", "error"] as const) {
    console[k] = (...args: unknown[]) => { written.push(args.map(String).join(" ")); };
  }
  try {
    await deliverLifecycleThenTranscript();
  } finally {
    Object.assign(console, orig);
  }

  const all = written.join("\n");
  assert.ok(all.length > 0, "the run did log something");
  assert.ok(!all.includes(ACCESS_TOKEN), "access token never logged");
  assert.ok(!all.includes("quarterly reconciliation"), "transcript text never logged");
  assert.ok(!all.includes("Thandi speaking"), "transcript text never logged");
  assert.ok(!all.includes(APP_SECRET), "app secret never logged");
  // The useful diagnostics are still there.
  assert.ok(all.includes("transcript.stored"), "ingest is traceable");
  assert.ok(all.includes("1002764438271669"), "media id logged for correlation");
  assert.ok(all.includes('"segments":4'), "segment count logged");
  assert.ok(all.includes(PHONE_NUMBER_ID), "routing key logged");
  // Regression guard: Meta call objects carry their own `event` field, which must
  // never overwrite the log event name.
  assert.ok(!all.includes('"event":"connect"'), "call event did not clobber log event name");
  assert.ok(all.includes("webhook.call_upserted"));
});

test("the access token is sent to Meta as a Bearer header", async () => {
  const { deps } = await deliverLifecycleThenTranscript();
  assert.ok(deps.fetchRecorder.calls.length > 0);
  for (const c of deps.fetchRecorder.calls) {
    assert.equal(c.authorization, `Bearer ${ACCESS_TOKEN}`);
  }
});

// ---------------------------------------------------------------------------
// 10. Failed transcripts are visible, and can be retried
// ---------------------------------------------------------------------------

test("a download that fails outright leaves a visible failed transcript", async () => {
  // Webhook link expired AND the Media API refused: nothing could be fetched.
  const { db, outcome } = await deliverLifecycleThenTranscript({
    directUrlExpired: true,
    mediaApiFails: true,
  });
  assert.equal(outcome?.errors, 1);
  assert.equal(db.transcripts.length, 1, "the call has a transcript row the app can show");
  assert.equal(db.transcripts[0].status, "failed");
  assert.match(
    db.events.find((e) => e.event_type === "call_transcription_available")!.error!,
    /Media API lookup failed/,
  );
});

test("a failed re-fetch never overwrites a transcript that is already ready", async () => {
  const { db, deps } = await deliverLifecycleThenTranscript();
  const good = db.transcripts[0];
  assert.equal(good.status, "ready");

  // A later event naming a different hash, whose download then fails the check.
  const body = fixtureJson<MetaWebhookBody>("03-call-transcription-available.json");
  const doc = body.entry![0].changes![0].value!.calls![0].call_transcript!.document!;
  doc.sha256 = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
  body.entry![0].changes![0].value!.calls![0].timestamp = "1757699999";
  const { processing } = await handleRequest(await signedRequest(JSON.stringify(body)), CONFIG, deps);
  const outcome = await processing;

  assert.equal(outcome?.errors, 1, "the bad download is still reported");
  assert.equal(db.transcripts.length, 1);
  assert.equal(db.transcripts[0].status, "ready", "not downgraded to failed");
  assert.match(db.transcripts[0].full_text!, /quarterly reconciliation/, "content intact");
  assert.equal(db.segmentsFor(good.id).length, 4, "segments intact");
});

/** A failed transcript, ready to be retried. */
async function failedTranscript() {
  const { db } = await deliverLifecycleThenTranscript({
    directUrlExpired: true,
    mediaApiFails: true,
  });
  assert.equal(db.transcripts[0].status, "failed");
  return { db, transcriptId: db.transcripts[0].id };
}

const allow = () => Promise.resolve(true);
const deny = () => Promise.resolve(false);

test("retry: a failed transcript is fetched through the Media API and becomes ready", async () => {
  const { db, transcriptId } = await failedTranscript();
  const deps = makeDeps(db); // Meta is reachable again

  const result = await retryTranscript(transcriptId, allow, deps);

  assert.equal(result.outcome, "ready");
  assert.equal(db.transcripts[0].status, "ready");
  assert.match(db.transcripts[0].full_text!, /quarterly reconciliation/);
  assert.equal(db.segmentsFor(transcriptId).length, 4);

  const urls = deps.fetchRecorder.calls.map((c) => c.url);
  assert.ok(!urls.some((u) => u.includes("?mid=")), "never tried the long-expired webhook link");
  assert.ok(urls.some((u) => u.includes("graph.facebook.com")), "went to the Media API");
  assert.ok(urls.some((u) => u.includes(`phone_number_id=${PHONE_NUMBER_ID}`)), "scoped to the tenant's number");
});

test("retry: when Meta still refuses, the transcript stays failed and says so", async () => {
  const { db, transcriptId } = await failedTranscript();
  const result = await retryTranscript(transcriptId, allow, makeDeps(db, { mediaApiFails: true }));
  assert.equal(result.outcome, "failed");
  assert.equal(db.transcripts[0].status, "failed");
  assert.ok(!/HTTP|lookup|sha256/i.test(result.message), "no technical detail in the customer message");
});

test("retry: a caller who cannot see the transcript gets not_found and nothing runs", async () => {
  const { db, transcriptId } = await failedTranscript();
  const deps = makeDeps(db);
  const result = await retryTranscript(transcriptId, deny, deps);
  assert.equal(result.outcome, "not_found", "reported as missing, not forbidden");
  assert.equal(deps.fetchRecorder.calls.length, 0, "Meta was never contacted");
  assert.equal(db.transcripts[0].status, "failed", "nothing changed");
});

test("retry: an unknown transcript id is not_found", async () => {
  const deps = makeDeps(freshDb());
  const result = await retryTranscript("no-such-id", allow, deps);
  assert.equal(result.outcome, "not_found");
  assert.equal(deps.fetchRecorder.calls.length, 0);
});

test("retry: a transcript that is already ready is left alone", async () => {
  const { db } = await deliverLifecycleThenTranscript();
  const deps = makeDeps(db);
  const result = await retryTranscript(db.transcripts[0].id, allow, deps);
  assert.equal(result.outcome, "already_ready");
  assert.equal(deps.fetchRecorder.calls.length, 0, "no needless download");
});

test("retry: past Meta's 7-day retention it is refused without contacting Meta", async () => {
  const { db, transcriptId } = await failedTranscript();
  db.transcripts[0].created_at = new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString();
  const deps = makeDeps(db);
  const result = await retryTranscript(transcriptId, allow, deps);
  assert.equal(result.outcome, "not_retryable");
  assert.match(result.message, /7 days/);
  assert.equal(deps.fetchRecorder.calls.length, 0);
});

test("retry: without Meta's hash there is nothing to verify against, so it refuses", async () => {
  const { db, transcriptId } = await failedTranscript();
  db.transcripts[0].media_sha256 = null;
  const deps = makeDeps(db);
  const result = await retryTranscript(transcriptId, allow, deps);
  assert.equal(result.outcome, "not_retryable");
  assert.equal(deps.fetchRecorder.calls.length, 0, "never downloads what it cannot verify");
  assert.equal(db.transcripts[0].full_text, null);
});

// ---------------------------------------------------------------------------
// 11. The summary pass
// ---------------------------------------------------------------------------

const GOOD_REPLY = JSON.stringify({
  title: 'Quarterly reconciliation call',
  summary: 'Ntokozo called about the quarterly reconciliation. Thandi had the outstanding invoices to hand and agreed to send a statement.',
  action_items: [{ text: 'Send the statement to Ntokozo by Friday', owner: 'Thandi' }],
});

/** A stub model. Returns whatever it is told to, and records what it was asked. */
function stubModel(reply: string | (() => never)) {
  const calls: { system: string; user: string }[] = [];
  const callModel = async (req: { system: string; user: string }) => {
    calls.push(req);
    if (typeof reply !== 'string') reply();
    return { text: reply as string, model: 'claude-haiku-4-5', usage: { input_tokens: 500, output_tokens: 120 } };
  };
  return { callModel, calls };
}

async function transcriptReady() {
  const { db } = await deliverLifecycleThenTranscript();
  return { db, transcriptId: db.transcripts[0].id };
}

test("summary: a good reply is parsed and stored with its action item", async () => {
  const { db, transcriptId } = await transcriptReady();
  const model = stubModel(GOOD_REPLY);

  const result = await summarizeTranscript(transcriptId, allow, { db, callModel: model.callModel });

  assert.equal(result.outcome, "ready");
  assert.equal(db.summaryStatus.get(transcriptId), "ready");
  assert.equal(db.summaries.get(transcriptId)!.title, "Quarterly reconciliation call");
  assert.equal(db.summaries.get(transcriptId)!.model, "claude-haiku-4-5");
  assert.equal(db.aiActionItemsFor(transcriptId).length, 1);
  assert.equal(db.aiActionItemsFor(transcriptId)[0].owner, "Thandi");
  // The transcript itself is untouched.
  assert.match(db.transcripts[0].full_text!, /quarterly reconciliation/);
});

test("summary: the prompt forbids invented action items and an empty list is accepted", async () => {
  const { db, transcriptId } = await transcriptReady();
  const model = stubModel(JSON.stringify({
    title: 'Courtesy call', summary: 'A short check-in with no commitments made.', action_items: [],
  }));

  const result = await summarizeTranscript(transcriptId, allow, { db, callModel: model.callModel });

  assert.equal(result.outcome, "ready");
  assert.equal(db.aiActionItemsFor(transcriptId).length, 0, "an empty list is a valid answer");
  // The instruction is in the prompt, not just in our hopes.
  assert.match(model.calls[0].system, /DO NOT INVENT ACTION ITEMS/);
  // Whitespace-tolerant: the prompt is hard-wrapped, so a plain substring match
  // would break on where the line happens to end.
  assert.match(model.calls[0].system.replace(/\s+/g, ' '), /empty\s?array is the correct and expected answer/);
  assert.match(model.calls[0].system, /No markdown code fences/);
});

test("summary: running it twice does not duplicate action items", async () => {
  const { db, transcriptId } = await transcriptReady();
  const model = stubModel(GOOD_REPLY);
  const deps = { db, callModel: model.callModel };

  await summarizeTranscript(transcriptId, allow, deps);
  const second = await summarizeTranscript(transcriptId, allow, deps);

  assert.equal(second.outcome, "already_summarized");
  assert.equal(model.calls.length, 1, "no needless second model call, and no second bill");
  assert.equal(db.aiActionItemsFor(transcriptId).length, 1);
});

test("summary: a forced re-run replaces AI items and leaves hand-made ones alone", async () => {
  const { db, transcriptId } = await transcriptReady();
  await summarizeTranscript(transcriptId, allow, { db, callModel: stubModel(GOOD_REPLY).callModel });

  db.actionItems.push({
    id: 'human-1', transcript_id: transcriptId, business_id: db.transcripts[0].business_id,
    text: 'Added by a person', owner: null, is_ai_generated: false,
  });

  const model = stubModel(JSON.stringify({
    title: 'Reconciliation follow-up', summary: 'Second pass over the same call.',
    action_items: [{ text: 'Email the statement', owner: null }, { text: 'Chase the invoice', owner: null }],
  }));
  const result = await summarizeTranscript(transcriptId, allow, { db, callModel: model.callModel }, { force: true });

  assert.equal(result.outcome, "ready");
  assert.equal(db.aiActionItemsFor(transcriptId).length, 2, "replaced, not appended");
  assert.equal(db.actionItems.filter((a) => !a.is_ai_generated).length, 1, "the person's item survived");
});

test("summary: unparseable output is a failure and stores nothing", async () => {
  for (const bad of [
    "Here you go!\n{\"title\": \"x\"}",       // prose around the JSON
    "{\"title\": \"x\", \"summary\":}",         // broken JSON
    JSON.stringify({ title: 'x', summary: 'y' }),                       // action_items missing
    JSON.stringify({ title: '', summary: 'y', action_items: [] }),      // empty title
    JSON.stringify({ title: 'x', summary: 'y', action_items: 'none' }), // wrong type
    JSON.stringify({ title: 'x', summary: 'y', action_items: [{ owner: 'Sam' }] }), // item has no text
    JSON.stringify(['not', 'an', 'object']),
    "",
  ]) {
    const { db, transcriptId } = await transcriptReady();
    const result = await summarizeTranscript(transcriptId, allow, { db, callModel: stubModel(bad).callModel });

    assert.equal(result.outcome, "failed", `should reject: ${bad.slice(0, 40)}`);
    assert.equal(db.summaryStatus.get(transcriptId), "failed");
    assert.equal(db.summaries.get(transcriptId)!.summary, "", "no partial summary written");
    assert.equal(db.aiActionItemsFor(transcriptId).length, 0, "no action items written");
    assert.match(db.transcripts[0].full_text!, /quarterly reconciliation/, "the transcript is untouched");
  }
});

test("summary: a fenced reply is still read, since the wrapper is unambiguous", async () => {
  const { db, transcriptId } = await transcriptReady();
  const model = stubModel("```json\n" + GOOD_REPLY + "\n```");
  const result = await summarizeTranscript(transcriptId, allow, { db, callModel: model.callModel });
  assert.equal(result.outcome, "ready");
  assert.equal(db.aiActionItemsFor(transcriptId).length, 1);
});

test("summary: a model error is recorded as failed, not swallowed", async () => {
  const { db, transcriptId } = await transcriptReady();
  const model = stubModel(() => { throw new Error("529 overloaded"); });

  const result = await summarizeTranscript(transcriptId, allow, { db, callModel: model.callModel });

  assert.equal(result.outcome, "failed");
  assert.equal(db.summaryStatus.get(transcriptId), "failed");
  assert.match(db.summaries.get(transcriptId)!.error!, /529/);
  assert.ok(!/529|overloaded/.test(result.message), "the customer message carries no technical detail");
});

test("summary: a caller who cannot see the transcript gets not_found and no model call", async () => {
  const { db, transcriptId } = await transcriptReady();
  const model = stubModel(GOOD_REPLY);
  const result = await summarizeTranscript(transcriptId, deny, { db, callModel: model.callModel });
  assert.equal(result.outcome, "not_found");
  assert.equal(model.calls.length, 0, "nothing was sent to the model, and nothing was billed");
  assert.equal(db.summaryStatus.get(transcriptId), undefined);
});

test("summary: a failed transcript has no text, so it is not sent to the model", async () => {
  const { db } = await deliverLifecycleThenTranscript({ directUrlExpired: true, mediaApiFails: true });
  const model = stubModel(GOOD_REPLY);
  const result = await summarizeTranscript(db.transcripts[0].id, allow, { db, callModel: model.callModel });

  assert.equal(result.outcome, "not_summarizable");
  assert.equal(model.calls.length, 0);
  assert.equal(db.summaryStatus.get(db.transcripts[0].id), undefined, "not recorded as a summary failure");
});

test("summary: the transcript text is what gets sent", async () => {
  const { db, transcriptId } = await transcriptReady();
  const model = stubModel(GOOD_REPLY);
  await summarizeTranscript(transcriptId, allow, { db, callModel: model.callModel });
  assert.match(model.calls[0].user, /Good morning, Lumiq Industries/);
  assert.match(model.calls[0].user, /statement through to my email/);
});

test("a stored transcript triggers summarisation; a failed one does not", async () => {
  const triggered: string[] = [];
  const db = freshDb();
  const deps = { ...makeDeps(db), onTranscriptStored: (id: string) => triggered.push(id) };
  for (const fixture of ["01-call-connect.json", "03-call-transcription-available.json"]) {
    const { processing } = await handleRequest(await signedRequest(fixtureText(fixture)), CONFIG, deps);
    await processing;
  }
  assert.deepEqual(triggered, [db.transcripts[0].id], "fired once, for the stored transcript");

  const failing = freshDb();
  const failDeps = {
    ...makeDeps(failing, { directUrlExpired: true, mediaApiFails: true }),
    onTranscriptStored: () => { throw new Error("should not be called"); },
  };
  const { processing } = await handleRequest(
    await signedRequest(fixtureText("03-call-transcription-available.json")), CONFIG, failDeps);
  const outcome = await processing;
  assert.equal(outcome?.errors, 1, "the download failure is still reported");
  assert.equal(failing.transcripts[0].status, "failed");
});
