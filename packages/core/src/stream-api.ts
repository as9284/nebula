import { DEEPSEEK_API_URL, DEEPSEEK_MODEL } from "./deepseek";
import type { SearchProvider, WebSearchResponse } from "./types/search";
import type { SearchTopic } from "./search-query";
import { searchWithBuiltin } from "./search-fallback";
import { searchWithTavily } from "./search-tavily";
import { formatSearchForModel } from "./search-format";

export interface StreamMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function streamDeepSeek(
  messages: StreamMessage[],
  systemPrompt: string,
  deepseekKey: string,
  signal: AbortSignal,
  onToken: (token: string) => void,
): Promise<string> {
  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${deepseekKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: true,
    }),
    signal,
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `DeepSeek request failed (${res.status})`);
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

export async function completeDeepSeek(
  prompt: string,
  deepseekKey: string,
): Promise<string> {
  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${deepseekKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [{ role: "user", content: prompt }],
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `DeepSeek request failed (${res.status})`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? "";
}

export async function searchWebDirect(
  query: string,
  provider: SearchProvider,
  tavilyKey: string,
  topic: SearchTopic = "general",
): Promise<WebSearchResponse> {
  if (provider === "tavily") {
    if (!tavilyKey.trim()) {
      throw new Error("Tavily API key required");
    }
    const { sources, answer } = await searchWithTavily(tavilyKey, query, topic);
    const formatted = formatSearchForModel(sources, answer);
    return { results: formatted || "No results found.", sources, answer };
  }

  const { sources } = await searchWithBuiltin(query, topic);
  const formatted = formatSearchForModel(sources);
  return {
    results: formatted || "No results found.",
    sources,
  };
}
