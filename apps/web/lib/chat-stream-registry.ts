/** Per-conversation abort handles for background streams. */
const abortControllers = new Map<string, AbortController>();

export function setStreamAbortController(
  conversationId: string,
  controller: AbortController,
) {
  abortControllers.get(conversationId)?.abort();
  abortControllers.set(conversationId, controller);
}

export function abortConversationStream(conversationId: string) {
  abortControllers.get(conversationId)?.abort();
  abortControllers.delete(conversationId);
}

export function clearStreamAbortController(conversationId: string) {
  abortControllers.delete(conversationId);
}
