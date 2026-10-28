import { sha256Hex } from "./crypto.ts";
import type { MetaCallObject } from "./types.ts";

/**
 * Stable JSON serialisation: object keys sorted recursively.
 *
 * Meta does not guarantee key order in the JSON it sends. Without this, the same
 * event redelivered with keys in a different order would fingerprint differently
 * and slip past deduplication. Array order is meaningful and is preserved.
 */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalJson(obj[k])).join(",") + "}";
}

/**
 * Idempotency key for one call object: id, event, timestamp, and a fingerprint
 * of the whole call object.
 *
 * The first three identify the event. The digest is what makes a retry provably
 * identical rather than merely similar: Meta's calls webhook carries no event id
 * of its own, so this composite is the identity.
 *
 * SHA-256 via crypto.subtle, which is native on both Deno and Node, so the
 * fingerprint is computed by the same platform code in production and in tests.
 * The choice of algorithm is arbitrary here — this is a deduplication
 * fingerprint, not a security primitive. Payload authenticity is established
 * separately by the HMAC signature check.
 *
 * Trade-off, stated plainly: because the fingerprint covers the entire call
 * object, a redelivery that differed in any field — even a cosmetic one — would
 * produce a different key and be treated as a new event rather than a duplicate.
 * That is the safe direction to fail (a spurious extra log row, never a silently
 * dropped event), and downstream processing is separately idempotent on
 * (meta_call_id, event) to absorb it.
 */
export async function buildDedupeKey(call: MetaCallObject): Promise<string> {
  const fingerprint = await sha256Hex(canonicalJson(call));
  return `${call.id}:${call.event}:${call.timestamp}:${fingerprint}`;
}
