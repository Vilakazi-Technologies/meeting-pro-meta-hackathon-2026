// Signature verification and hashing. Everything here uses Web Crypto, which
// behaves identically on Deno (production) and Node 20 (tests).

/**
 * Constant-time comparison of two ASCII strings.
 *
 * A naive `===` on a signature leaks how many leading characters matched, via
 * how long the comparison took. Over many attempts that is enough to recover a
 * valid signature byte by byte. This always inspects every byte of `a`.
 *
 * Length is folded into the result rather than short-circuited on, so a
 * wrong-length input costs the same as a wrong-value one.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  let diff = aBytes.length ^ bBytes.length;
  const max = Math.max(aBytes.length, bBytes.length);
  for (let i = 0; i < max; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return diff === 0;
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  // btoa exists on both Deno and Node 20.
  return btoa(binary);
}

/** HMAC-SHA256 of `raw` under `secret`, hex encoded — the form Meta sends. */
export async function hmacSha256Hex(secret: string, raw: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
  return toHex(sig);
}

/** SHA-256 of a string, hex encoded. Used as a content fingerprint, not a secret. */
export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return toHex(digest);
}

/** SHA-256 of raw bytes, base64 encoded — the form Meta uses for document.sha256. */
export async function sha256Base64(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return toBase64(digest);
}

/**
 * Verify Meta's X-Hub-Signature-256 header against the raw request body.
 *
 * CRITICAL: `raw` must be the exact bytes Meta sent. Parsing to JSON and
 * re-serialising changes whitespace and key order and the signature will never
 * match. The caller reads the body as text once and passes that same string here
 * and to the parser.
 *
 * Header format is "sha256=<hex>".
 */
export async function verifyMetaSignature(
  header: string | null,
  raw: string,
  appSecret: string,
): Promise<boolean> {
  if (!header || !appSecret) return false;
  const prefix = "sha256=";
  if (!header.startsWith(prefix)) return false;
  const provided = header.slice(prefix.length).trim().toLowerCase();
  const expected = await hmacSha256Hex(appSecret, raw);
  return timingSafeEqual(provided, expected);
}
