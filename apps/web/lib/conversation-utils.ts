import type { Conversation } from "@/types/chat";

export function isConversationEmpty(
  conversation: Conversation | undefined,
): boolean {
  return !conversation || conversation.messages.length === 0;
}

export function isActiveConversationEmpty(state: {
  conversations: Conversation[];
  activeConversationId: string | null;
}): boolean {
  const active = state.conversations.find(
    (c) => c.id === state.activeConversationId,
  );
  return isConversationEmpty(active);
}
