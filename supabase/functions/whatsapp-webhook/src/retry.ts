import { fetchAndStoreTranscript } from "./transcript.ts";
import type { TranscriptDeps } from "./transcript.ts";
import { logInfo, logWarn, redact, shortId } from "./log.ts";

/** Meta deletes transcripts this long after the call. */
const META_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export type RetryOutcome =
  | "ready" //          fetched and stored now
  | "already_ready" //  nothing to do
  | "failed" //         tried, and Meta's copy could not be fetched or verified
  | "not_retryable" //  trying again cannot help
  | "not_found"; //     no such transcript, or not this caller's to see

export interface RetryResult {
  outcome: RetryOutcome;
  /** Plain-language explanation, safe to show the customer. */
  message: string;
}

/**
 * Retry a failed transcript download, on behalf of a signed-in user.
 *
 * `canAccess` is checked FIRST and runs with the caller's own credentials, so
 * the database's RLS decides whether they may see this transcript at all. Only
 * after that does anything read with the service role. A transcript the caller
 * cannot see is reported as not_found, never as forbidden, so the endpoint does
 * not confirm that other businesses' transcripts exist.
 *
 * The retry always goes through Meta's Media API using the stored media id: the
 * link in the original webhook expired five minutes after it was sent.
 */
export async function retryTranscript(
  transcriptId: string,
  canAccess: (transcriptId: string) => Promise<boolean>,
  deps: TranscriptDeps,
): Promise<RetryResult> {
  if (!(await canAccess(transcriptId))) {
    return { outcome: "not_found", message: "Transcript not found." };
  }

  const target = await deps.db.getRetryTarget(transcriptId);
  if (!target) {
    return { outcome: "not_found", message: "Transcript not found." };
  }

  if (target.status === "ready") {
    return { outcome: "already_ready", message: "This transcript is already available." };
  }

  if (!target.meta_media_id) {
    return {
      outcome: "not_retryable",
      message: "Meta never sent a reference to this transcript, so there is nothing to retry.",
    };
  }

  // Without the hash from Meta's webhook there is no way to verify what comes
  // back, and unverified content is never stored.
  if (!target.media_sha256) {
    return {
      outcome: "not_retryable",
      message: "This transcript cannot be verified, so it cannot be downloaded again.",
    };
  }

  const now = (deps.now ?? (() => new Date()))();
  if (now.getTime() - new Date(target.created_at).getTime() > META_RETENTION_MS) {
    return {
      outcome: "not_retryable",
      message: "Meta deletes transcripts 7 days after the call. This one can no longer be downloaded.",
    };
  }

  try {
    const { segments } = await fetchAndStoreTranscript(
      { id: target.meta_media_id, sha256: target.media_sha256 }, // no url: go straight to the Media API
      {
        businessId: target.business_id,
        whatsappNumberId: target.whatsapp_number_id,
        callRowId: target.call_id,
        metaCallId: target.meta_call_id,
        phoneNumberId: target.phone_number_id,
      },
      deps,
    );
    logInfo("retry.succeeded", { transcript_id: transcriptId, segments });
    return { outcome: "ready", message: "Transcript downloaded." };
  } catch (err) {
    // The technical reason goes to the function logs, not the customer.
    logWarn("retry.failed", {
      transcript_id: transcriptId,
      call_id: shortId(target.meta_call_id),
      error: redact(err instanceof Error ? err.message : String(err)),
    });
    return {
      outcome: "failed",
      message: "Meta's copy of this transcript could not be downloaded. Try again later.",
    };
  }
}
