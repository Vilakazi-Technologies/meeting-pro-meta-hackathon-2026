import { sha256Base64 } from "./crypto.ts";
import type { MetaDocument, MetaTranscriptDocument } from "./types.ts";

export interface MetaClientOptions {
  graphVersion?: string;
  fetchImpl?: typeof fetch;
  now?: () => number;
}

export class MetaFetchError extends Error {
  constructor(message: string, public readonly stage: string) {
    super(message);
    this.name = "MetaFetchError";
  }
}

/**
 * Fetches transcript documents from Meta.
 *
 * Two-stage by necessity. The URL delivered in the webhook expires five minutes
 * after the event fires, and a retry or a slow queue can easily land outside that
 * window. When the direct URL fails we mint a fresh one from the Media API using
 * document.id, which does not expire.
 *
 * `fetch` is injected so the test suite can exercise every branch — fresh URL,
 * expired URL, hash mismatch — without a network.
 */
export class MetaClient {
  private readonly graphVersion: string;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly accessToken: string, opts: MetaClientOptions = {}) {
    this.graphVersion = opts.graphVersion ?? "v23.0";
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  private authHeaders(): Record<string, string> {
    return { Authorization: `Bearer ${this.accessToken}` };
  }

  /**
   * Ask the Media API for a fresh, unexpired download URL for a media id.
   *
   * phone_number_id is optional per Meta's reference but is sent whenever we know
   * it: it disambiguates the media when one app serves several business numbers,
   * which is exactly the multi-tenant case this product is built for.
   */
  private async resolveFreshUrl(mediaId: string, phoneNumberId?: string | null): Promise<string> {
    const query = phoneNumberId ? `?phone_number_id=${encodeURIComponent(phoneNumberId)}` : "";
    const endpoint =
      `https://graph.facebook.com/${this.graphVersion}/${encodeURIComponent(mediaId)}${query}`;
    const res = await this.fetchImpl(endpoint, { headers: this.authHeaders() });
    if (!res.ok) {
      throw new MetaFetchError(
        `Media API lookup failed with HTTP ${res.status}`,
        "media_api_lookup",
      );
    }
    const body = (await res.json()) as { url?: string };
    if (!body.url) {
      throw new MetaFetchError("Media API response contained no url", "media_api_lookup");
    }
    return body.url;
  }

  private async download(url: string): Promise<Uint8Array | null> {
    // The lookaside URL still requires the access token.
    const res = await this.fetchImpl(url, { headers: this.authHeaders() });
    if (!res.ok) return null; // expired or revoked — caller falls back
    return new Uint8Array(await res.arrayBuffer());
  }

  /**
   * Download and verify a transcript document.
   *
   * Order matters: the sha256 is checked against the bytes BEFORE they are parsed
   * or written anywhere. A document that fails the hash check is discarded, not
   * stored — the whole point of the hash is that we never persist something Meta
   * did not send.
   */
  async fetchTranscriptDocument(doc: MetaDocument, phoneNumberId?: string | null): Promise<{
    document: MetaTranscriptDocument;
    usedFallback: boolean;
  }> {
    let bytes: Uint8Array | null = null;
    let usedFallback = false;

    if (doc.url) {
      bytes = await this.download(doc.url);
    }

    if (!bytes) {
      // Either no URL was supplied or the 5-minute window had closed.
      usedFallback = true;
      const fresh = await this.resolveFreshUrl(doc.id, phoneNumberId);
      bytes = await this.download(fresh);
      if (!bytes) {
        throw new MetaFetchError(
          "Download failed even with a freshly minted Media API URL",
          "download",
        );
      }
    }

    if (doc.sha256) {
      const actual = await sha256Base64(bytes);
      if (actual !== doc.sha256) {
        // Do not log either hash value at full length; log lengths and a short
        // prefix only, enough to diagnose without echoing document content.
        throw new MetaFetchError(
          `Transcript hash mismatch: expected ${doc.sha256.slice(0, 8)}…, got ${actual.slice(0, 8)}…`,
          "verify_sha256",
        );
      }
    }

    let parsed: MetaTranscriptDocument;
    try {
      parsed = JSON.parse(new TextDecoder().decode(bytes)) as MetaTranscriptDocument;
    } catch {
      throw new MetaFetchError("Transcript document was not valid JSON", "parse");
    }
    return { document: parsed, usedFallback };
  }
}
