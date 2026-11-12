// Meeting Pro — answer, decline and hang up WhatsApp calls from the browser.
//
// The browser holds the WebRTC peer connection; this function only relays
// signalling to Meta, because the Meta access token must never reach a client.
//
//   accept      claim the ringing call for this user and send the SDP answer,
//               with Meta transcription switched on
//   reject      decline a ringing call
//   terminate   hang up a connected call
//
// No pre_accept: Meta starts the caller's timer on the first media packet, and
// a browser cannot hold packets back reliably. Meta's FAQ says to accept
// directly in that case.
//
// Deploy with --no-verify-jwt: callers send a Clerk session token, which the
// gateway's own JWT check may not accept. Authorisation happens in Postgres
// instead: call_control_target() runs as the caller and checks membership.
//
// Secrets: META_ACCESS_TOKEN. SUPABASE_URL, SUPABASE_ANON_KEY and
// SUPABASE_SERVICE_ROLE_KEY are injected by the platform.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { resolveAccessToken } from "../_shared/meta-token.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const graphVersion = Deno.env.get("META_GRAPH_VERSION") ?? "v23.0";

// Spoken to both people before transcription starts (Meta plays it). Max 250 chars.
const TRANSCRIPTION_PURPOSE = Deno.env.get("CALL_TRANSCRIPTION_PURPOSE") ??
  "creating meeting minutes for this business";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACTIONS = ["accept", "reject", "terminate"] as const;
type Action = typeof ACTIONS[number];

const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

interface Target {
  meta_call_id: string;
  phone_number_id: string;
  business_id: string;
  ring_state: string | null;
}

async function sendToMeta(
  target: Target,
  action: Action,
  sdp: string | null,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const token = await resolveAccessToken(target.business_id, null);
  const body: Record<string, unknown> = {
    messaging_product: "whatsapp",
    call_id: target.meta_call_id,
    action,
  };
  if (sdp) body.session = { sdp_type: "answer", sdp };
  if (action === "accept") {
    body.transcription = {
      status: "ENABLED",
      purpose: TRANSCRIPTION_PURPOSE,
      announcement_language: "en_US",
    };
  }

  const res = await fetch(
    `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(target.phone_number_id)}/calls`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (res.ok) return { ok: true };
  let message = `Meta returned HTTP ${res.status}`;
  try {
    const err = await res.json();
    if (err?.error?.message) message = `Meta: ${err.error.message}`;
  } catch {
    /* keep the status-only message */
  }
  return { ok: false, message };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "Method Not Allowed" }, 405);

  const authorization = req.headers.get("Authorization");
  if (!authorization) return json({ error: "Sign in required" }, 401);

  let body: { call_id?: unknown; action?: unknown; sdp?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Body must be JSON" }, 400);
  }
  const callId = body.call_id;
  const action = body.action as Action;
  const sdp = typeof body.sdp === "string" && body.sdp.length > 0 ? body.sdp : null;
  if (typeof callId !== "string" || !UUID.test(callId)) {
    return json({ error: "call_id must be a UUID" }, 400);
  }
  if (!ACTIONS.includes(action)) return json({ error: "Unknown action" }, 400);
  if (action === "accept" && !sdp) {
    return json({ error: "An SDP answer is required to answer a call" }, 400);
  }

  const asCaller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data, error } = await asCaller
    .rpc("call_control_target", { p_call_id: callId, p_claim: action === "accept" })
    .maybeSingle<Target>();
  if (error) {
    const status = error.code === "P0001" ? 409 : error.code === "P0002" ? 404 : 403;
    return json({ error: error.message }, status);
  }
  if (!data?.phone_number_id) return json({ error: "This call has no linked WhatsApp number" }, 404);

  let result: Awaited<ReturnType<typeof sendToMeta>>;
  try {
    result = await sendToMeta(data, action, sdp);
  } catch (err) {
    result = { ok: false, message: err instanceof Error ? err.message : String(err) };
  }

  if (!result.ok) {
    // A failed accept must not leave the call stuck as "answering": another
    // member (or a retry) should still be able to pick it up.
    if (action === "accept") {
      await admin.from("calls").update({ ring_state: "ringing", answered_by: null })
        .eq("id", callId).eq("ring_state", "answering");
    }
    console.error(JSON.stringify({ evt: "call_control.meta_failed", action, message: result.message }));
    return json({ error: result.message }, 502);
  }

  const now = new Date().toISOString();
  if (action === "accept") {
    await admin.from("calls")
      .update({ ring_state: "connected", answered_at: now, transcription_enabled: true })
      .eq("id", callId);
  } else if (action === "reject" || action === "terminate") {
    await admin.from("calls").update({ ring_state: "ended" }).eq("id", callId);
  }

  return json({ ok: true, action });
});
