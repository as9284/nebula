"use client";

import { useRef, useCallback } from "react";
import { useLunaStore } from "@/stores/use-luna-store";
import { useSettingsStore } from "@/stores/use-settings-store";
import { buildLunaSystemPrompt } from "@/lib/luna-prompt";
import { constellationHandlers } from "@/lib/constellations";
import { streamChat, searchWeb } from "@/lib/stream-client";
import { executeCommandsFromResponse } from "@/lib/commands";
import { extractMemories } from "@/lib/memory";
import { slashToParsedCommands } from "@/lib/slash-commands";
import { generateId } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";
import { getSandboxPayload } from "@/lib/constellations/sandbox";
import type { StreamMessage } from "@/lib/stream-client";
import { buildSearchQuery } from "@/lib/search-query";

function buildChatHistory(
  messages: ChatMessage[],
  excludeMessageId: string,
  latestUserContent: string,
): StreamMessage[] {
  const history = messages
    .filter((m) => m.id !== excludeMessageId)
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === "user") {
      history[i] = { ...history[i], content: latestUserContent };
      break;
    }
  }

  return history;
}

export function useChat() {
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text) return;

      const { deepseekKey, tavilyKey, webSearchEnabled, lunaControls } =
        useSettingsStore.getState();
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
      useLunaStore.getState().setStreaming(true);

      const willSearch = webSearchEnabled && !!tavilyKey;
      useLunaStore
        .getState()
        .setStreamPhase(willSearch ? "searching" : "thinking");

      const slash = text.startsWith("/") ? slashToParsedCommands(text) : null;

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
          useLunaStore.getState().setStreaming(false);
          useLunaStore.getState().setStreamPhase("idle");
          return;
        }

        let userContent = text;
        if (willSearch) {
          try {
            const { query: searchQuery, topic } = buildSearchQuery(text);
            const search = await searchWeb(searchQuery, tavilyKey, topic);
            if (search.sources.length > 0) {
              useLunaStore
                .getState()
                .setMessageSources(convId, assistantId, search.sources);
            }
            userContent = `[Web search results]\n${search.results}\n\n[User question]\n${text}`;
          } catch {
            // continue without search
          }
          useLunaStore.getState().setStreamPhase("thinking");
        }

        const conv = useLunaStore
          .getState()
          .conversations.find((c) => c.id === convId);
        const history = conv
          ? buildChatHistory(conv.messages, assistantId, userContent)
          : [];

        const systemPrompt = buildLunaSystemPrompt(
          constellationHandlers,
          useLunaStore.getState().memories,
          lunaControls,
          webSearchEnabled,
        );

        abortRef.current = new AbortController();
        let hasReceivedToken = false;
        const full = await streamChat(
          history,
          systemPrompt,
          deepseekKey,
          abortRef.current.signal,
          (token) => {
            if (!hasReceivedToken) {
              hasReceivedToken = true;
              useLunaStore.getState().setStreamPhase("streaming");
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
        useLunaStore.getState().setStreaming(false);
        useLunaStore.getState().setStreamPhase("idle");
        abortRef.current = null;
      }
    },
    [],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    useLunaStore.getState().setStreaming(false);
    useLunaStore.getState().setStreamPhase("idle");
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
