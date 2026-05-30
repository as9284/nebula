import {
  estimateMessagesTokens,
  estimateTokens,
  getModelContextWindow,
  prepareChatContext,
  type ContextBudgetOptions,
} from "./context-budget";
import type { StreamMessage } from "./stream-api";

export const COMPACTION_THRESHOLD = 0.68;

export interface CompactionMessage {
  role: "user" | "assistant";
  content: string;
}

export function shouldCompactConversation(
  usageRatio: number,
  wasPruned: boolean,
  messageCount: number,
): boolean {
  if (messageCount < 8) return false;
  return wasPruned || usageRatio >= COMPACTION_THRESHOLD;
}

export function buildCompactionPrompt(
  messages: CompactionMessage[],
  existingSummary?: string,
): string {
  const transcript = messages
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n\n");

  const prior = existingSummary?.trim()
    ? `\n\nPrior summary of even older messages:\n${existingSummary.trim()}`
    : "";

  return `You are compressing a long chat for context retention. Produce a dense factual summary the assistant can use later.

Rules:
- Preserve names, dates, numbers, decisions, preferences, open questions, and commitments
- Preserve tool/action outcomes (tasks created, files exported, memories saved)
- Do NOT invent facts; only summarize what appears in the transcript
- Use bullet points; max 1200 words
- Write in third person ("The user asked…", "Luna suggested…")
${prior}

Transcript to summarize:
${transcript}`;
}

/** Merge a new compaction pass with an existing rolling summary. */
export function mergeCompactionSummaries(
  existing: string | undefined,
  fresh: string,
): string {
  const a = existing?.trim();
  const b = fresh.trim();
  if (!a) return b;
  if (!b) return a;
  const combined = `${a}\n\n---\n\n${b}`;
  const maxChars = 12_000;
  if (combined.length <= maxChars) return combined;
  return combined.slice(combined.length - maxChars);
}

export function messagesToCompact(
  allMessages: CompactionMessage[],
  keepRecentTurns = 8,
): CompactionMessage[] {
  const keepCount = keepRecentTurns * 2;
  if (allMessages.length <= keepCount) return [];
  return allMessages.slice(0, allMessages.length - keepCount);
}

export function pickCompactionBoundaryMessageId(
  messages: { id: string }[],
  keepRecentTurns = 8,
): string | undefined {
  const keepCount = keepRecentTurns * 2;
  if (messages.length <= keepCount) return undefined;
  const boundaryIdx = messages.length - keepCount;
  return messages[boundaryIdx]?.id;
}

export function estimateFullTurnTokens(
  history: StreamMessage[],
  systemPrompt: string,
  model: string,
  options?: Pick<ContextBudgetOptions, "contextSummary" | "compactedBeforeMessageId">,
): { estimatedTokens: number; contextWindow: number; usageRatio: number } {
  const prepared = prepareChatContext(history, {
    model,
    systemPrompt,
    contextSummary: options?.contextSummary,
    compactedBeforeMessageId: options?.compactedBeforeMessageId,
  });
  return {
    estimatedTokens: prepared.estimatedTokens,
    contextWindow: prepared.contextWindow,
    usageRatio: prepared.usageRatio,
  };
}

export function compactionNeededBySize(
  messages: CompactionMessage[],
  systemPrompt: string,
  model: string,
): boolean {
  const tokens =
    estimateTokens(systemPrompt) + estimateMessagesTokens(messages);
  const window = getModelContextWindow(model);
  return tokens / window >= COMPACTION_THRESHOLD;
}
