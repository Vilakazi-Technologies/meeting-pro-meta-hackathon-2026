// Structured logging with hard rules about what must never reach a log line.
//
// Two categories are forbidden outright:
//   1. Access tokens and the app secret — a leaked token is a live credential.
//   2. Transcript text, in full or in part — it is customer conversation content
//      and logs are the least controlled place it could end up.
//
// Identifiers, counts, durations and status codes are all fine and are what you
// actually need to debug an ingest problem.

const TOKEN_PATTERN = /(Bearer\s+)[A-Za-z0-9._\-]{8,}/gi;

/** Last-resort scrub for strings that may have come from an error message. */
export function redact(input: string): string {
  return input.replace(TOKEN_PATTERN, "$1[redacted]");
}

/** Shorten an identifier for logs: enough to correlate, not enough to reconstruct. */
export function shortId(id: string | null | undefined): string {
  if (!id) return "-";
  return id.length <= 18 ? id : `${id.slice(0, 12)}…${id.slice(-4)}`;
}

/**
 * Build the log line.
 *
 * `event` is reassigned AFTER the spread on purpose: a caller passing a field of
 * its own called `event` (Meta's call objects have exactly such a field) would
 * otherwise silently overwrite the log event name and make the logs unsearchable.
 */
function emit(level: string, event: string, fields: Record<string, unknown>): string {
  const payload: Record<string, unknown> = { level, event, ...fields };
  payload.event = event;
  return redact(JSON.stringify(payload));
}

export function logInfo(event: string, fields: Record<string, unknown> = {}): void {
  console.log(emit("info", event, fields));
}

export function logWarn(event: string, fields: Record<string, unknown> = {}): void {
  console.warn(emit("warn", event, fields));
}

export function logError(event: string, fields: Record<string, unknown> = {}): void {
  console.error(emit("error", event, fields));
}
