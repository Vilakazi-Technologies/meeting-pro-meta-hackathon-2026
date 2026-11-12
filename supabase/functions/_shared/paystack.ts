/**
 * Paystack API helpers. Amounts are in ZAR cents (R50 = 5000).
 *
 * Secret: PAYSTACK_SECRET_KEY (sk_live_… or sk_test_…). Optional
 * PAYSTACK_PLAN_CODE pins an existing plan; otherwise the monthly plan is found
 * by name or created on first checkout, so there is no dashboard step.
 */
const API = "https://api.paystack.co";

export const PLAN_NAME = "Meeting Pro Monthly";
export const PLAN_AMOUNT_CENTS = 5000;

function secretKey(): string {
  const key = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

export async function paystack<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: init.method ?? "GET",
    headers: { Authorization: `Bearer ${secretKey()}`, "Content-Type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.status === false) {
    throw new Error(`Paystack ${path}: ${json?.message ?? `HTTP ${res.status}`}`);
  }
  return json.data as T;
}

interface PaystackPlan {
  plan_code: string;
  name: string;
  amount: number;
  interval: string;
  currency: string;
}

let cachedPlanCode: string | null = null;

export async function ensurePlanCode(): Promise<string> {
  const pinned = Deno.env.get("PAYSTACK_PLAN_CODE");
  if (pinned) return pinned;
  if (cachedPlanCode) return cachedPlanCode;

  const plans = await paystack<PaystackPlan[]>("/plan?perPage=100");
  const existing = plans.find((p) =>
    p.name === PLAN_NAME && p.amount === PLAN_AMOUNT_CENTS && p.interval === "monthly" &&
    p.currency === "ZAR"
  );
  if (existing) {
    cachedPlanCode = existing.plan_code;
    return existing.plan_code;
  }
  const created = await paystack<PaystackPlan>("/plan", {
    method: "POST",
    body: { name: PLAN_NAME, amount: PLAN_AMOUNT_CENTS, interval: "monthly", currency: "ZAR" },
  });
  cachedPlanCode = created.plan_code;
  return created.plan_code;
}

/** Paystack signs the raw body with HMAC-SHA512 using the secret key (hex). */
export async function verifyPaystackSignature(rawBody: string, signature: string | null): Promise<boolean> {
  if (!signature) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secretKey()),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody)));
  const expected = Array.from(mac, (b) => b.toString(16).padStart(2, "0")).join("");
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
