import { verifyMetaSignature } from "./crypto.ts";
import { timingSafeEqual } from "./crypto.ts";
import { processWebhookBody } from "./process.ts";
import type { ProcessDeps, ProcessOutcome } from "./process.ts";
import { logError, logInfo, logWarn } from "./log.ts";
import type { MetaWebhookBody } from "./types.ts";

export interface HandlerConfig {
  appSecret: string;
  verifyToken: string;
}

export interface HandlerResult {
  response: Response;
  /**
   * Work still running after the response was produced.
   *
   * The HTTP layer hands this to the runtime's waitUntil so the response is not
   * held open. Tests await it to get a deterministic result without sleeping.
   */
  processing: Promise<ProcessOutcome | null>;
}

const NO_WORK = Promise.resolve(null);

/**
 * GET — Meta's subscription verification challenge.
 *
 * Meta calls this once when the webhook URL is saved. Echo hub.challenge back as
 * plain text, but only when hub.verify_token matches the value configured in the
 * Meta app. Compared in constant time: it is a shared secret like any other.
 */
export function handleVerification(url: URL, config: HandlerConfig): Response {
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode !== "subscribe" || !token || !challenge) {
    logWarn("webhook.verification_malformed", { mode });
    return new Response("Bad Request", { status: 400 });
  }
  if (!config.verifyToken || !timingSafeEqual(token, config.verifyToken)) {
    logWarn("webhook.verification_token_mismatch", {});
    return new Response("Forbidden", { status: 403 });
  }

  logInfo("webhook.verification_ok", {});
  return new Response(challenge, {
    status: 200,
    headers: { "content-type": "text/plain" },
  });
}

/**
 * Handle one inbound request.
 *
 * The POST path returns 200 immediately and continues in the background. Meta's
 * webhook timeout is a few seconds; a handler that waits for a media download to
 * finish will be timed out and the event redelivered, which turns one call into a
 * pile of duplicates. Acknowledging first and working after is what keeps the
 * retry machinery quiet.
 *
 * Note the 200 is returned even for an INVALID signature. That is deliberate: a
 * non-2xx makes Meta retry, and there is no point retrying a request we will
 * never accept. The event is logged with signature_verified false and never acted
 * on, which is the useful outcome — we can see it without obeying it.
 */
export async function handleRequest(
  req: Request,
  config: HandlerConfig,
  deps: ProcessDeps,
): Promise<HandlerResult> {
  const url = new URL(req.url);

  if (req.method === "GET") {
    return { response: handleVerification(url, config), processing: NO_WORK };
  }

  if (req.method !== "POST") {
    return {
      response: new Response("Method Not Allowed", { status: 405 }),
      processing: NO_WORK,
    };
  }

  // Read the body ONCE, as text. The signature is computed over these exact
  // bytes; re-serialising parsed JSON would change them and never match.
  const raw = await req.text();
  const signatureVerified = await verifyMetaSignature(
    req.headers.get("x-hub-signature-256"),
    raw,
    config.appSecret,
  );

  let body: MetaWebhookBody;
  try {
    body = JSON.parse(raw) as MetaWebhookBody;
  } catch {
    logWarn("webhook.unparseable_body", { bytes: raw.length });
    // Still a 200: a malformed body will not become well-formed on retry.
    return { response: new Response("EVENT_RECEIVED", { status: 200 }), processing: NO_WORK };
  }

  const processing = processWebhookBody(body, signatureVerified, deps)
    .then((outcome) => {
      logInfo("webhook.batch_complete", { ...outcome, signature_verified: signatureVerified });
      return outcome;
    })
    .catch((err) => {
      logError("webhook.batch_failed", {
        error: err instanceof Error ? err.message : String(err),
      });
      return null;
    });

  return {
    response: new Response("EVENT_RECEIVED", { status: 200 }),
    processing,
  };
}
