import type { ActionResult } from "./constellation-registry";
import type { StreamMessage } from "./stream-api";
import type { ChatMessage } from "./types/chat";
import type { SearchProvider } from "./types/search";
import type { LunaControls } from "./luna-prompt";
import type { Memory } from "./types/chat";
import type { ConstellationHandler } from "./constellation-registry";
import { buildLunaSystemPrompt } from "./luna-prompt";
import { decideWebSearch } from "./search-decision";
import { extractMemories } from "./memory";
import { formatActionResultsForHistory } from "./action-result-history";
import { buildSearchQuery } from "./search-query";
import { buildSearchContext } from "./search-decision";
import { isWebSearchAvailable } from "./search-provider";
import { streamDeepSeek, completeDeepSeek, searchWebDirect } from "./stream-api";

export interface ChatControllerDeps {
  getDeepseekKey: () => Promise<string>;
  getTavilyKey: () => Promise<string>;
  getSearchProvider: () => SearchProvider;
  getLunaControls: () => LunaControls;
  getMemories: () => Memory[];
  getHandlers: () => readonly ConstellationHandler[];
  executeSlash: (
    tag: string,
    commands: { command: string; args: Record<string, unknown> }[],
  ) => Promise<ActionResult[]>;
  executeCommandsFromResponse: (
    content: string,
  ) => Promise<{ cleaned: string; results: ActionResult[] }>;
  onToken: (token: string) => void;
  onPhase?: (phase: "searching" | "thinking" | "streaming") => void;
  signal: AbortSignal;
}

export interface SendChatInput {
  text: string;
  messages: ChatMessage[];
  assistantMessageId: string;
  userMessageId: string;
  actionResults: Record<string, ActionResult[]>;
}

export async function runChatTurn(
  deps: ChatControllerDeps,
  input: SendChatInput,
): Promise<{
  assistantContent: string;
  actionResults: ActionResult[];
  newMemories: string[];
}> {
  const deepseekKey = await deps.getDeepseekKey();
  const tavilyKey = await deps.getTavilyKey();
  const searchProvider = deps.getSearchProvider();
  const searchAvailable = isWebSearchAvailable(searchProvider, tavilyKey);
  if (!deepseekKey.trim()) {
    throw new Error("DeepSeek API key required");
  }

  let userContent = input.text;

  if (searchAvailable) {
    try {
      const recentContext = buildSearchContext(
        input.messages,
        input.userMessageId,
      );
      const decision = await decideWebSearch(
        input.text,
        (prompt) => completeDeepSeek(prompt, deepseekKey),
        recentContext,
      );
      if (decision.search) {
        deps.onPhase?.("searching");
        const { query: searchQuery, topic } = buildSearchQuery(decision.query);
        const mergedTopic =
          decision.topic === "news" || topic === "news" ? "news" : topic;
        const search = await searchWebDirect(
          searchQuery,
          searchProvider,
          tavilyKey,
          mergedTopic,
        );
        if (search.sources.length > 0) {
          userContent = `[Web search results]\n${search.results}\n\n[User question]\n${input.text}`;
        }
      }
    } catch {
      // continue without search
    }
  }

  deps.onPhase?.("thinking");

  const history: StreamMessage[] = input.messages
    .filter((m) => m.id !== input.assistantMessageId)
    .map((m) => {
      let content = m.content;
      if (m.role === "assistant") {
        const executed = input.actionResults[m.id];
        if (executed?.length) {
          content += formatActionResultsForHistory(executed);
        }
      }
      return { role: m.role as "user" | "assistant", content };
    });

  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === "user") {
      history[i] = { ...history[i], content: userContent };
      break;
    }
  }

  const systemPrompt = buildLunaSystemPrompt(
    deps.getHandlers(),
    deps.getMemories(),
    deps.getLunaControls(),
    searchAvailable,
  );

  let streaming = false;
  const full = await streamDeepSeek(
    history,
    systemPrompt,
    deepseekKey,
    deps.signal,
    (token) => {
      if (!streaming) {
        streaming = true;
        deps.onPhase?.("streaming");
      }
      deps.onToken(token);
    },
  );

  const { cleaned, results } = await deps.executeCommandsFromResponse(full);
  const newMemories = extractMemories(input.text);

  return {
    assistantContent: cleaned || full,
    actionResults: results,
    newMemories,
  };
}
