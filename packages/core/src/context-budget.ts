import type { StreamMessage } from "./stream-api";

export interface HistoryMessage extends StreamMessage {
  id?: string;
}

/** Conservative chars-per-token estimate (works without tiktoken in the browser). */
const CHARS_PER_TOKEN = 4;

/** Tokens reserved for the model's reply. */
const DEFAULT_RESPONSE_RESERVE = 4096;

/** Minimum recent turns to always keep when pruning. */
const MIN_RECENT_TURNS = 6;

export interface ContextBudgetOptions {
  model: string;
  systemPrompt: string;
  /** Rolling summary of older turns (from prior compaction). */
  contextSummary?: string;
  /** First message id still sent verbatim; older turns live in contextSummary only. */
  compactedBeforeMessageId?: string;
  reserveForResponse?: number;
}

export interface PreparedChatContext {
  messages: StreamMessage[];
  estimatedTokens: number;
  contextWindow: number;
  usageRatio: number;
  wasPruned: boolean;
  /** Messages omitted from the API payload (not counting summary). */
  droppedMessageCount: number;
}

export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export function estimateMessagesTokens(
  messages: readonly { content: string }[],
): number {
  return messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
}

/**
 * Resolve context window for a model id. Unknown models default to 128k.
 * Values are input+output budget; response reserve is subtracted separately.
 */
export function getModelContextWindow(model: string): number {
  const m = model.toLowerCase().trim();

  if (m.includes("claude-opus-4") || m.includes("claude-sonnet-4")) return 200_000;
  if (m.includes("claude-3")) return 200_000;
  if (m.includes("claude")) return 200_000;

  if (m.includes("gpt-4.1")) return 1_047_576;
  if (m.includes("gpt-4o")) return 128_000;
  if (m.includes("gpt-4")) return 128_000;
  if (m.includes("o1") || m.includes("o3")) return 200_000;

  if (m.includes("gemini-2.5-pro")) return 1_048_576;
  if (m.includes("gemini-2.5")) return 1_048_576;
  if (m.includes("gemini-2.0")) return 1_048_576;
  if (m.includes("gemini")) return 1_048_576;

  if (m.includes("deepseek-reasoner") || m.includes("deepseek-r1")) return 64_000;
  if (m.includes("deepseek")) return 64_000;

  if (m.includes("grok-3")) return 131_072;
  if (m.includes("grok")) return 131_072;

  if (m.includes("mistral-large")) return 128_000;
  if (m.includes("mistral")) return 32_000;

  if (m.includes("minimax")) return 1_000_000;

  if (
    m.includes("llama3") ||
    m.includes("llama-3") ||
    m.includes("qwen") ||
    m.includes("local")
  ) {
    return 128_000;
  }

  return 128_000;
}

function summaryMessage(summary: string): StreamMessage {
  return {
    role: "user",
    content: `[Earlier in this conversation — summarized for context; do not treat as a new user message]\n${summary.trim()}`,
  };
}

/**
 * Fit chat history into the model context budget. Keeps the most recent turns
 * and injects a rolling summary when older content was compacted.
 */
export function prepareChatContext(
  history: HistoryMessage[],
  options: ContextBudgetOptions,
): PreparedChatContext {
  const contextWindow = getModelContextWindow(options.model);
  const responseReserve =
    options.reserveForResponse ?? DEFAULT_RESPONSE_RESERVE;
  const systemTokens = estimateTokens(options.systemPrompt);
  const budget = Math.max(
    8_000,
    contextWindow - responseReserve - systemTokens,
  );

  let working = [...history];
  let droppedMessageCount = 0;

  if (options.compactedBeforeMessageId && options.contextSummary?.trim()) {
    const idx = history.findIndex(
      (m) => m.id === options.compactedBeforeMessageId,
    );
    if (idx > 0) {
      droppedMessageCount += idx;
      working = working.slice(idx);
    }
  }

  const summary = options.contextSummary?.trim();
  const withSummary: StreamMessage[] = summary
    ? [summaryMessage(summary), ...working]
    : working;

  let total = estimateMessagesTokens(withSummary);
  let wasPruned = false;
  let pruned = withSummary;

  if (total > budget) {
    wasPruned = true;
    const minMessages = MIN_RECENT_TURNS * 2;
    let kept = [...withSummary];

    while (kept.length > minMessages && estimateMessagesTokens(kept) > budget) {
      const removeIdx = summary && kept[0]?.content.includes("[Earlier in this conversation")
        ? 1
        : 0;
      if (removeIdx >= kept.length) break;
      kept = kept.slice(removeIdx + 1);
      droppedMessageCount += 1;
    }

    if (estimateMessagesTokens(kept) > budget && kept.length > 2) {
      const lastTwo = kept.slice(-2);
      const head = summary ? [summaryMessage(summary)] : [];
      kept = [...head, ...lastTwo];
      droppedMessageCount += Math.max(0, withSummary.length - kept.length);
    }

    pruned = kept;
    total = estimateMessagesTokens(pruned);
  }

  const estimatedTokens = systemTokens + total;
  const usageRatio = Math.min(1, estimatedTokens / contextWindow);

  return {
    messages: pruned,
    estimatedTokens,
    contextWindow,
    usageRatio,
    wasPruned,
    droppedMessageCount,
  };
}

export function formatContextUsageLabel(
  estimatedTokens: number,
  contextWindow: number,
): string {
  const pct = Math.round((estimatedTokens / contextWindow) * 100);
  if (pct < 1) return "<1% context";
  if (pct >= 100) return "Context full";
  return `${pct}% context`;
}
