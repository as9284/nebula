import {
  type LlmConfig,
  normalizeOpenAiCompletionsUrl,
} from "./llm-config";
import {
  type LlmStreamHandlers,
  type LlmStreamResult,
  StreamFieldTracker,
  ThinkTagStreamSplitter,
  emitStreamDelta,
  mergeThinking,
  parseOpenAiStreamDelta,
  shouldUseReasoningSplit,
  splitEmbeddedThinking,
} from "./reasoning-stream";

export interface LlmMessage {
  role: "user" | "assistant" | "system";
  content: string | LlmContentPart[];
}

export type LlmContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | {
      type: "image";
      source: { type: "base64"; media_type: string; data: string };
    };

const ANTHROPIC_VERSION = "2023-06-01";
const ANTHROPIC_DEFAULT_URL = "https://api.anthropic.com/v1/messages";

function parseUpstreamError(
  body: unknown,
  fallback: string,
): string {
  if (!body || typeof body !== "object") return fallback;
  const b = body as {
    error?: { message?: string } | string;
    message?: string;
  };
  if (typeof b.error === "string") return b.error;
  if (b.error && typeof b.error === "object" && b.error.message) {
    return b.error.message;
  }
  if (b.message) return b.message;
  return fallback;
}

function anthropicUrl(config: LlmConfig): string {
  const trimmed = config.baseUrl.trim();
  if (!trimmed || trimmed.includes("deepseek") || trimmed.includes("openai.com")) {
    return ANTHROPIC_DEFAULT_URL;
  }
  if (trimmed.endsWith("/messages")) return trimmed;
  if (trimmed.endsWith("/v1")) return `${trimmed}/messages`;
  return `${trimmed.replace(/\/+$/, "")}/v1/messages`;
}

function toAnthropicMessages(messages: LlmMessage[]): {
  system?: string;
  messages: { role: "user" | "assistant"; content: LlmContentPart[] | string }[];
} {
  const systemParts: string[] = [];
  const out: { role: "user" | "assistant"; content: LlmContentPart[] | string }[] =
    [];

  for (const m of messages) {
    if (m.role === "system") {
      systemParts.push(typeof m.content === "string" ? m.content : "");
      continue;
    }
    out.push({
      role: m.role,
      content: m.content,
    });
  }

  return {
    system: systemParts.length ? systemParts.join("\n\n") : undefined,
    messages: out,
  };
}

async function* readSseLines(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      yield line;
    }
  }
  if (buffer.trim()) yield buffer;
}

export type { LlmStreamHandlers, LlmStreamResult } from "./reasoning-stream";

export async function streamLlm(
  config: LlmConfig,
  messages: LlmMessage[],
  signal: AbortSignal,
  handlers: LlmStreamHandlers,
): Promise<LlmStreamResult> {
  if (config.provider === "anthropic") {
    return streamAnthropic(config, messages, signal, handlers);
  }
  return streamOpenAiCompatible(config, messages, signal, handlers);
}

export async function completeLlm(
  config: LlmConfig,
  prompt: string,
): Promise<string> {
  return completeLlmMessages(config, [{ role: "user", content: prompt }]);
}

export async function completeLlmMessages(
  config: LlmConfig,
  messages: LlmMessage[],
): Promise<string> {
  if (config.provider === "anthropic") {
    return completeAnthropicMessages(config, messages);
  }
  return completeOpenAiCompatibleMessages(config, messages);
}

async function streamOpenAiCompatible(
  config: LlmConfig,
  messages: LlmMessage[],
  signal: AbortSignal,
  handlers: LlmStreamHandlers,
): Promise<LlmStreamResult> {
  const url = normalizeOpenAiCompletionsUrl(config.baseUrl);
  const body: Record<string, unknown> = {
    model: config.model,
    messages,
    stream: true,
  };
  if (shouldUseReasoningSplit(config)) {
    body.reasoning_split = true;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      parseUpstreamError(err, `Model request failed (${res.status})`),
    );
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  let content = "";
  let thinking = "";
  const useReasoningSplit = shouldUseReasoningSplit(config);
  const contentTracker = new StreamFieldTracker();
  const reasoningTracker = new StreamFieldTracker();
  const tagSplitter = useReasoningSplit ? null : new ThinkTagStreamSplitter();

  for await (const line of readSseLines(reader)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    const data = trimmed.slice(5).trim();
    if (data === "[DONE]") continue;
    try {
      const parsed = JSON.parse(data);
      const delta = parseOpenAiStreamDelta(parsed);

      if (delta.reasoning) {
        const piece = reasoningTracker.push(delta.reasoning);
        if (piece) {
          thinking += piece;
          handlers.onReasoning?.(piece);
        }
      }

      if (delta.content) {
        if (useReasoningSplit) {
          const piece = contentTracker.push(delta.content);
          if (piece) {
            content += piece;
            handlers.onContent?.(piece);
          }
        } else {
          const split = tagSplitter!.push(delta.content);
          if (split.content) content += split.content;
          if (split.reasoning) thinking += split.reasoning;
          emitStreamDelta(split, handlers);
        }
      }
    } catch {
      // skip malformed SSE chunks
    }
  }

  if (tagSplitter) {
    const tail = tagSplitter.flush();
    if (tail.content) {
      content += tail.content;
      handlers.onContent?.(tail.content);
    }
    if (tail.reasoning) {
      thinking += tail.reasoning;
      handlers.onReasoning?.(tail.reasoning);
    }
  }

  const embedded = splitEmbeddedThinking(content);
  return {
    content: embedded.content,
    thinking: mergeThinking(thinking, embedded.thinking),
  };
}

async function completeOpenAiCompatibleMessages(
  config: LlmConfig,
  messages: LlmMessage[],
): Promise<string> {
  const url = normalizeOpenAiCompletionsUrl(config.baseUrl);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      parseUpstreamError(err, `Model request failed (${res.status})`),
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? "";
}

async function streamAnthropic(
  config: LlmConfig,
  messages: LlmMessage[],
  signal: AbortSignal,
  handlers: LlmStreamHandlers,
): Promise<LlmStreamResult> {
  const { system, messages: anthropicMessages } = toAnthropicMessages(messages);
  const res = await fetch(anthropicUrl(config), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 8192,
      ...(system ? { system } : {}),
      messages: anthropicMessages,
      stream: true,
    }),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      parseUpstreamError(err, `Model request failed (${res.status})`),
    );
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  let content = "";
  let thinking = "";
  let eventType = "";

  for await (const line of readSseLines(reader)) {
    const trimmed = line.trim();
    if (trimmed.startsWith("event:")) {
      eventType = trimmed.slice(6).trim();
      continue;
    }
    if (!trimmed.startsWith("data:")) continue;
    const data = trimmed.slice(5).trim();
    if (!data || data === "[DONE]") continue;
    try {
      const parsed = JSON.parse(data) as {
        type?: string;
        delta?: { type?: string; text?: string; thinking?: string };
      };
      const type = parsed.type ?? eventType;
      if (type === "content_block_delta" && parsed.delta) {
        if (parsed.delta.type === "text_delta" && parsed.delta.text) {
          content += parsed.delta.text;
          handlers.onContent?.(parsed.delta.text);
        }
        if (parsed.delta.type === "thinking_delta") {
          const piece =
            parsed.delta.thinking ?? parsed.delta.text ?? "";
          if (piece) {
            thinking += piece;
            handlers.onReasoning?.(piece);
          }
        }
      }
    } catch {
      // skip malformed SSE chunks
    }
  }

  const embedded = splitEmbeddedThinking(content);
  return {
    content: embedded.content,
    thinking: mergeThinking(thinking, embedded.thinking),
  };
}

async function completeAnthropicMessages(
  config: LlmConfig,
  messages: LlmMessage[],
): Promise<string> {
  const { system, messages: anthropicMessages } = toAnthropicMessages(messages);
  const res = await fetch(anthropicUrl(config), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 4096,
      ...(system ? { system } : {}),
      messages: anthropicMessages,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      parseUpstreamError(err, `Model request failed (${res.status})`),
    );
  }

  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  return (
    data.content
      ?.filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("") ?? ""
  );
}
