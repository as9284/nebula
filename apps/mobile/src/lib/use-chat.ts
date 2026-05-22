import { useCallback } from "react";
import {
  buildLunaSystemPrompt,
  decideWebSearch,
  extractMemories,
  formatActionResultsForHistory,
  generateId,
  getSecretsAdapter,
  isWebSearchAvailable,
  searchWebDirect,
  streamDeepSeek,
  completeDeepSeek,
  buildSearchQuery,
  slashToParsedCommands,
  type StreamMessage,
} from "@nebula/core";
import type { ChatMessage } from "@nebula/core/types/chat";
import type { ActionResult } from "@nebula/core/constellation-registry";
import { buildSearchContext } from "@nebula/core/search-decision";
import { useLunaStore } from "@/stores/use-luna-store";
import { useSettingsStore } from "@/stores/use-settings-store";
import { constellationHandlers } from "@/lib/constellations";
import { executeCommandsFromResponse } from "@/lib/commands";
import {
  abortConversationStream,
  clearStreamAbortController,
  setStreamAbortController,
} from "@/lib/chat-stream-registry";
import { flushCloudSync } from "@/lib/cloud-sync";
import { getSandboxPayload } from "@/lib/constellations/sandbox";

function buildChatHistory(
  messages: ChatMessage[],
  excludeMessageId: string,
  latestUserContent: string,
  actionResults: Record<string, ActionResult[]>,
): StreamMessage[] {
  const history = messages
    .filter((m) => m.id !== excludeMessageId)
    .map((m) => {
      let content = m.content;
      if (m.role === "assistant") {
        const executed = actionResults[m.id];
        if (executed?.length) {
          content += formatActionResultsForHistory(executed);
        }
      }
      return {
        role: m.role as "user" | "assistant",
        content,
      };
    });

  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === "user") {
      history[i] = { ...history[i], content: latestUserContent };
      break;
    }
  }

  return history;
}

export function useChat() {
  const sendMessage = useCallback(async (rawText: string) => {
    const text = rawText.trim();
    if (!text) return;

    const secrets = getSecretsAdapter();
    const deepseekKey = await secrets.getDeepseekKey();
    const tavilyKey = await secrets.getTavilyKey();
    const { searchProvider, lunaControls } = useSettingsStore.getState();
    const searchAvailable = isWebSearchAvailable(searchProvider, tavilyKey);
    if (!deepseekKey) return;

    let convId = useLunaStore.getState().activeConversationId;
    if (!convId) {
      convId = useLunaStore.getState().createConversation();
    }

    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };
    useLunaStore.getState().addMessage(convId, userMsg);
    useLunaStore.getState().setDraftMessage("");

    const assistantId = generateId();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: Date.now(),
    };
    useLunaStore.getState().addMessage(convId, assistantMsg);
    useLunaStore
      .getState()
      .startConversationStream(convId, assistantId, "thinking");

    const slash = text.startsWith("/") ? slashToParsedCommands(text) : null;
    let completedSuccessfully = false;

    try {
      if (slash) {
        const handler = constellationHandlers.find((h) => h.tag === slash.tag);
        if (handler) {
          const results = await handler.execute(slash.commands);
          useLunaStore.getState().setActionResults(assistantId, results);
          useLunaStore
            .getState()
            .updateMessageContent(
              convId,
              assistantId,
              "Done — see the result below.",
            );
        }
        useLunaStore.getState().endConversationStream(convId);
        return;
      }

      let userContent = text;

      if (searchAvailable) {
        try {
          const convForSearch = useLunaStore
            .getState()
            .conversations.find((c) => c.id === convId);
          const recentContext = convForSearch
            ? buildSearchContext(convForSearch.messages, userMsg.id)
            : undefined;

          const decision = await decideWebSearch(
            text,
            (prompt) => completeDeepSeek(prompt, deepseekKey),
            recentContext,
          );

          if (decision.search) {
            useLunaStore
              .getState()
              .setConversationStreamPhase(convId, "searching");
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
              useLunaStore
                .getState()
                .setMessageSources(convId, assistantId, search.sources);
              userContent = `[Web search results]\n${search.results}\n\n[User question]\n${text}`;
            }
          }
        } catch {
          // continue without search
        }
        useLunaStore.getState().setConversationStreamPhase(convId, "thinking");
      }

      const state = useLunaStore.getState();
      const conv = state.conversations.find((c) => c.id === convId);
      const history = conv
        ? buildChatHistory(
            conv.messages,
            assistantId,
            userContent,
            state.actionResults,
          )
        : [];

      const systemPrompt = buildLunaSystemPrompt(
        constellationHandlers,
        state.memories,
        lunaControls,
        searchAvailable,
      );

      const abortController = new AbortController();
      setStreamAbortController(convId, abortController);
      let hasReceivedToken = false;
      const full = await streamDeepSeek(
        history,
        systemPrompt,
        deepseekKey,
        abortController.signal,
        (token) => {
          if (!hasReceivedToken) {
            hasReceivedToken = true;
            useLunaStore
              .getState()
              .setConversationStreamPhase(convId, "streaming");
          }
          const current = useLunaStore
            .getState()
            .conversations.find((c) => c.id === convId)
            ?.messages.find((m) => m.id === assistantId);
          useLunaStore
            .getState()
            .updateMessageContent(
              convId,
              assistantId,
              (current?.content ?? "") + token,
            );
        },
      );

      const { cleaned, results } = await executeCommandsFromResponse(full);
      useLunaStore
        .getState()
        .updateMessageContent(convId, assistantId, cleaned || full);
      if (results.length) {
        useLunaStore.getState().setActionResults(assistantId, results);
      }

      const newMemories = extractMemories(text);
      if (newMemories.length) {
        useLunaStore.getState().addMemories(newMemories);
      }
      completedSuccessfully = true;
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        useLunaStore
          .getState()
          .updateMessageContent(
            convId,
            assistantId,
            `Something went wrong: ${(e as Error).message}`,
          );
      }
    } finally {
      useLunaStore.getState().endConversationStream(convId);
      clearStreamAbortController(convId);
      void flushCloudSync();
      void completedSuccessfully;
    }
  }, []);

  const stop = useCallback(() => {
    const convId = useLunaStore.getState().activeConversationId;
    if (!convId) return;
    abortConversationStream(convId);
    useLunaStore.getState().endConversationStream(convId);
  }, []);

  const regenerate = useCallback(async () => {
    const conv = useLunaStore.getState().getActiveConversation();
    if (!conv) return;
    const msgs = conv.messages;
    const lastUserIdx = [...msgs]
      .map((m, i) => ({ m, i }))
      .filter(({ m }) => m.role === "user")
      .pop()?.i;
    if (lastUserIdx === undefined) return;
    const lastUser = msgs[lastUserIdx];
    useLunaStore.getState().truncateFromMessage(conv.id, lastUser.id);
    await sendMessage(lastUser.content);
  }, [sendMessage]);

  return { sendMessage, stop, regenerate, sandboxOpen: !!getSandboxPayload() };
}
