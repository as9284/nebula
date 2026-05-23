import type { LlmConfig } from "./llm-config";
import { migrateDeepseekKey } from "./llm-config";
import { completeLlm, streamLlm, type LlmMessage } from "./llm";
import type { SearchProvider, WebSearchResponse } from "./types/search";
import type { SearchTopic } from "./search-query";
import { searchWithBuiltin } from "./search-fallback";
import { searchWithTavily } from "./search-tavily";
import { formatSearchForModel } from "./search-format";

export interface StreamMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function streamChatModel(
  messages: StreamMessage[],
  systemPrompt: string,
  config: LlmConfig,
  signal: AbortSignal,
  onToken: (token: string) => void,
): Promise<string> {
  const llmMessages: LlmMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ];
  const result = await streamLlm(config, llmMessages, signal, {
    onContent: onToken,
  });
  return result.content;
}

export async function completeChatModel(
  prompt: string,
  config: LlmConfig,
): Promise<string> {
  return completeLlm(config, prompt);
}

/** @deprecated Use streamChatModel */
export async function streamDeepSeek(
  messages: StreamMessage[],
  systemPrompt: string,
  apiKey: string,
  signal: AbortSignal,
  onToken: (token: string) => void,
): Promise<string> {
  return streamChatModel(
    messages,
    systemPrompt,
    migrateDeepseekKey(apiKey),
    signal,
    onToken,
  );
}

/** @deprecated Use completeChatModel */
export async function completeDeepSeek(
  prompt: string,
  apiKey: string,
): Promise<string> {
  return completeChatModel(prompt, migrateDeepseekKey(apiKey));
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
