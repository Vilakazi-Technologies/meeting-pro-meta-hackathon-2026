import { readFileSync } from "node:fs";
import { join } from "node:path";
import { hmacSha256Hex } from "../src/crypto.ts";
import { MetaClient } from "../src/meta.ts";
import { FakeDb } from "./fake-db.ts";
import type { ProcessDeps } from "../src/process.ts";

export const APP_SECRET = "test-app-secret-not-a-real-one";
export const VERIFY_TOKEN = "test-verify-token";
export const ACCESS_TOKEN = "EAAtest0000TOKEN0000must0000never0000appear0000in0000logs";

export const PHONE_NUMBER_ID = "106540352242922";
export const BUSINESS_ID = "biz-lumiq-0001";
export const NUMBER_ID = "num-lumiq-0001";

const FIXTURES = process.env.FIXTURES_DIR ??
  join(process.cwd(), "supabase/functions/whatsapp-webhook/fixtures");

export function fixtureText(name: string): string {
  return readFileSync(join(FIXTURES, name), "utf8");
}

export function fixtureJson<T = unknown>(name: string): T {
  return JSON.parse(fixtureText(name)) as T;
}

export function fixtureBytes(name: string): Uint8Array {
  return new Uint8Array(readFileSync(join(FIXTURES, name)));
}

/** Build a signed POST exactly as Meta would send it. */
export async function signedRequest(rawBody: string, secret = APP_SECRET): Promise<Request> {
  const sig = await hmacSha256Hex(secret, rawBody);
  return new Request("https://example.test/whatsapp-webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-hub-signature-256": `sha256=${sig}`,
    },
    body: rawBody,
  });
}

export function unsignedRequest(rawBody: string, header?: string): Request {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (header) headers["x-hub-signature-256"] = header;
  return new Request("https://example.test/whatsapp-webhook", {
    method: "POST",
    headers,
    body: rawBody,
  });
}

export interface FakeFetchOptions {
  /** Simulate the 5-minute window having closed on the webhook URL. */
  directUrlExpired?: boolean;
  /** Serve bytes that do not match the advertised sha256. */
  corruptBody?: boolean;
  /** Make the Media API lookup itself fail. */
  mediaApiFails?: boolean;
}

export interface FakeFetchRecorder {
  fetchImpl: typeof fetch;
  calls: { url: string; authorization: string | null }[];
}

/**
 * A fetch stand-in covering the paths the real Media API exercises.
 * No network is opened by any test.
 */
export function makeFakeFetch(opts: FakeFetchOptions = {}): FakeFetchRecorder {
  const calls: { url: string; authorization: string | null }[] = [];
  const docBytes = fixtureBytes("transcript-document.json");
  const body = opts.corruptBody
    ? new TextEncoder().encode('{"transcript":{"text":"tampered"}}')
    : docBytes;

  const fetchImpl = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const authorization =
      (init?.headers as Record<string, string> | undefined)?.Authorization ?? null;
    calls.push({ url, authorization });

    // Media API: mint a fresh download URL from the media id.
    if (url.includes("graph.facebook.com")) {
      if (opts.mediaApiFails) {
        return Promise.resolve(new Response("nope", { status: 400 }));
      }
      return Promise.resolve(
        new Response(JSON.stringify({ url: "https://lookaside.fbsbx.com/fresh/abc", id: "1002764438271669" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    }

    // The URL delivered in the webhook — may have expired.
    if (url.includes("?mid=")) {
      if (opts.directUrlExpired) {
        return Promise.resolve(new Response("URL signature expired", { status: 403 }));
      }
      return Promise.resolve(new Response(body as BodyInit, { status: 200 }));
    }

    // A freshly minted URL always works.
    if (url.includes("/fresh/")) {
      return Promise.resolve(new Response(body as BodyInit, { status: 200 }));
    }

    return Promise.resolve(new Response("unexpected url", { status: 404 }));
  }) as unknown as typeof fetch;

  return { fetchImpl, calls };
}

export function makeDeps(
  db: FakeDb,
  fetchOpts: FakeFetchOptions = {},
): ProcessDeps & { fetchRecorder: FakeFetchRecorder } {
  const recorder = makeFakeFetch(fetchOpts);
  return {
    db,
    resolveAccessToken: () => Promise.resolve(ACCESS_TOKEN),
    makeMetaClient: (token: string) => new MetaClient(token, { fetchImpl: recorder.fetchImpl }),
    fetchRecorder: recorder,
  };
}

export function freshDb(): FakeDb {
  return new FakeDb({
    [PHONE_NUMBER_ID]: { whatsapp_number_id: NUMBER_ID, business_id: BUSINESS_ID },
  });
}
