// Meeting Pro — retry a failed transcript download.
//
// Called by the app when a customer taps Retry on a failed transcript. Unlike
// the webhook, this runs for a SIGNED-IN USER: deploy it with JWT verification
// on (the default), so Supabase rejects requests with no valid session before
// this code runs.
//
//   supabase functions deploy retry-transcript
//
// Authorisation happens in two steps, deliberately in this order:
//   1. With the caller's own token, ask the database whether they can see the
//      transcript. RLS answers that question: members of the owning business
//      only.
//   2. Only then read the details with the service role and fetch from Meta.
//
// Needs the same META_ACCESS_TOKEN secret as the webhook. SUPABASE_URL,
// SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are injected by the platform.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { retryTranscript } from "../whatsapp-webhook/src/retry.ts";
import { SupabaseDb } from "../whatsapp-webhook/src/supabase-db.ts";
import { logError } from "../whatsapp-webhook/src/log.ts";
import { resolveAccessToken } from "../_shared/meta-token.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// The app on the web calls this from another origin, so the browser sends a
// preflight first. The endpoint is authorised by bearer token, not cookies, so
// a wildcard origin does not widen access.
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

const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "Method Not Allowed" }, 405);

  const authorization = req.headers.get("Authorization");
  if (!authorization) return json({ error: "Sign in required" }, 401);

  let transcriptId: unknown;
  try {
    transcriptId = (await req.json())?.transcript_id;
  } catch {
    return json({ error: "Body must be JSON" }, 400);
  }
  if (typeof transcriptId !== "string" || !UUID.test(transcriptId)) {
    return json({ error: "transcript_id must be a UUID" }, 400);
  }

  // A client acting as the caller: every query it makes is filtered by RLS.
  const asCaller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const canAccess = async (id: string) => {
    const { data, error } = await asCaller.from("transcripts").select("id").eq("id", id).maybeSingle();
    return !error && Boolean(data);
  };

  try {
    const result = await retryTranscript(transcriptId, canAccess, {
      db: new SupabaseDb(admin),
      resolveAccessToken,
    });
    return json(result, result.outcome === "not_found" ? 404 : 200);
  } catch (err) {
    logError("retry.crashed", { error: err instanceof Error ? err.message : String(err) });
    return json({ outcome: "failed", message: "Something went wrong. Try again later." }, 500);
  }
});
