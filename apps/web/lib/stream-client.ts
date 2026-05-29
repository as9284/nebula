import { type LlmConfig, isLoopbackUrl } from "@nebula/core/llm-config";
import {
  type LlmContentPart,
  type LlmMessage,
  streamLlm,
  completeLlmMessages,
} from "@nebula/core/llm";
import { deliverStreamingText } from "@nebula/core/reasoning-stream";
import type { SearchTopic } from "@/lib/search-query";
import type { SearchProvider, WebSearchResponse } from "@/types/search";

export type StreamMessageContent = string | LlmContentPart[];

export interface StreamMessage {
  role: "user" | "assistant" | "system";
  content: StreamMessageContent;
}

export interface StreamChatResult {
  content: string;
  thinking: string;
}

export interface StreamChatOptions {
  /** Vision parts for the latest user turn (OpenAI / Anthropic). */
  visionParts?: LlmContentPart[];
}

export interface StreamChatHandlers {
  onContent?: (token: string) => void | Promise<void>;
  onReasoning?: (token: string) => void | Promise<void>;
}

export async function streamChat(
  messages: StreamMessage[],
  systemPrompt: string,
  llm: LlmConfig,
  signal: AbortSignal,
  handlers: StreamChatHandlers,
  options?: StreamChatOptions,
): Promise<StreamChatResult> {
  const payloadMessages = options?.visionParts?.length
    ? withVisionOnLastUser(messages, options.visionParts)
    : messages;

  // Local models (Ollama/LM Studio) live on the user's machine, so the request
  // must come from the browser — a hosted server can't reach the user's loopback.
  if (isLoopbackUrl(llm.baseUrl)) {
    return streamLocalChat(payloadMessages, systemPrompt, llm, signal, handlers);
  }

  const res = await fetch("/api/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: payloadMessages,
      systemPrompt,
      llm,
    }),
    signal,
  });

  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? `Request failed (${res.status})`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let content = "";
  let thinking = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") continue;
      let parsed: {
        error?: string;
        choices?: {
          delta?: { content?: string; reasoning?: string };
        }[];
      };
      try {
        parsed = JSON.parse(data);
      } catch {
        continue; // skip malformed SSE chunks
      }

      if (parsed.error) throw new Error(parsed.error);

      const delta = parsed.choices?.[0]?.delta;
      if (!delta) continue;

      if (delta.content) {
        await deliverStreamingText(delta.content, async (slice) => {
          content += slice;
          await handlers.onContent?.(slice);
        });
      }
      if (delta.reasoning) {
        await deliverStreamingText(delta.reasoning, async (slice) => {
          thinking += slice;
          await handlers.onReasoning?.(slice);
        });
      }
    }
  }

  return { content, thinking };
}

/** Stream directly from the browser to a local model server (Ollama/LM Studio). */
async function streamLocalChat(
  messages: StreamMessage[],
  systemPrompt: string,
  llm: LlmConfig,
  signal: AbortSignal,
  handlers: StreamChatHandlers,
): Promise<StreamChatResult> {
  const fullMessages: LlmMessage[] = systemPrompt
    ? [{ role: "system", content: systemPrompt }, ...messages]
    : messages;

  let content = "";
  let thinking = "";
  // Serialize handler work so sliced tokens render in order (streamLlm fires
  // its callbacks synchronously without awaiting them).
  let chain = Promise.resolve();
  const queue = (
    text: string,
    onSlice: (slice: string) => void | Promise<void>,
  ) => {
    chain = chain.then(() => deliverStreamingText(text, onSlice));
  };

  await streamLlm(llm, fullMessages, signal, {
    onContent: (text) =>
      queue(text, async (slice) => {
        content += slice;
        await handlers.onContent?.(slice);
      }),
    onReasoning: (text) =>
      queue(text, async (slice) => {
        thinking += slice;
        await handlers.onReasoning?.(slice);
      }),
  });
  await chain;

  return { content, thinking };
}

function withVisionOnLastUser(
  messages: StreamMessage[],
  visionParts: LlmContentPart[],
): StreamMessage[] {
  const out = [...messages];
  for (let i = out.length - 1; i >= 0; i--) {
    if (out[i].role === "user") {
      const raw = out[i].content;
      const textContent: string = typeof raw === "string" ? raw : "";
      const parts: LlmContentPart[] = [
        { type: "text", text: textContent },
        ...visionParts,
      ];
      out[i] = { role: out[i].role, content: parts };
      break;
    }
  }
  return out;
}

export async function searchWeb(
  query: string,
  provider: SearchProvider,
  tavilyKey: string,
  topic: SearchTopic = "general",
): Promise<WebSearchResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (provider === "tavily" && tavilyKey) {
    headers["x-tavily-key"] = tavilyKey;
  }

  const res = await fetch("/api/search", {
    method: "POST",
    headers,
    body: JSON.stringify({ query, topic, provider }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Search failed");
  }
  const data = (await res.json()) as WebSearchResponse;
  return {
    results: data.results,
    sources: data.sources ?? [],
    answer: data.answer,
  };
}

export async function completeText(
  prompt: string,
  llm: LlmConfig,
): Promise<string> {
  if (isLoopbackUrl(llm.baseUrl)) {
    return completeLlmMessages(llm, [{ role: "user", content: prompt }]);
  }

  const res = await fetch("/api/ai/text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }],
      llm,
    }),
  });

  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? `Classifier failed (${res.status})`);
  }

  const data = (await res.json()) as { text?: string };
  return data.text ?? "";
}
