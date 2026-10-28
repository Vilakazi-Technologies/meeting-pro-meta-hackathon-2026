// Meeting Pro — summarise a transcript with Muse Spark (Meta Model API).
//
// Meta returns transcripts, never summaries. This sends the text to
// muse-spark-1.3 when MODEL_API_KEY is set, otherwise Claude Haiku 4.5,
// and stores a title, a summary and any action items.
//
// Called two ways, both through this one endpoint:
//   - automatically, by the whatsapp-webhook function, right after a transcript
//     is stored (it authenticates with the service role key);
//   - manually, by a signed-in user re-running it from the app or by hand.
//
// Deploy with JWT verification on (the default):
//   supabase functions deploy summarize-transcript
//
// Secret required: MODEL_API_KEY (preferred) or ANTHROPIC_API_KEY. SUPABASE_URL,
// SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are injected by the platform.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { summarizeTranscript } from "../whatsapp-webhook/src/summary.ts";
import { SupabaseDb } from "../whatsapp-webhook/src/supabase-db.ts";
import { logError } from "../whatsapp-webhook/src/log.ts";
import {
  createSummarizeModelCaller,
  mapModelClientError,
} from "../_shared/summarize-model.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

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
const callModel = createSummarizeModelCaller();

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "Method Not Allowed" }, 405);

  const authorization = req.headers.get("Authorization");
  if (!authorization) return json({ error: "Sign in required" }, 401);

  let body: { transcript_id?: unknown; force?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Body must be JSON" }, 400);
  }
  const transcriptId = body.transcript_id;
  if (typeof transcriptId !== "string" || !UUID.test(transcriptId)) {
    return json({ error: "transcript_id must be a UUID" }, 400);
  }

  // Authorisation uses the caller's own credentials, so RLS decides. The
  // webhook calls with the service role key, which sees every transcript; a
  // user's token sees only their own business's.
  const asCaller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const canAccess = async (id: string) => {
    const { data, error } = await asCaller.from("transcripts").select("id").eq("id", id).maybeSingle();
    return !error && Boolean(data);
  };

  try {
    const result = await summarizeTranscript(
      transcriptId,
      canAccess,
      { db: new SupabaseDb(admin), callModel },
      { force: body.force === true },
    );

    if (result.outcome === "ready") {
      const hookSecret = Deno.env.get("MEETING_MINUTES_HOOK_SECRET");
      const emailUrl = `${supabaseUrl}/functions/v1/send-meeting-minutes`;
      fetch(emailUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(hookSecret ? { Authorization: `Bearer ${hookSecret}` } : {}),
        },
        body: JSON.stringify({ transcript_id: transcriptId }),
      }).catch((e) => logError("email.minutes.trigger_failed", { error: String(e) }));
    }

    return json(result, result.outcome === "not_found" ? 404 : 200);
  } catch (err) {
    // Typed-error chain, most specific first.
    const detail = mapModelClientError(err);
    logError("summary.crashed", { error: detail });
    return json({ outcome: "failed", message: "Summarisation could not be completed." }, 500);
  }
});
