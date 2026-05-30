"use client";

import {
  buildCompactionPrompt,
  mergeCompactionSummaries,
  messagesToCompact,
  pickCompactionBoundaryMessageId,
  shouldCompactConversation,
} from "@nebula/core/conversation-compact";
import type { LlmConfig } from "@nebula/core/llm-config";
import type { ChatMessage, Conversation } from "@/types/chat";
import { completeText } from "@/lib/stream-client";
import { useLunaStore } from "@/stores/use-luna-store";
import { formatActionResultsForHistory } from "@/lib/action-result-history";
import type { ActionResult } from "@/lib/constellation-registry";

const compactionInFlight = new Set<string>();

function toCompactionMessages(
  messages: ChatMessage[],
  actionResults: Record<string, ActionResult[]>,
): { role: "user" | "assistant"; content: string }[] {
  return messages.map((m) => {
    let content = m.content;
    if (m.role === "assistant") {
      const executed = actionResults[m.id];
      if (executed?.length) {
        content += formatActionResultsForHistory(executed);
      }
    }
    return { role: m.role, content };
  });
}

export async function maybeCompactConversation(
  conversationId: string,
  llmConfig: LlmConfig,
  opts: {
    usageRatio: number;
    wasPruned: boolean;
  },
): Promise<void> {
  if (compactionInFlight.has(conversationId)) return;

  const state = useLunaStore.getState();
  const conv = state.conversations.find((c) => c.id === conversationId);
  if (!conv) return;

  if (
    !shouldCompactConversation(
      opts.usageRatio,
      opts.wasPruned,
      conv.messages.length,
    )
  ) {
    return;
  }

  const toSummarize = messagesToCompact(
    toCompactionMessages(conv.messages, state.actionResults),
  );
  if (toSummarize.length < 4) return;

  compactionInFlight.add(conversationId);
  try {
    const prompt = buildCompactionPrompt(toSummarize, conv.contextSummary);
    const summary = (await completeText(prompt, llmConfig)).trim();
    if (!summary || summary.length < 40) return;

    const merged = mergeCompactionSummaries(conv.contextSummary, summary);
    const boundaryId = pickCompactionBoundaryMessageId(conv.messages);
    if (!boundaryId) return;

    useLunaStore
      .getState()
      .setConversationCompaction(conversationId, merged, boundaryId);
  } catch {
    // Compaction is best-effort; chat still works with pruning.
  } finally {
    compactionInFlight.delete(conversationId);
  }
}

export function getConversationContextMeta(
  conv: Conversation | undefined,
  estimatedTokens: number,
  contextWindow: number,
): { label: string; usageRatio: number; hasSummary: boolean } {
  if (!conv) {
    return { label: "", usageRatio: 0, hasSummary: false };
  }
  const usageRatio = Math.min(1, estimatedTokens / contextWindow);
  const pct = Math.round(usageRatio * 100);
  const hasSummary = !!conv.contextSummary?.trim();
  let label =
    pct < 1 ? "<1% context" : pct >= 100 ? "Context full" : `${pct}% context`;
  if (hasSummary) label += " · compacted";
  return { label, usageRatio, hasSummary };
}
