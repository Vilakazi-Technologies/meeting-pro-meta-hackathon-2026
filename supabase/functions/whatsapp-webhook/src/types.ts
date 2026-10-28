// Shapes of Meta's `calls` webhook field.
// Sourced from Meta's Calling API and Webhook Reference and the Call
// Transcription guide — see fixtures/README.md for exact URLs and for the list
// of fields we could not confirm.

/** Documented values of calls[].event. */
export type MetaCallEvent =
  | "call_created"
  | "connect"
  | "terminate"
  | "call_transcription_available"
  | "call_recording_available"; // documented feature; payload shape unconfirmed

/** Documented values of calls[].direction. Note: UPPERCASE on the wire. */
export type MetaCallDirection = "BUSINESS_INITIATED" | "USER_INITIATED";

export interface MetaDocument {
  id: string;
  sha256: string; // base64-encoded SHA-256 of the document bytes
  mime_type?: string;
  url?: string; // expires 5 minutes after the webhook fires
}

export interface MetaCallObject {
  id: string;
  event: MetaCallEvent | string;
  timestamp: string; // unix seconds, as a string
  direction?: MetaCallDirection | string;

  to?: string;
  to_user_id?: string;
  to_parent_user_id?: string;
  from?: string; // absent when the user has adopted a WhatsApp username
  from_user_id?: string;
  from_parent_user_id?: string;

  status?: string; // terminate only: COMPLETED | FAILED
  start_time?: string;
  end_time?: string;
  duration?: number; // seconds

  session?: { sdp_type?: string; sdp?: string };
  call_transcript?: { document?: MetaDocument };
  biz_opaque_callback_data?: string;
}

export interface MetaStatusObject {
  id: string;
  timestamp: string;
  type?: string;
  status?: string; // RINGING | ACCEPTED | REJECTED
  recipient_id?: string;
}

export interface MetaChangeValue {
  messaging_product?: string;
  metadata?: { display_phone_number?: string; phone_number_id?: string };
  contacts?: unknown[];
  calls?: MetaCallObject[];
  statuses?: MetaStatusObject[]; // call status webhooks use this INSTEAD of calls
  errors?: unknown[];
}

export interface MetaChange {
  field?: string;
  value?: MetaChangeValue;
}

export interface MetaEntry {
  id?: string; // the WABA id
  changes?: MetaChange[];
}

export interface MetaWebhookBody {
  object?: string;
  entry?: MetaEntry[];
}

/** The downloaded transcript JSON document. */
export interface MetaTranscriptWord {
  word?: string;
  start?: number;
  end?: number;
  confidence?: number;
  lang?: string;
}

export interface MetaTranscriptSegment {
  id?: number | string;
  speaker?: string;
  channel?: number; // 0 = business, 1 = customer
  start?: number;
  end?: number;
  text?: string;
  confidence?: number;
  words?: MetaTranscriptWord[];
}

export interface MetaTranscriptDocument {
  metadata?: {
    processed_at?: string;
    audio?: {
      duration?: number;
      sample_rate?: number;
      channels?: number;
      audio_format?: string;
    };
  };
  transcript?: {
    text?: string;
    language?: string;
    duration?: number;
    confidence?: number;
    segments?: MetaTranscriptSegment[];
  };
}
