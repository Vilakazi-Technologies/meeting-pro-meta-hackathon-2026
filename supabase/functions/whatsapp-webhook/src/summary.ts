import { logInfo, logWarn, redact, shortId } from "./log.ts";

/**
 * The summary pass: transcript text in, a title, a summary and action items out.
 *
 * Meta returns transcripts only, never summaries. This sends the text to Claude
 * and stores the result.
 *
 * Two rules shape everything here:
 *   - Never store a partial summary. Either the model returns something that
 *     parses and validates, and the whole lot is written in one transaction, or
 *     nothing is written and the transcript is marked failed.
 *   - Never invent action items. A call with no commitments must produce an
 *     empty list; the prompt says so explicitly and the parser accepts it.
 */

/** Sent to the model. Kept as a port so tests need no network and no API key. */
export interface ModelRequest {
  system: string;
  user: string;
}

export interface ModelResponse {
  text: string;
  model: string;
  usage?: { input_tokens?: number; output_tokens?: number };
}

export type ModelCaller = (req: ModelRequest) => Promise<ModelResponse>;

export interface SummaryTarget {
  transcript_id: string;
  business_id: string;
  full_text: string | null;
  summary_status: string;
}

export interface SummaryActionItem {
  text: string;
  owner: string | null;
}

export type SummaryDecisionKind = "decision" | "agreement" | "unresolved" | "commitment";

export interface SummaryDecision {
  text: string;
  kind: SummaryDecisionKind;
}

export interface SummaryFollowUp {
  text: string;
  owner: string | null;
  due_hint: string | null;
}

export interface ParsedSummary {
  title: string;
  summary: string;
  executiveSummary: string;
  topics: string[];
  decisions: SummaryDecision[];
  followUps: SummaryFollowUp[];
  sentimentNote: string | null;
  actionItems: SummaryActionItem[];
}

export interface SummaryDb {
  getSummaryTarget(transcriptId: string): Promise<SummaryTarget | null>;
  /** One transaction: transcript fields + AI action items replaced. */
  applySummary(
    transcriptId: string,
    title: string,
    summary: string,
    model: string,
    parsed: ParsedSummary,
  ): Promise<void>;
  markSummaryFailed(transcriptId: string, error: string): Promise<void>;
  beginSummarizeJob?(transcriptId: string, businessId: string): Promise<string | null>;
  finishSummarizeJob?(
    jobId: string | null,
    status: "ready" | "failed",
    model?: string,
    error?: string,
  ): Promise<void>;
}

export interface SummaryDeps {
  db: SummaryDb;
  callModel: ModelCaller;
}

export type SummaryOutcome =
  | "ready" //               summarised now
  | "already_summarized" //  nothing to do
  | "failed" //              model call or its output unusable
  | "not_summarizable" //    no text to summarise
  | "not_found"; //          no such transcript, or not this caller's to see

export interface SummaryResult {
  outcome: SummaryOutcome;
  message: string;
  /** Present on success, for cost reporting. */
  usage?: { input_tokens?: number; output_tokens?: number };
  actionItems?: number;
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

export const SYSTEM_PROMPT =
  `You produce meeting minutes from transcripts of business WhatsApp calls. ` +
  `Speakers are labelled [Business] and [Customer].

Return ONLY a single JSON object. No markdown code fences, no commentary before
or after, no explanation. The first character of your reply must be { and the
last must be }.

The object has exactly these keys:
  "title":        a short label for this call, at most 60 characters, plain
                  text, no quotes. Describe what the call was about.
  "executive_summary": two or three sentences — the headline for a busy executive.
  "summary":      thorough meeting minutes as plain text. Use short section
                  labels on their own lines where helpful. Aim for completeness
                  without inventing detail — typically six to fourteen sentences.
  "topics":       array of short strings — main discussion themes (max 8).
  "decisions":    array of {"text": string, "kind": "decision"|"agreement"|
                  "unresolved"|"commitment"} — only explicit outcomes from the call.
  "follow_ups":   array of {"text": string, "owner": string or null, "due_hint":
                  string or null} — promised next steps or outstanding commitments.
  "sentiment_note": one cautious sentence about overall tone (e.g. cooperative,
                  concerned, urgent). Prefix mentally as inference, not fact.
  "action_items": an array of objects, each {"text": string, "owner": string or null}.

Rules:
- Use ONLY what is in the transcript. Never add facts, names, dates, amounts or
  commitments that are not stated.
- DO NOT INVENT ACTION ITEMS. An action item is something a person explicitly
  committed to do, or was explicitly asked to do. Pleasantries, opinions and
  general discussion are not action items.
- If the call contains no clear next steps, return "action_items": [] — an empty
  array is the correct and expected answer for many calls. Do not pad the list.
- "owner" is the person responsible, only if the transcript names or clearly
  identifies them. Otherwise null. Never guess a name.
- If the transcript is too short or garbled to summarise, still return valid
  JSON: use a plain title, say so in the summary, and return an empty array.`;

export function buildRequest(fullText: string): ModelRequest {
  return {
    system: SYSTEM_PROMPT,
    user: `Transcript:\n\n${fullText}`,
  };
}

// ---------------------------------------------------------------------------
// Defensive parsing
// ---------------------------------------------------------------------------

const MAX_TITLE = 80;
const MAX_SUMMARY = 8000;
const MAX_EXECUTIVE = 1200;
const MAX_ACTION_ITEMS = 20;
const MAX_ACTION_TEXT = 300;
const MAX_TOPICS = 8;
const MAX_TOPIC_LEN = 120;
const MAX_DECISIONS = 15;
const MAX_FOLLOW_UPS = 15;
const MAX_SENTIMENT = 400;

const DECISION_KINDS = new Set<SummaryDecisionKind>([
  "decision",
  "agreement",
  "unresolved",
  "commitment",
]);

function parseStringArray(raw: unknown, maxItems: number, maxLen: number, field: string): string[] {
  if (!Array.isArray(raw)) throw new SummaryParseError(`${field} missing or not an array`);
  const out: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== "string") throw new SummaryParseError(`${field} entry was not a string`);
    const t = entry.trim();
    if (!t) continue;
    out.push(t.slice(0, maxLen));
  }
  if (out.length > maxItems) {
    throw new SummaryParseError(`${field} had more than ${maxItems} entries`);
  }
  return out;
}

function parseDecisions(raw: unknown): SummaryDecision[] {
  if (!Array.isArray(raw)) throw new SummaryParseError("decisions missing or not an array");
  const out: SummaryDecision[] = [];
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      throw new SummaryParseError("a decision was not an object");
    }
    const d = entry as Record<string, unknown>;
    const text = typeof d.text === "string" ? d.text.trim() : "";
    if (!text) throw new SummaryParseError("a decision had no text");
    const kindRaw = typeof d.kind === "string" ? d.kind.trim().toLowerCase() : "decision";
    const kind = DECISION_KINDS.has(kindRaw as SummaryDecisionKind)
      ? (kindRaw as SummaryDecisionKind)
      : "decision";
    out.push({ text: text.slice(0, MAX_ACTION_TEXT), kind });
  }
  if (out.length > MAX_DECISIONS) {
    throw new SummaryParseError(`too many decisions (max ${MAX_DECISIONS})`);
  }
  return out;
}

function parseFollowUps(raw: unknown): SummaryFollowUp[] {
  if (!Array.isArray(raw)) throw new SummaryParseError("follow_ups missing or not an array");
  const out: SummaryFollowUp[] = [];
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      throw new SummaryParseError("a follow-up was not an object");
    }
    const f = entry as Record<string, unknown>;
    const text = typeof f.text === "string" ? f.text.trim() : "";
    if (!text) throw new SummaryParseError("a follow-up had no text");
    const owner = typeof f.owner === "string" && f.owner.trim()
      ? f.owner.trim().slice(0, 120)
      : null;
    const due_hint = typeof f.due_hint === "string" && f.due_hint.trim()
      ? f.due_hint.trim().slice(0, 120)
      : null;
    out.push({ text: text.slice(0, MAX_ACTION_TEXT), owner, due_hint });
  }
  if (out.length > MAX_FOLLOW_UPS) {
    throw new SummaryParseError(`too many follow-ups (max ${MAX_FOLLOW_UPS})`);
  }
  return out;
}

export class SummaryParseError extends Error {}

/**
 * Parse the model's reply into a validated summary, or throw.
 *
 * The prompt forbids markdown fences, but a fenced reply is still stripped
 * rather than thrown away: being lenient about a wrapper we can unambiguously
 * remove is not the same as accepting malformed content. Everything past that
 * is strict — wrong types, missing fields and empty strings are all failures,
 * because a half-understood reply stored as a summary is worse than no summary.
 */
export function parseSummary(raw: string): ParsedSummary {
  let text = (raw ?? "").trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```[a-zA-Z]*\s*/, "").replace(/```\s*$/, "").trim();
  }
  if (!text) throw new SummaryParseError("model returned an empty reply");

  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new SummaryParseError("model reply was not valid JSON");
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new SummaryParseError("model reply was not a JSON object");
  }

  const obj = value as Record<string, unknown>;

  const title = typeof obj.title === "string" ? obj.title.trim() : "";
  if (!title) throw new SummaryParseError("missing or empty title");

  const summary = typeof obj.summary === "string" ? obj.summary.trim() : "";
  if (!summary) throw new SummaryParseError("missing or empty summary");

  const executiveSummary = typeof obj.executive_summary === "string"
    ? obj.executive_summary.trim()
    : summary.split(/\n/)[0]?.slice(0, MAX_EXECUTIVE) ?? summary.slice(0, MAX_EXECUTIVE);

  const topics = obj.topics !== undefined
    ? parseStringArray(obj.topics, MAX_TOPICS, MAX_TOPIC_LEN, "topics")
    : [];
  const decisions = obj.decisions !== undefined ? parseDecisions(obj.decisions) : [];
  const followUps = obj.follow_ups !== undefined ? parseFollowUps(obj.follow_ups) : [];

  const sentimentRaw = typeof obj.sentiment_note === "string" ? obj.sentiment_note.trim() : "";
  const sentimentNote = sentimentRaw ? sentimentRaw.slice(0, MAX_SENTIMENT) : null;

  // An absent array is a failure; an EMPTY array is a valid, expected answer.
  if (!Array.isArray(obj.action_items)) {
    throw new SummaryParseError("action_items missing or not an array");
  }

  const actionItems: SummaryActionItem[] = [];
  for (const entry of obj.action_items) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      throw new SummaryParseError("an action item was not an object");
    }
    const item = entry as Record<string, unknown>;
    const itemText = typeof item.text === "string" ? item.text.trim() : "";
    if (!itemText) throw new SummaryParseError("an action item had no text");
    const owner = typeof item.owner === "string" && item.owner.trim()
      ? item.owner.trim().slice(0, 120)
      : null;
    actionItems.push({ text: itemText.slice(0, MAX_ACTION_TEXT), owner });
  }
  if (actionItems.length > MAX_ACTION_ITEMS) {
    throw new SummaryParseError(
      `model returned ${actionItems.length} action items, more than the ${MAX_ACTION_ITEMS} allowed`,
    );
  }

  return {
    title: title.slice(0, MAX_TITLE),
    summary: summary.slice(0, MAX_SUMMARY),
    executiveSummary: executiveSummary.slice(0, MAX_EXECUTIVE),
    topics,
    decisions,
    followUps,
    sentimentNote,
    actionItems,
  };
}

// ---------------------------------------------------------------------------
// The pass
// ---------------------------------------------------------------------------

export interface SummaryOptions {
  /** Re-summarise a transcript that is already summarised. */
  force?: boolean;
}

export async function summarizeTranscript(
  transcriptId: string,
  canAccess: (transcriptId: string) => Promise<boolean>,
  deps: SummaryDeps,
  options: SummaryOptions = {},
): Promise<SummaryResult> {
  // Authorisation first, with the caller's own credentials, exactly as the
  // retry path does. A transcript the caller cannot see is "not found".
  if (!(await canAccess(transcriptId))) {
    return { outcome: "not_found", message: "Transcript not found." };
  }

  const target = await deps.db.getSummaryTarget(transcriptId);
  if (!target) return { outcome: "not_found", message: "Transcript not found." };

  if (target.summary_status === "ready" && !options.force) {
    return { outcome: "already_summarized", message: "This transcript is already summarised." };
  }

  const fullText = (target.full_text ?? "").trim();
  if (!fullText) {
    // Nothing to summarise is not a model failure, and must not be recorded as
    // one: a failed download already has its own visible failure.
    return {
      outcome: "not_summarizable",
      message: "This transcript has no text to summarise.",
    };
  }

  let jobId: string | null = null;
  if (deps.db.beginSummarizeJob) {
    jobId = await deps.db.beginSummarizeJob(transcriptId, target.business_id);
  }

  let parsed: ParsedSummary;
  let response: ModelResponse;
  try {
    response = await deps.callModel(buildRequest(fullText));
    parsed = parseSummary(response.text);
  } catch (err) {
    const reason = redact(err instanceof Error ? err.message : String(err));
    await deps.db.markSummaryFailed(transcriptId, reason);
    if (deps.db.finishSummarizeJob) {
      await deps.db.finishSummarizeJob(jobId, "failed", undefined, reason);
    }
    logWarn("summary.failed", { transcript_id: shortId(transcriptId), error: reason });
    return {
      outcome: "failed",
      message: "This transcript could not be summarised. You can try again.",
    };
  }

  try {
    await deps.db.applySummary(
      transcriptId,
      parsed.title,
      parsed.summary,
      response.model,
      parsed,
    );
  } catch (err) {
    const reason = redact(err instanceof Error ? err.message : String(err));
    await deps.db.markSummaryFailed(transcriptId, reason);
    if (deps.db.finishSummarizeJob) {
      await deps.db.finishSummarizeJob(jobId, "failed", undefined, reason);
    }
    logWarn("summary.failed", { transcript_id: shortId(transcriptId), error: reason });
    return {
      outcome: "failed",
      message: "This transcript could not be summarised. You can try again.",
    };
  }

  if (deps.db.finishSummarizeJob) {
    await deps.db.finishSummarizeJob(jobId, "ready", response.model);
  }

  // Counts and ids only — never the transcript or the summary text.
  logInfo("summary.stored", {
    transcript_id: shortId(transcriptId),
    model: response.model,
    action_items: parsed.actionItems.length,
    input_tokens: response.usage?.input_tokens ?? null,
    output_tokens: response.usage?.output_tokens ?? null,
  });

  return {
    outcome: "ready",
    message: "Summary created.",
    usage: response.usage,
    actionItems: parsed.actionItems.length,
  };
}
