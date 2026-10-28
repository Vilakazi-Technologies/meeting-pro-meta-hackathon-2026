/**
 * Summarisation model port — prefers Meta Model API (Muse Spark) for production
 * and hackathon demos; falls back to Anthropic when only ANTHROPIC_API_KEY is set.
 */
import Anthropic from "npm:@anthropic-ai/sdk@0.68.0";
import type { ModelRequest, ModelResponse } from "../whatsapp-webhook/src/summary.ts";

const META_BASE_URL = "https://api.meta.ai";
const DEFAULT_MUSE_MODEL = "muse-spark-1.3";
const DEFAULT_ANTHROPIC_MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 4096;

export type SummaryModelBackend = "meta" | "anthropic" | "none";

export function resolveSummaryModelBackend(): SummaryModelBackend {
  const metaKey = Deno.env.get("MODEL_API_KEY") ?? Deno.env.get("META_MODEL_API_KEY") ?? "";
  if (metaKey) return "meta";
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
  if (anthropicKey) return "anthropic";
  return "none";
}

function metaModelId(): string {
  return Deno.env.get("META_SUMMARY_MODEL") ?? DEFAULT_MUSE_MODEL;
}

function anthropicModelId(): string {
  return Deno.env.get("ANTHROPIC_SUMMARY_MODEL") ?? DEFAULT_ANTHROPIC_MODEL;
}

function missingKeyMessage(): string {
  return (
    "No summarisation API key is set. Set MODEL_API_KEY (Meta Model API / Muse Spark) " +
    "or ANTHROPIC_API_KEY on the Supabase project."
  );
}

/** Extract assistant text from an Anthropic-shaped message response. */
export function textFromMessageContent(
  content: Anthropic.Message["content"],
): string {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

async function callWithClient(
  client: Anthropic,
  model: string,
  req: ModelRequest,
): Promise<ModelResponse> {
  const response = await client.messages.create({
    model,
    max_tokens: MAX_TOKENS,
    system: req.system,
    messages: [{ role: "user", content: req.user }],
  });

  const text = textFromMessageContent(response.content);

  if (response.stop_reason === "max_tokens") {
    throw new Error(`model output hit max_tokens (${MAX_TOKENS}); reply truncated`);
  }
  if (response.stop_reason === "refusal") {
    throw new Error("model declined to summarise this transcript");
  }

  return {
    text,
    model: response.model,
    usage: {
      input_tokens: response.usage?.input_tokens,
      output_tokens: response.usage?.output_tokens,
    },
  };
}

/** Model port used by summarize-transcript and tests. */
export function createSummarizeModelCaller(): (req: ModelRequest) => Promise<ModelResponse> {
  const backend = resolveSummaryModelBackend();
  if (backend === "none") {
    return async () => {
      throw new Error(missingKeyMessage());
    };
  }

  if (backend === "meta") {
    const apiKey = Deno.env.get("MODEL_API_KEY") ?? Deno.env.get("META_MODEL_API_KEY") ?? "";
    const client = new Anthropic({ baseURL: META_BASE_URL, apiKey });
    const model = metaModelId();
    return (req) => callWithClient(client, model, req);
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
  const client = new Anthropic({ apiKey });
  const model = anthropicModelId();
  return (req) => callWithClient(client, model, req);
}

export function mapModelClientError(err: unknown): string {
  let detail = err instanceof Error ? err.message : String(err);
  if (err instanceof Anthropic.AuthenticationError) {
    detail = resolveSummaryModelBackend() === "meta"
      ? "Meta Model API key rejected"
      : "Anthropic API key rejected";
  } else if (err instanceof Anthropic.RateLimitError) {
    detail = resolveSummaryModelBackend() === "meta"
      ? "Meta Model API rate limit reached"
      : "Anthropic rate limit reached";
  } else if (err instanceof Anthropic.APIError) {
    const label = resolveSummaryModelBackend() === "meta" ? "Meta Model API" : "Anthropic API";
    detail = `${label} error ${err.status}`;
  }
  return detail;
}
