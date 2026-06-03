"use client";

import { useCallback } from "react";
import { useLunaStore } from "@/stores/use-luna-store";
import { useSettingsStore } from "@/stores/use-settings-store";
import { buildLunaSystemPrompt } from "@/lib/luna-prompt";
import { constellationHandlers } from "@/lib/constellations";
import { buildSearchContext, decideWebSearch } from "@/lib/search-decision";
import { isWebSearchAvailable } from "@/lib/search-provider";
import { isLlmConfigured, isLoopbackUrl } from "@nebula/core/llm-config";
import {
  buildVisionParts,
  formatAttachmentsForDisplay,
  modelSupportsVision,
  toMessageImages,
  type ChatAttachment,
} from "@/lib/chat-attachments";
import { describeImagesForChat } from "@/lib/describe-images-client";
import { resolveVisionHelperConfig } from "@nebula/core/vision-support";
import { completeText, searchWeb, streamChat } from "@/lib/stream-client";
import { executeCommandsFromResponse } from "@/lib/commands";
import {
  extractArtifactsFromResponse,
  stripAssistantDisplayContent,
  uiArtifactActionResults,
} from "@/lib/artifact-processing";
import {
  extractExportsFromResponse,
  fileExportActionResults,
} from "@/lib/export-processing";
import { resolveExportDisplayMessage } from "@nebula/core/export-display";
import { flushSync } from "react-dom";
import { extractMemories } from "@/lib/memory";
import { slashToParsedCommands } from "@/lib/slash-commands";
import { generateId } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";
import { getSandboxPayload } from "@/lib/constellations/sandbox";
import type { StreamMessage } from "@/lib/stream-client";
import { buildSearchQuery } from "@/lib/search-query";
import { formatActionResultsForHistory } from "@/lib/action-result-history";
import type { ActionResult } from "@/lib/constellation-registry";
import type { CodeArtifact } from "@/types/chat";
import {
  abortConversationStream,
  clearStreamAbortController,
  setStreamAbortController,
} from "@/lib/chat-stream-registry";
import { notifyConversationComplete } from "@/lib/notifications";
import { flushCloudSync } from "@/lib/cloud-sync";
import {
  inferStreamPhase,
  startStreamWatchdog,
} from "@/lib/chat-stream-feedback";
import {
  prepareChatContext,
  type HistoryMessage,
} from "@nebula/core/context-budget";
import { maybeCompactConversation } from "@/lib/conversation-compact-runner";

function buildChatHistory(
  messages: ChatMessage[],
  excludeMessageId: string,
  latestUserContent: string,
  actionResults: Record<string, ActionResult[]>,
): HistoryMessage[] {
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
        id: m.id,
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
  const sendMessage = useCallback(
    async (rawText: string, attachments?: ChatAttachment[]) => {
      const text = rawText.trim();
      const attachmentBlock = attachments?.length
        ? formatAttachmentsForDisplay(attachments)
        : "";
      const displayContent = [text, attachmentBlock].filter(Boolean).join("");
      if (!displayContent.trim()) return;

      const {
        llmConfig,
        tavilyKey,
        searchProvider,
        lunaControls,
        visionHelperConfig,
      } = useSettingsStore.getState();
      const searchAvailable = isWebSearchAvailable(searchProvider, tavilyKey);
      if (!isLlmConfigured(llmConfig)) return;

      const imageAttachments =
        attachments?.filter((a) => a.kind === "image") ?? [];
      const useNativeVision =
        imageAttachments.length > 0 && modelSupportsVision(llmConfig);
      const visionParts = useNativeVision
        ? buildVisionParts(attachments!, llmConfig.provider)
        : undefined;

      let convId = useLunaStore.getState().activeConversationId;
      if (!convId) {
        convId = useLunaStore.getState().createConversation();
      }

      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content: displayContent,
        images: toMessageImages(attachments),
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

      const slash =
        text.startsWith("/") && !attachments?.length
          ? slashToParsedCommands(text)
          : null;
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

        let userContent = displayContent;

        if (imageAttachments.length > 0 && !useNativeVision) {
          const helper = resolveVisionHelperConfig(
            llmConfig,
            visionHelperConfig,
          );
          const messageImages = toMessageImages(attachments);
          if (helper && messageImages?.length) {
            try {
              useLunaStore
                .getState()
                .setConversationStreamPhase(convId, "describing");
              const described = await describeImagesForChat(
                messageImages,
                helper,
              );
              if (described) {
                userContent = [displayContent, described]
                  .filter(Boolean)
                  .join("\n\n");
              }
            } catch (e) {
              userContent = `${displayContent}\n\n[Could not describe image(s): ${(e as Error).message}. Add a vision-capable helper model in Settings → AI model.]`;
            }
          } else if (messageImages?.length) {
            userContent = `${displayContent}\n\n[Images attached, but no vision helper is available for this endpoint. Use a vision-capable chat model or configure a vision helper in Settings.]`;
          }
        }

        if (searchAvailable) {
          try {
            const convForSearch = useLunaStore
              .getState()
              .conversations.find((c) => c.id === convId);
            const recentContext = convForSearch
              ? buildSearchContext(convForSearch.messages, userMsg.id)
              : undefined;

            const decision = await decideWebSearch(
              displayContent,
              (prompt) => completeText(prompt, llmConfig),
              recentContext,
            );

            if (decision.search) {
              useLunaStore
                .getState()
                .setConversationStreamPhase(convId, "searching");
              const { query: searchQuery, topic } = buildSearchQuery(
                decision.query,
              );
              const mergedTopic =
                decision.topic === "news" || topic === "news" ? "news" : topic;

              const search = await searchWeb(
                searchQuery,
                searchProvider,
                tavilyKey,
                mergedTopic,
              );
              if (search.sources.length > 0) {
                useLunaStore
                  .getState()
                  .setMessageSources(convId, assistantId, search.sources);
                userContent = `[Web search results]\n${search.results}\n\n[User question]\n${displayContent}`;
              }
            }
          } catch {
            // continue without search
          }
          useLunaStore
            .getState()
            .setConversationStreamPhase(convId, "thinking");
        }

        const state = useLunaStore.getState();
        const conv = state.conversations.find((c) => c.id === convId);
        const rawHistory = conv
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
          {
            localModel: isLoopbackUrl(llmConfig.baseUrl),
            chatInstructions: conv?.customInstructions,
          },
        );

        const prepared = prepareChatContext(rawHistory, {
          model: llmConfig.model,
          systemPrompt,
          contextSummary: conv?.contextSummary,
          compactedBeforeMessageId: conv?.compactedBeforeMessageId,
        });
        const history = prepared.messages;

        useLunaStore.getState().setConversationContextUsage(convId, {
          estimatedTokens: prepared.estimatedTokens,
          contextWindow: prepared.contextWindow,
          usageRatio: prepared.usageRatio,
        });

        const abortController = new AbortController();
        setStreamAbortController(convId, abortController);
        const watchdog = startStreamWatchdog({
          getAbortController: () => abortController,
          onStatusHint: (hint) =>
            useLunaStore.getState().setConversationStreamStatusHint(convId, hint),
        });
        let hasReceivedContent = false;
        let rawContent = "";
        let rawThinking = "";
        try {
          const streamed = await streamChat(
            history,
            systemPrompt,
            llmConfig,
            abortController.signal,
            {
              onContent: (token) => {
                watchdog.touch();
                rawContent += token;
                const display = stripAssistantDisplayContent(
                  rawContent,
                  constellationHandlers,
                );
                const phase = inferStreamPhase(rawContent, display);
                if (!hasReceivedContent && display.trim().length > 0) {
                  hasReceivedContent = true;
                }
                flushSync(() => {
                  useLunaStore
                    .getState()
                    .setConversationStreamPhase(convId, phase);
                  useLunaStore
                    .getState()
                    .updateMessageContent(convId, assistantId, display);
                });
              },
              onReasoning: (token) => {
                watchdog.touch();
                rawThinking += token;
                const display = stripAssistantDisplayContent(
                  rawContent,
                  constellationHandlers,
                );
                flushSync(() => {
                  useLunaStore
                    .getState()
                    .setConversationStreamPhase(
                      convId,
                      inferStreamPhase(rawContent, display),
                    );
                  useLunaStore
                    .getState()
                    .setMessageThinking(convId, assistantId, rawThinking);
                });
              },
            },
            visionParts ? { visionParts } : undefined,
          );

          const fullRaw = rawContent || streamed.content;
          const { artifacts, artifactErrors } =
            extractArtifactsFromResponse(fullRaw);
          const { exports: fileExports, exportErrors } =
            extractExportsFromResponse(fullRaw, displayContent);
          const { cleaned, results } =
            await executeCommandsFromResponse(fullRaw);
          let assistantDisplay = stripAssistantDisplayContent(
            cleaned || fullRaw,
            constellationHandlers,
          );
          assistantDisplay = resolveExportDisplayMessage(
            assistantDisplay,
            fileExports,
          );
          useLunaStore
            .getState()
            .updateMessageContent(convId, assistantId, assistantDisplay);
          const commandArtifacts = results
            .filter((r) => r.type === "ui_artifact" && r.artifact)
            .map((r) => r.artifact as CodeArtifact);
          const mergedArtifacts = [
            ...artifacts,
            ...commandArtifacts.filter(
              (ca) => !artifacts.some((a) => a.id === ca.id),
            ),
          ];
          if (mergedArtifacts.length) {
            useLunaStore
              .getState()
              .setMessageArtifacts(convId, assistantId, mergedArtifacts);
          }
          if (streamed.thinking) {
            useLunaStore
              .getState()
              .setMessageThinking(convId, assistantId, streamed.thinking);
          }
          const allResults = [
            ...results,
            ...artifactErrors,
            ...exportErrors,
            ...uiArtifactActionResults(artifacts),
            ...fileExportActionResults(fileExports),
          ];
          if (allResults.length) {
            useLunaStore.getState().setActionResults(assistantId, allResults);
          }

          const memoryHandledByCommand = results.some(
            (r) => r.type === "memory_saved",
          );
          if (!memoryHandledByCommand) {
            const newMemories = extractMemories(displayContent);
            if (newMemories.length) {
              useLunaStore.getState().addMemories(newMemories);
            }
          }
          completedSuccessfully = true;
          void maybeCompactConversation(convId, llmConfig, {
            usageRatio: prepared.usageRatio,
            wasPruned: prepared.wasPruned,
          });
        } finally {
          watchdog.stop();
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") {
          const hint =
            useLunaStore.getState().streamingByConversationId[convId]
              ?.statusHint;
          const msg = useLunaStore
            .getState()
            .conversations.find((c) => c.id === convId)
            ?.messages.find((m) => m.id === assistantId);
          if (hint && !msg?.content.trim()) {
            useLunaStore
              .getState()
              .updateMessageContent(convId, assistantId, hint);
          }
        } else {
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
        if (completedSuccessfully) {
          notifyConversationComplete(convId);
        }
      }
    },
    [],
  );

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

  const editAndResend = useCallback(
    async (messageId: string, newContent: string) => {
      const conv = useLunaStore.getState().getActiveConversation();
      if (!conv) return;
      const trimmed = newContent.trim();
      if (!trimmed) return;
      useLunaStore.getState().truncateFromMessage(conv.id, messageId);
      await sendMessage(trimmed);
    },
    [sendMessage],
  );

  return {
    sendMessage,
    stop,
    regenerate,
    editAndResend,
    sandboxOpen: !!getSandboxPayload(),
  };
}
