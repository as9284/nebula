const controllers = new Map<string, AbortController>();

export function setStreamAbortController(
  conversationId: string,
  controller: AbortController,
): void {
  controllers.set(conversationId, controller);
}

export function clearStreamAbortController(conversationId: string): void {
  controllers.delete(conversationId);
}

export function abortConversationStream(conversationId: string): void {
  controllers.get(conversationId)?.abort();
  controllers.delete(conversationId);
}
