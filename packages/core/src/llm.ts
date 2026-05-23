import {
  type LlmConfig,
  normalizeOpenAiCompletionsUrl,
} from "./llm-config";

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

export async function streamLlm(
  config: LlmConfig,
  messages: LlmMessage[],
  signal: AbortSignal,
  onToken: (token: string) => void,
): Promise<string> {
  if (config.provider === "anthropic") {
    return streamAnthropic(config, messages, signal, onToken);
  }
  return streamOpenAiCompatible(config, messages, signal, onToken);
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
  onToken: (token: string) => void,
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

  let full = "";
  for await (const line of readSseLines(reader)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    const data = trimmed.slice(5).trim();
    if (data === "[DONE]") continue;
    try {
      const parsed = JSON.parse(data) as {
        choices?: { delta?: { content?: string } }[];
      };
      const token = parsed.choices?.[0]?.delta?.content ?? "";
      if (token) {
        full += token;
        onToken(token);
      }
    } catch {
      // skip malformed SSE chunks
    }
  }

  return full;
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
  onToken: (token: string) => void,
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

  let full = "";
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
        delta?: { type?: string; text?: string };
      };
      const type = parsed.type ?? eventType;
      if (
        type === "content_block_delta" &&
        parsed.delta?.type === "text_delta" &&
        parsed.delta.text
      ) {
        full += parsed.delta.text;
        onToken(parsed.delta.text);
      }
    } catch {
      // skip malformed SSE chunks
    }
  }

  return full;
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
