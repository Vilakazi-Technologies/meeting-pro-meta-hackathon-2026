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

export interface ParsedSummary {
  title: string;
  summary: string;
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
    actionItems: SummaryActionItem[],
  ): Promise<void>;
  markSummaryFailed(transcriptId: string, error: string): Promise<void>;
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
  "summary":      thorough but succinct meeting minutes as plain text. Use short
                  section labels on their own lines where helpful, e.g.
                  "Discussion:", "Decisions:", "Next steps:", "Notes:". Cover
                  what was said, what was agreed, and what must happen next.
                  Aim for completeness without inventing detail — typically
                  six to fourteen sentences total.
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
const MAX_ACTION_ITEMS = 20;
const MAX_ACTION_TEXT = 300;

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

  let parsed: ParsedSummary;
  let response: ModelResponse;
  try {
    response = await deps.callModel(buildRequest(fullText));
    parsed = parseSummary(response.text);
  } catch (err) {
    const reason = redact(err instanceof Error ? err.message : String(err));
    // Record the failure. The transcript keeps its text; no summary is written.
    await deps.db.markSummaryFailed(transcriptId, reason);
    logWarn("summary.failed", { transcript_id: shortId(transcriptId), error: reason });
    return {
      outcome: "failed",
      message: "This transcript could not be summarised. You can try again.",
    };
  }

  // One transaction. Until this returns, nothing has been written.
  await deps.db.applySummary(
    transcriptId,
    parsed.title,
    parsed.summary,
    response.model,
    parsed.actionItems,
  );

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
