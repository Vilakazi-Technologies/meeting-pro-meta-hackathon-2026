// Meeting Pro — Paystack's hosted page to update the card or cancel.
//
// Deploy with --no-verify-jwt (Clerk session token; my_plan() authorises).
// Secrets: PAYSTACK_SECRET_KEY.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { CORS, json, paystack } from "../_shared/paystack.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "Method Not Allowed" }, 405);
  const authorization = req.headers.get("Authorization");
  if (!authorization) return json({ error: "Sign in required" }, 401);

  const asCaller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: plan } = await asCaller.rpc("my_plan").maybeSingle<{ business_id: string }>();
  if (!plan?.business_id) return json({ error: "No business found" }, 404);

  const { data: sub } = await admin.from("business_subscriptions")
    .select("paystack_subscription_code").eq("business_id", plan.business_id).maybeSingle();
  if (!sub?.paystack_subscription_code) return json({ error: "No active subscription" }, 404);

  try {
    const { link } = await paystack<{ link: string }>(
      `/subscription/${encodeURIComponent(sub.paystack_subscription_code)}/manage/link`,
    );
    return json({ url: link });
  } catch (err) {
    console.error(JSON.stringify({
      evt: "billing.manage_failed",
      error: err instanceof Error ? err.message : String(err),
    }));
    return json({ error: "Could not open subscription settings" }, 502);
  }
});
