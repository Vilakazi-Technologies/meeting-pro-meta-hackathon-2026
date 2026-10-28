// Meeting Pro — WhatsApp calls webhook receiver.
//
// Production entry point. This is the ONLY file that touches the Deno runtime or
// the network; everything it wires together lives under src/ and is exercised by
// the offline test suite in tests/.
//
// Deploy:  supabase functions deploy whatsapp-webhook --no-verify-jwt
//   --no-verify-jwt is required. Meta authenticates with X-Hub-Signature-256,
//   not a Supabase JWT, and will never send an Authorization header.
//
// Required secrets (supabase secrets set ...):
//   META_APP_SECRET    — app secret, used for the X-Hub-Signature-256 HMAC
//   META_VERIFY_TOKEN  — the token entered in the Meta app webhook config
//   META_ACCESS_TOKEN  — see the note on token resolution below
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — injected by the platform

import { createClient } from "jsr:@supabase/supabase-js@2";
import { handleRequest } from "./src/handler.ts";
import { SupabaseDb } from "./src/supabase-db.ts";
import { logError, logInfo } from "./src/log.ts";
import { resolveAccessToken } from "../_shared/meta-token.ts";

const appSecret = Deno.env.get("META_APP_SECRET") ?? "";
const verifyToken = Deno.env.get("META_VERIFY_TOKEN") ?? "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!appSecret || !verifyToken) {
  // Log the absence, never the value. Without these the function still starts and
  // still logs inbound events, but every one will be marked unverified.
  logError("config.missing", {
    app_secret_set: Boolean(appSecret),
    verify_token_set: Boolean(verifyToken),
  });
}

const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});
const db = new SupabaseDb(client);

/**
 * Kick off summarisation once a transcript is stored.
 *
 * Deliberately fire-and-forget over HTTP rather than in-process: summarising
 * calls a third-party API that can be slow or down, and Meta's webhook timeout
 * is a few seconds. A summary that fails must never cost us the transcript.
 * The service role key authenticates the call; summarize-transcript applies the
 * same authorisation logic to it as to a user.
 */
function triggerSummary(transcriptId: string): void {
  const url = `${supabaseUrl}/functions/v1/summarize-transcript`;
  const work = fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ transcript_id: transcriptId }),
  })
    .then((res) => logInfo("summary.triggered", { transcript_id: transcriptId, status: res.status }))
    .catch((err) =>
      logError("summary.trigger_failed", {
        transcript_id: transcriptId,
        error: err instanceof Error ? err.message : String(err),
      })
    );

  const runtime = (globalThis as { EdgeRuntime?: { waitUntil(p: Promise<unknown>): void } }).EdgeRuntime;
  if (runtime?.waitUntil) runtime.waitUntil(work);
}

Deno.serve(async (req: Request) => {
  const { response, processing } = await handleRequest(
    req,
    { appSecret, verifyToken },
    { db, resolveAccessToken, onTranscriptStored: triggerSummary },
  );

  // Keep the worker alive for the background work without holding the response
  // open. Meta gets its 200 in milliseconds; the download and writes continue.
  const runtime = (globalThis as { EdgeRuntime?: { waitUntil(p: Promise<unknown>): void } })
    .EdgeRuntime;
  if (runtime?.waitUntil) {
    runtime.waitUntil(processing);
  } else {
    processing.catch(() => {});
  }

  return response;
});
