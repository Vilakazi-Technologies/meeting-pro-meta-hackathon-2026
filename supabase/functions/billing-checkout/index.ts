// Meeting Pro — start a R50/month Paystack subscription for the caller's business.
//
// Returns a Paystack checkout URL. Paying there creates the subscription; the
// paystack-webhook function is what actually marks the business as paid, so a
// user closing the tab after paying still gets their plan.
//
// Deploy with --no-verify-jwt (Clerk session token; my_plan() authorises).
// Secrets: PAYSTACK_SECRET_KEY. Optional APP_URL (allowed return origin).
import { createClient } from "jsr:@supabase/supabase-js@2";
import { CORS, ensurePlanCode, json, paystack, PLAN_AMOUNT_CENTS } from "../_shared/paystack.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const appUrl = Deno.env.get("APP_URL") ?? "https://meeting-pro-rho.vercel.app";

const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Only send people back to our own app after paying. */
function safeCallback(raw: unknown): string {
  if (typeof raw !== "string") return `${appUrl}/`;
  try {
    const url = new URL(raw);
    const allowed = url.origin === new URL(appUrl).origin ||
      url.hostname === "localhost" || url.hostname === "127.0.0.1";
    return allowed ? url.toString() : `${appUrl}/`;
  } catch {
    return `${appUrl}/`;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "Method Not Allowed" }, 405);
  const authorization = req.headers.get("Authorization");
  if (!authorization) return json({ error: "Sign in required" }, 401);

  let body: { email?: unknown; callback_url?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Body must be JSON" }, 400);
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL.test(email)) return json({ error: "A valid billing email is required" }, 400);

  const asCaller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: plan, error: planError } = await asCaller.rpc("my_plan").maybeSingle<{
    business_id: string;
    plan: string;
    status: string;
  }>();
  if (planError) return json({ error: "Could not read your plan" }, 403);
  if (!plan?.business_id) return json({ error: "Connect your WhatsApp number before subscribing" }, 404);
  if (plan.plan === "paid" && plan.status === "active") {
    return json({ error: "Your business is already subscribed" }, 409);
  }

  try {
    const planCode = await ensurePlanCode();
    const customer = await paystack<{ customer_code: string }>("/customer", {
      method: "POST",
      body: { email, metadata: { business_id: plan.business_id } },
    });

    const { error: upsertError } = await admin.from("business_subscriptions").upsert(
      {
        business_id: plan.business_id,
        billing_email: email,
        paystack_customer_code: customer.customer_code,
        plan_code: planCode,
        ...(plan.status === "none" ? { status: "pending" } : {}),
      },
      { onConflict: "business_id" },
    );
    if (upsertError) throw new Error(`subscription row: ${upsertError.message}`);

    const checkout = await paystack<{ authorization_url: string; reference: string }>(
      "/transaction/initialize",
      {
        method: "POST",
        body: {
          email,
          amount: PLAN_AMOUNT_CENTS,
          currency: "ZAR",
          plan: planCode,
          callback_url: safeCallback(body.callback_url),
          metadata: { business_id: plan.business_id },
        },
      },
    );
    return json({ url: checkout.authorization_url, reference: checkout.reference });
  } catch (err) {
    console.error(JSON.stringify({
      evt: "billing.checkout_failed",
      error: err instanceof Error ? err.message : String(err),
    }));
    return json({ error: "Could not start checkout. Please try again." }, 502);
  }
});
