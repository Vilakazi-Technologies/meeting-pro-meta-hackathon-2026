// The database operations this function needs, as an interface.
//
// Declaring it as a port rather than reaching for a Supabase client directly is
// what lets the test suite run the real handler with no Docker and no network:
// the tests supply an in-memory implementation that enforces the same uniqueness
// constraints the real schema does.

export interface NumberRoute {
  whatsapp_number_id: string;
  business_id: string;
}

export interface WebhookEventRow {
  business_id: string | null;
  whatsapp_number_id: string | null;
  event_type: string;
  payload: unknown;
  signature_verified: boolean;
  meta_waba_id: string | null;
  meta_phone_number_id: string | null;
  dedupe_key: string;
}

export interface CallUpsert {
  business_id: string;
  whatsapp_number_id: string | null;
  meta_call_id: string;
  direction: "business_initiated" | "user_initiated" | "unknown";
  counterparty_bsuid: string | null;
  counterparty_parent_bsuid: string | null;
  counterparty_phone: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  status: string | null;
  transcription_enabled?: boolean;
}

export interface TranscriptUpsert {
  business_id: string;
  call_id: string;
  meta_media_id: string | null;
  media_sha256: string | null;
  language: string | null;
  confidence: number | null;
  duration_seconds: number | null;
  full_text: string | null;
  raw: unknown;
  fetched_at: string | null;
  status: "pending" | "fetching" | "ready" | "failed";
}

export interface SegmentInsert {
  business_id: string;
  transcript_id: string;
  segment_index: number;
  meta_segment_id: string | null;
  speaker: string | null;
  channel: number | null;
  start_seconds: number | null;
  end_seconds: number | null;
  text: string | null;
  confidence: number | null;
  words: unknown;
}

/** Everything the retry function needs about one transcript, read with the service role. */
export interface RetryTarget {
  transcript_id: string;
  call_id: string;
  business_id: string;
  status: string;
  meta_media_id: string | null;
  media_sha256: string | null;
  created_at: string;
  meta_call_id: string;
  whatsapp_number_id: string | null;
  phone_number_id: string | null;
}

/** Raised by insertWebhookEvent when dedupe_key already exists. */
export class DuplicateEventError extends Error {
  constructor(public readonly dedupeKey: string) {
    super("duplicate webhook event");
    this.name = "DuplicateEventError";
  }
}

export interface Db {
  /** Resolve the owning tenant from value.metadata.phone_number_id. */
  findNumberByPhoneNumberId(phoneNumberId: string): Promise<NumberRoute | null>;

  /** Insert the raw event. Throws DuplicateEventError on unique violation. */
  insertWebhookEvent(row: WebhookEventRow): Promise<{ id: string }>;

  markEventProcessed(id: string, error?: string | null): Promise<void>;

  /** Upsert on meta_call_id (unique). Returns the call row id. */
  upsertCall(row: CallUpsert): Promise<{ id: string }>;

  findCallByMetaId(metaCallId: string): Promise<{ id: string; business_id: string } | null>;

  findTranscriptByCallId(
    callId: string,
  ): Promise<{ id: string; status: string; media_sha256: string | null } | null>;

  /** Upsert on call_id (unique). Returns the transcript row id. */
  upsertTranscript(row: TranscriptUpsert): Promise<{ id: string }>;

  /** Replace all segments for a transcript, so reprocessing cannot duplicate them. */
  replaceSegments(transcriptId: string, segments: SegmentInsert[]): Promise<void>;

  /** Look up a transcript for retry. Bypasses RLS: authorise the caller first. */
  getRetryTarget(transcriptId: string): Promise<RetryTarget | null>;
}
