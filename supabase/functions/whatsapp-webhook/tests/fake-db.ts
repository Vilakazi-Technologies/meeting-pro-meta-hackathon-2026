// In-memory Db for offline tests.
//
// This is only a useful test double if it enforces the SAME constraints the real
// schema does, otherwise the tests prove nothing about production. Mirrored here:
//   webhook_events.dedupe_key          unique  -> DuplicateEventError
//   calls.meta_call_id                 unique  -> upsert merges, never duplicates
//   transcripts.call_id                unique  -> upsert merges, never duplicates
//   transcript_segments (transcript_id, segment_index) unique -> replace, not append
import { DuplicateEventError } from "../src/db.ts";
import type { SummaryActionItem, SummaryDb, SummaryTarget } from "../src/summary.ts";
import type {
  CallUpsert,
  Db,
  NumberRoute,
  RetryTarget,
  SegmentInsert,
  TranscriptUpsert,
  WebhookEventRow,
} from "../src/db.ts";

export interface StoredEvent extends WebhookEventRow {
  id: string;
  processed_at: string | null;
  error: string | null;
}

export class FakeDb implements Db, SummaryDb {
  readonly events: StoredEvent[] = [];
  readonly calls: (CallUpsert & { id: string })[] = [];
  readonly transcripts: (TranscriptUpsert & { id: string; created_at: string })[] = [];
  readonly segments = new Map<string, SegmentInsert[]>();
  /** Mirrors public.action_items; is_ai_generated decides what a re-run replaces. */
  readonly actionItems: {
    id: string;
    transcript_id: string;
    business_id: string;
    text: string;
    owner: string | null;
    is_ai_generated: boolean;
  }[] = [];
  private readonly numbers = new Map<string, NumberRoute>();
  private seq = 0;

  constructor(numbers: Record<string, NumberRoute> = {}) {
    for (const [k, v] of Object.entries(numbers)) this.numbers.set(k, v);
  }

  private id(prefix: string): string {
    this.seq++;
    return `${prefix}-${String(this.seq).padStart(4, "0")}`;
  }

  findNumberByPhoneNumberId(phoneNumberId: string): Promise<NumberRoute | null> {
    return Promise.resolve(this.numbers.get(phoneNumberId) ?? null);
  }

  insertWebhookEvent(row: WebhookEventRow): Promise<{ id: string }> {
    if (this.events.some((e) => e.dedupe_key === row.dedupe_key)) {
      return Promise.reject(new DuplicateEventError(row.dedupe_key));
    }
    const stored: StoredEvent = { ...row, id: this.id("evt"), processed_at: null, error: null };
    this.events.push(stored);
    return Promise.resolve({ id: stored.id });
  }

  markEventProcessed(id: string, error?: string | null): Promise<void> {
    const evt = this.events.find((e) => e.id === id);
    if (evt) {
      evt.processed_at = new Date().toISOString();
      evt.error = error ?? null;
    }
    return Promise.resolve();
  }

  upsertCall(row: CallUpsert): Promise<{ id: string }> {
    const existing = this.calls.find((c) => c.meta_call_id === row.meta_call_id);
    if (existing) {
      // Merge: a null from a later event must not erase an earlier value.
      for (const [k, v] of Object.entries(row)) {
        if (v !== null && v !== undefined) (existing as unknown as Record<string, unknown>)[k] = v;
      }
      return Promise.resolve({ id: existing.id });
    }
    const created = { ...row, id: this.id("call") };
    this.calls.push(created);
    return Promise.resolve({ id: created.id });
  }

  findCallByMetaId(metaCallId: string): Promise<{ id: string; business_id: string } | null> {
    const c = this.calls.find((x) => x.meta_call_id === metaCallId);
    return Promise.resolve(c ? { id: c.id, business_id: c.business_id } : null);
  }

  findTranscriptByCallId(
    callId: string,
  ): Promise<{ id: string; status: string; media_sha256: string | null } | null> {
    const t = this.transcripts.find((x) => x.call_id === callId);
    return Promise.resolve(
      t ? { id: t.id, status: t.status, media_sha256: t.media_sha256 } : null,
    );
  }

  upsertTranscript(row: TranscriptUpsert): Promise<{ id: string }> {
    const existing = this.transcripts.find((t) => t.call_id === row.call_id);
    if (existing) {
      Object.assign(existing, row);
      return Promise.resolve({ id: existing.id });
    }
    const created = { ...row, id: this.id("tr"), created_at: new Date().toISOString() };
    this.transcripts.push(created);
    return Promise.resolve({ id: created.id });
  }

  replaceSegments(transcriptId: string, segments: SegmentInsert[]): Promise<void> {
    const indexes = new Set(segments.map((s) => s.segment_index));
    if (indexes.size !== segments.length) {
      return Promise.reject(new Error("duplicate segment_index violates unique constraint"));
    }
    this.segments.set(transcriptId, segments);
    return Promise.resolve();
  }

  getSummaryTarget(transcriptId: string): Promise<SummaryTarget | null> {
    const t = this.transcripts.find((x) => x.id === transcriptId);
    if (!t) return Promise.resolve(null);
    return Promise.resolve({
      transcript_id: t.id,
      business_id: t.business_id,
      full_text: t.full_text,
      summary_status: this.summaryStatus.get(t.id) ?? "pending",
    });
  }

  readonly summaryStatus = new Map<string, string>();
  readonly summaries = new Map<
    string,
    { title: string; summary: string; model: string; error: string | null }
  >();

  applySummary(
    transcriptId: string,
    title: string,
    summary: string,
    model: string,
    actionItems: SummaryActionItem[],
  ): Promise<void> {
    const t = this.transcripts.find((x) => x.id === transcriptId);
    if (!t) return Promise.reject(new Error("transcript not found"));
    // Mirrors the database function: AI items are replaced, hand-made ones stay.
    for (let i = this.actionItems.length - 1; i >= 0; i--) {
      const a = this.actionItems[i];
      if (a.transcript_id === transcriptId && a.is_ai_generated) this.actionItems.splice(i, 1);
    }
    for (const item of actionItems) {
      if (!item.text.trim()) continue;
      this.actionItems.push({
        id: this.id("ai"),
        transcript_id: transcriptId,
        business_id: t.business_id,
        text: item.text.trim(),
        owner: item.owner,
        is_ai_generated: true,
      });
    }
    this.summaryStatus.set(transcriptId, "ready");
    this.summaries.set(transcriptId, { title, summary, model, error: null });
    return Promise.resolve();
  }

  markSummaryFailed(transcriptId: string, error: string): Promise<void> {
    this.summaryStatus.set(transcriptId, "failed");
    const existing = this.summaries.get(transcriptId);
    this.summaries.set(transcriptId, {
      title: existing?.title ?? "",
      summary: existing?.summary ?? "",
      model: existing?.model ?? "",
      error,
    });
    return Promise.resolve();
  }

  aiActionItemsFor(transcriptId: string) {
    return this.actionItems.filter((a) => a.transcript_id === transcriptId && a.is_ai_generated);
  }

  getRetryTarget(transcriptId: string): Promise<RetryTarget | null> {
    const t = this.transcripts.find((x) => x.id === transcriptId);
    if (!t) return Promise.resolve(null);
    const call = this.calls.find((c) => c.id === t.call_id);
    let phoneNumberId: string | null = null;
    for (const [pnid, route] of this.numbers) {
      if (route.whatsapp_number_id === call?.whatsapp_number_id) phoneNumberId = pnid;
    }
    return Promise.resolve({
      transcript_id: t.id,
      call_id: t.call_id,
      business_id: t.business_id,
      status: t.status,
      meta_media_id: t.meta_media_id,
      media_sha256: t.media_sha256,
      created_at: t.created_at,
      meta_call_id: call?.meta_call_id ?? "",
      whatsapp_number_id: call?.whatsapp_number_id ?? null,
      phone_number_id: phoneNumberId,
    });
  }

  segmentsFor(transcriptId: string): SegmentInsert[] {
    return this.segments.get(transcriptId) ?? [];
  }
}
