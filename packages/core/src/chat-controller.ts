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
import type { LlmConfig } from "./llm-config";
import { isLlmConfigured } from "./llm-config";
import { streamChatModel, completeChatModel, searchWebDirect } from "./stream-api";
import { prepareChatContext } from "./context-budget";

export interface ChatControllerDeps {
  getLlmConfig: () => Promise<LlmConfig>;
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
  contextSummary?: string;
  compactedBeforeMessageId?: string;
  customInstructions?: string;
}

export async function runChatTurn(
  deps: ChatControllerDeps,
  input: SendChatInput,
): Promise<{
  assistantContent: string;
  actionResults: ActionResult[];
  newMemories: string[];
}> {
  const llmConfig = await deps.getLlmConfig();
  const tavilyKey = await deps.getTavilyKey();
  const searchProvider = deps.getSearchProvider();
  const searchAvailable = isWebSearchAvailable(searchProvider, tavilyKey);
  if (!isLlmConfigured(llmConfig)) {
    throw new Error("Model API key required. Add it in Settings.");
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
        (prompt) => completeChatModel(prompt, llmConfig),
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

  const rawHistory = input.messages
    .filter((m) => m.id !== input.assistantMessageId)
    .map((m) => {
      let content = m.content;
      if (m.role === "assistant") {
        const executed = input.actionResults[m.id];
        if (executed?.length) {
          content += formatActionResultsForHistory(executed);
        }
      }
      return {
        id: m.id,
        role: m.role as "user" | "assistant",
        content,
      };
    });

  for (let i = rawHistory.length - 1; i >= 0; i--) {
    if (rawHistory[i].role === "user") {
      rawHistory[i] = { ...rawHistory[i], content: userContent };
      break;
    }
  }

  const systemPrompt = buildLunaSystemPrompt(
    deps.getHandlers(),
    deps.getMemories(),
    deps.getLunaControls(),
    searchAvailable,
    { chatInstructions: input.customInstructions },
  );

  const prepared = prepareChatContext(rawHistory, {
    model: llmConfig.model,
    systemPrompt,
    contextSummary: input.contextSummary,
    compactedBeforeMessageId: input.compactedBeforeMessageId,
  });
  const history = prepared.messages;

  let streaming = false;
  const full = await streamChatModel(
    history,
    systemPrompt,
    llmConfig,
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
