import { MetaClient } from "./meta.ts";
import { logInfo, shortId } from "./log.ts";
import type { Db, SegmentInsert } from "./db.ts";
import type { MetaDocument, MetaTranscriptDocument } from "./types.ts";

/** Everything fetch-and-store needs; shared by the webhook and the retry function. */
export interface TranscriptDeps {
  db: Db;
  /** Resolves the Meta access token for a tenant. Never logged, never stored. */
  resolveAccessToken: (businessId: string, whatsappNumberId: string | null) => Promise<string>;
  makeMetaClient?: (token: string) => MetaClient;
  now?: () => Date;
  /**
   * Called after a transcript is successfully stored, to kick off
   * summarisation. Optional and deliberately fire-and-forget: a summary that
   * fails must never fail the ingest that produced the transcript.
   */
  onTranscriptStored?: (transcriptId: string) => void;
}

export interface StoreTarget {
  businessId: string;
  whatsappNumberId: string | null;
  /** calls.id — the row the transcript belongs to. */
  callRowId: string;
  /** Meta's call id, for logs only. */
  metaCallId: string;
  /** Sent to the Media API to disambiguate media across tenants. */
  phoneNumberId: string | null;
}

export function segmentsFrom(
  doc: MetaTranscriptDocument,
  businessId: string,
  transcriptId: string,
): SegmentInsert[] {
  const segments = doc.transcript?.segments ?? [];
  return segments.map((seg, index) => ({
    business_id: businessId,
    transcript_id: transcriptId,
    segment_index: index,
    meta_segment_id: seg.id === undefined || seg.id === null ? null : String(seg.id),
    speaker: seg.speaker ?? null,
    channel: typeof seg.channel === "number" ? seg.channel : null,
    start_seconds: typeof seg.start === "number" ? seg.start : null,
    end_seconds: typeof seg.end === "number" ? seg.end : null,
    text: seg.text ?? null,
    confidence: typeof seg.confidence === "number" ? seg.confidence : null,
    words: seg.words ?? null,
  }));
}

/**
 * Download a transcript from Meta, verify it, and store it.
 *
 * On success: the transcript row becomes `ready` with its full text, the raw
 * document, and normalised segments.
 *
 * On failure — download refused, link expired and the Media API also failing,
 * hash mismatch, bad JSON, missing token — a `failed` transcript row is
 * recorded and the error is rethrown so the caller logs it. Before this, a
 * failed download left no transcript row at all and the call silently vanished
 * from the app. A visible failure the customer can retry is better than a
 * transcript that quietly never appears.
 *
 * Two rules on the failure path:
 *   - A transcript that is already `ready` is never overwritten. A failed
 *     re-fetch must not destroy good data.
 *   - A failed row holds only Meta's references (media id and hash), never any
 *     content — nothing unverified is ever stored.
 */
export async function fetchAndStoreTranscript(
  doc: MetaDocument,
  target: StoreTarget,
  deps: TranscriptDeps,
): Promise<{ segments: number; usedFallback: boolean }> {
  try {
    const token = await deps.resolveAccessToken(target.businessId, target.whatsappNumberId);
    const client = deps.makeMetaClient ? deps.makeMetaClient(token) : new MetaClient(token);

    const { document, usedFallback } = await client.fetchTranscriptDocument(
      doc,
      target.phoneNumberId,
    );
    const t = document.transcript ?? {};
    const now = (deps.now ?? (() => new Date()))();

    const { id: transcriptId } = await deps.db.upsertTranscript({
      business_id: target.businessId,
      call_id: target.callRowId,
      meta_media_id: doc.id,
      media_sha256: doc.sha256 ?? null,
      language: t.language ?? null,
      confidence: typeof t.confidence === "number" ? t.confidence : null,
      duration_seconds: typeof t.duration === "number"
        ? t.duration
        : (typeof document.metadata?.audio?.duration === "number"
          ? document.metadata.audio.duration
          : null),
      full_text: t.text ?? null,
      raw: document, // the complete document, kept verbatim
      fetched_at: now.toISOString(),
      status: "ready",
    });

    // Replace rather than append, so reprocessing never duplicates segments.
    const segments = segmentsFrom(document, target.businessId, transcriptId);
    await deps.db.replaceSegments(transcriptId, segments);

    // Counts and ids only: no transcript text, no token.
    logInfo("transcript.stored", {
      call_id: shortId(target.metaCallId),
      media_id: doc.id,
      segments: segments.length,
      language: t.language ?? null,
      used_media_api_fallback: usedFallback,
    });
    try {
      deps.onTranscriptStored?.(transcriptId);
    } catch {
      // Summarisation is a follow-on step, never a reason to fail the ingest.
    }

    return { segments: segments.length, usedFallback };
  } catch (err) {
    const current = await deps.db.findTranscriptByCallId(target.callRowId);
    if (!current || current.status !== "ready") {
      await deps.db.upsertTranscript({
        business_id: target.businessId,
        call_id: target.callRowId,
        meta_media_id: doc.id,
        media_sha256: doc.sha256 ?? null,
        language: null,
        confidence: null,
        duration_seconds: null,
        full_text: null,
        raw: null,
        fetched_at: null,
        status: "failed",
      });
      logInfo("transcript.marked_failed", { call_id: shortId(target.metaCallId), media_id: doc.id });
    }
    throw err;
  }
}
