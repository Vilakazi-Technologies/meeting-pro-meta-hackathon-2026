// Supabase-backed implementation of the Db port.
//
// Uses the service role: this function writes webhook_events and reads across
// tenants to route by phone_number_id, neither of which any end-user role is
// permitted to do under RLS. The service role key must never leave the function.
//
// deno-lint-ignore-file no-explicit-any
import type {
  CallUpsert,
  Db,
  NumberRoute,
  RetryTarget,
  SegmentInsert,
  TranscriptUpsert,
  WebhookEventRow,
} from "./db.ts";
import { DuplicateEventError } from "./db.ts";
import type { SummaryActionItem, SummaryDb, SummaryTarget } from "./summary.ts";

const UNIQUE_VIOLATION = "23505";

export class SupabaseDb implements Db, SummaryDb {
  constructor(private readonly client: any) {}

  async findNumberByPhoneNumberId(phoneNumberId: string): Promise<NumberRoute | null> {
    const { data, error } = await this.client
      .from("whatsapp_numbers")
      .select("id, business_id")
      .eq("phone_number_id", phoneNumberId)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error(`whatsapp_numbers lookup failed: ${error.message}`);
    if (!data) return null;
    return { whatsapp_number_id: data.id, business_id: data.business_id };
  }

  async insertWebhookEvent(row: WebhookEventRow): Promise<{ id: string }> {
    const { data, error } = await this.client
      .from("webhook_events")
      .insert(row)
      .select("id")
      .single();
    if (error) {
      // The unique index on dedupe_key is the idempotency guarantee. A violation
      // here is the expected, healthy outcome of a Meta retry.
      if (error.code === UNIQUE_VIOLATION) throw new DuplicateEventError(row.dedupe_key);
      throw new Error(`webhook_events insert failed: ${error.message}`);
    }
    return { id: data.id };
  }

  async markEventProcessed(id: string, error?: string | null): Promise<void> {
    const { error: err } = await this.client
      .from("webhook_events")
      .update({ processed_at: new Date().toISOString(), error: error ?? null })
      .eq("id", id);
    if (err) throw new Error(`webhook_events update failed: ${err.message}`);
  }

  async findCallByMetaId(metaCallId: string) {
    const { data, error } = await this.client
      .from("calls")
      .select("id, business_id")
      .eq("meta_call_id", metaCallId)
      .maybeSingle();
    if (error) throw new Error(`calls lookup failed: ${error.message}`);
    return data ?? null;
  }

  /**
   * Upsert merging on meta_call_id.
   *
   * Reads the existing row first and merges, because a plain PostgREST upsert
   * writes nulls over values: a `connect` event carries no end_time, and a naive
   * upsert of a later event would erase what an earlier one established.
   */
  async upsertCall(row: CallUpsert): Promise<{ id: string }> {
    const existing = await this.findCallByMetaId(row.meta_call_id);
    const payload: Record<string, unknown> = { ...row };
    if (existing) {
      for (const [k, v] of Object.entries(payload)) {
        if (v === null || v === undefined) delete payload[k];
      }
      const { data, error } = await this.client
        .from("calls")
        .update(payload)
        .eq("id", existing.id)
        .select("id")
        .single();
      if (error) throw new Error(`calls update failed: ${error.message}`);
      return { id: data.id };
    }
    const { data, error } = await this.client
      .from("calls")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(`calls insert failed: ${error.message}`);
    return { id: data.id };
  }

  async findTranscriptByCallId(callId: string) {
    const { data, error } = await this.client
      .from("transcripts")
      .select("id, status, media_sha256")
      .eq("call_id", callId)
      .maybeSingle();
    if (error) throw new Error(`transcripts lookup failed: ${error.message}`);
    return data ?? null;
  }

  async upsertTranscript(row: TranscriptUpsert): Promise<{ id: string }> {
    const { data, error } = await this.client
      .from("transcripts")
      .upsert(row, { onConflict: "call_id" })
      .select("id")
      .single();
    if (error) throw new Error(`transcripts upsert failed: ${error.message}`);
    return { id: data.id };
  }

  async replaceSegments(transcriptId: string, segments: SegmentInsert[]): Promise<void> {
    const { error: delErr } = await this.client
      .from("transcript_segments")
      .delete()
      .eq("transcript_id", transcriptId);
    if (delErr) throw new Error(`transcript_segments delete failed: ${delErr.message}`);
    if (segments.length === 0) return;
    const { error } = await this.client.from("transcript_segments").insert(segments);
    if (error) throw new Error(`transcript_segments insert failed: ${error.message}`);
  }

  async getRetryTarget(transcriptId: string): Promise<RetryTarget | null> {
    const { data, error } = await this.client
      .from("transcripts")
      .select(
        "id, call_id, business_id, status, meta_media_id, media_sha256, created_at, " +
          "calls ( meta_call_id, whatsapp_number_id, whatsapp_numbers ( phone_number_id ) )",
      )
      .eq("id", transcriptId)
      .maybeSingle();
    if (error) throw new Error(`transcripts retry lookup failed: ${error.message}`);
    if (!data) return null;
    return {
      transcript_id: data.id,
      call_id: data.call_id,
      business_id: data.business_id,
      status: data.status,
      meta_media_id: data.meta_media_id,
      media_sha256: data.media_sha256,
      created_at: data.created_at,
      meta_call_id: data.calls?.meta_call_id ?? "",
      whatsapp_number_id: data.calls?.whatsapp_number_id ?? null,
      phone_number_id: data.calls?.whatsapp_numbers?.phone_number_id ?? null,
    };
  }

  async getSummaryTarget(transcriptId: string): Promise<SummaryTarget | null> {
    const { data, error } = await this.client
      .from("transcripts")
      .select("id, business_id, full_text, summary_status")
      .eq("id", transcriptId)
      .maybeSingle();
    if (error) throw new Error(`transcripts summary lookup failed: ${error.message}`);
    if (!data) return null;
    return {
      transcript_id: data.id,
      business_id: data.business_id,
      full_text: data.full_text,
      summary_status: data.summary_status,
    };
  }

  async applySummary(
    transcriptId: string,
    title: string,
    summary: string,
    model: string,
    actionItems: SummaryActionItem[],
  ): Promise<void> {
    // One database function, one transaction: the transcript fields and the
    // action items land together or not at all.
    const { error } = await this.client.rpc("apply_transcript_summary", {
      p_transcript_id: transcriptId,
      p_title: title,
      p_summary: summary,
      p_model: model,
      p_action_items: actionItems,
    });
    if (error) throw new Error(`apply_transcript_summary failed: ${error.message}`);
  }

  async markSummaryFailed(transcriptId: string, error: string): Promise<void> {
    const { error: err } = await this.client
      .from("transcripts")
      .update({ summary_status: "failed", summary_error: error.slice(0, 500) })
      .eq("id", transcriptId);
    if (err) throw new Error(`marking summary failed did not work: ${err.message}`);
  }
}
