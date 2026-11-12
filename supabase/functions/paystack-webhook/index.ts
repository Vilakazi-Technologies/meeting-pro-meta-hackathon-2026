// Meeting Pro — Paystack webhook: the only writer of paid status.
//
// Set in Paystack → Settings → API Keys & Webhooks:
//   https://<project>.supabase.co/functions/v1/paystack-webhook
// Deploy with --no-verify-jwt; Paystack authenticates with x-paystack-signature.
// Secrets: PAYSTACK_SECRET_KEY.
//
// Every handler is an idempotent upsert, so Paystack's retries are harmless.
// The business is found from checkout metadata on the first charge and from
// the Paystack customer code (stored at checkout) on everything after.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { verifyPaystackSignature } from "../_shared/paystack.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

interface PaystackEvent {
  event: string;
  data: {
    paid_at?: string;
    metadata?: unknown;
    customer?: { customer_code?: string; email?: string };
    plan?: { plan_code?: string } | null;
    subscription_code?: string;
    email_token?: string;
    next_payment_date?: string | null;
    subscription?: { subscription_code?: string };
  };
}

function log(evt: string, fields: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ evt, ...fields }));
}

function metadataBusinessId(metadata: unknown): string | null {
  let m = metadata;
  if (typeof m === "string") {
    try {
      m = JSON.parse(m);
    } catch {
      return null;
    }
  }
  const id = (m as { business_id?: unknown } | null)?.business_id;
  return typeof id === "string" ? id : null;
}

async function businessForCustomer(customerCode: string | undefined): Promise<string | null> {
  if (!customerCode) return null;
  const { data } = await admin.from("business_subscriptions").select("business_id")
    .eq("paystack_customer_code", customerCode).maybeSingle();
  return data?.business_id ?? null;
}

function addOneMonth(iso: string): string {
  const d = new Date(iso);
  d.setUTCMonth(d.getUTCMonth() + 1);
  // A day of grace so a renewal that lands a few hours late does not cut access.
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}

async function update(businessId: string, patch: Record<string, unknown>) {
  const { error } = await admin.from("business_subscriptions")
    .upsert({ business_id: businessId, ...patch }, { onConflict: "business_id" });
  if (error) throw new Error(`subscription update: ${error.message}`);
}

async function handle(e: PaystackEvent): Promise<void> {
  const customerCode = e.data.customer?.customer_code;
  const businessId = metadataBusinessId(e.data.metadata) ?? await businessForCustomer(customerCode);
  if (!businessId) {
    log("paystack.unroutable", { event: e.event });
    return;
  }

  switch (e.event) {
    case "charge.success": {
      // One-off charges unrelated to the plan are ignored.
      if (!e.data.plan?.plan_code && !metadataBusinessId(e.data.metadata)) return;
      const paidAt = e.data.paid_at ?? new Date().toISOString();
      await update(businessId, {
        status: "active",
        paystack_customer_code: customerCode ?? null,
        ...(e.data.plan?.plan_code ? { plan_code: e.data.plan.plan_code } : {}),
        current_period_start: paidAt,
        current_period_end: addOneMonth(paidAt),
      });
      break;
    }
    case "subscription.create":
      await update(businessId, {
        status: "active",
        paystack_subscription_code: e.data.subscription_code ?? null,
        paystack_email_token: e.data.email_token ?? null,
        ...(e.data.next_payment_date ? { current_period_end: e.data.next_payment_date } : {}),
      });
      break;
    case "subscription.not_renew":
      await update(businessId, { status: "non_renewing" });
      break;
    case "invoice.payment_failed":
      await update(businessId, { status: "attention" });
      break;
    case "subscription.disable":
      await update(businessId, { status: "cancelled" });
      break;
    default:
      log("paystack.event_not_handled", { event: e.event });
      return;
  }
  log("paystack.applied", { event: e.event, business_id: businessId });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const raw = await req.text();
  if (!(await verifyPaystackSignature(raw, req.headers.get("x-paystack-signature")))) {
    log("paystack.bad_signature");
    return new Response("Forbidden", { status: 403 });
  }

  let event: PaystackEvent;
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  try {
    await handle(event);
  } catch (err) {
    // 500 makes Paystack retry, which is what we want for a database hiccup.
    log("paystack.failed", { event: event.event, error: err instanceof Error ? err.message : String(err) });
    return new Response("Error", { status: 500 });
  }
  return new Response("OK", { status: 200 });
});
