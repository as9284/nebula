import type { SearchTopic } from "@/lib/search-query";
import type { SearchProvider, WebSearchResponse } from "@/types/search";

export interface StreamMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function streamChat(
  messages: StreamMessage[],
  systemPrompt: string,
  deepseekKey: string,
  signal: AbortSignal,
  onToken: (token: string) => void,
): Promise<string> {
  const res = await fetch("/api/chat/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-deepseek-key": deepseekKey,
    },
    body: JSON.stringify({ messages, systemPrompt }),
    signal,
  });

  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? `Request failed (${res.status})`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let full = "";
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
  }

  return full;
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
  deepseekKey: string,
): Promise<string> {
  const res = await fetch("/api/ai/text", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-deepseek-key": deepseekKey,
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? `Classifier failed (${res.status})`);
  }

  const data = (await res.json()) as { text?: string };
  return data.text ?? "";
}
