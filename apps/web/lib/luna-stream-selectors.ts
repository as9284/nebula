import type { StreamPhase } from "@/stores/use-luna-store";

type StreamSlice = {
  activeConversationId: string | null;
  streamingByConversationId: Record<
    string,
    {
      phase: Exclude<StreamPhase, "idle">;
      assistantMessageId: string;
      statusHint?: string | null;
    }
  >;
};

export function isConversationStreaming(
  state: StreamSlice,
  conversationId: string | null | undefined,
): boolean {
  if (!conversationId) return false;
  return conversationId in state.streamingByConversationId;
}

export function getConversationStreamPhase(
  state: StreamSlice,
  conversationId: string | null | undefined,
): StreamPhase {
  if (!conversationId) return "idle";
  return state.streamingByConversationId[conversationId]?.phase ?? "idle";
}

export function getActiveStreamAssistantMessageId(
  state: StreamSlice,
): string | null {
  const id = state.activeConversationId;
  if (!id) return null;
  return state.streamingByConversationId[id]?.assistantMessageId ?? null;
}

export function getConversationStreamStatusHint(
  state: StreamSlice,
  conversationId: string | null | undefined,
): string | null {
  if (!conversationId) return null;
  const hint = state.streamingByConversationId[conversationId]?.statusHint;
  return hint?.trim() ? hint : null;
}
