import { useLunaStore } from "@/stores/use-luna-store";
import { useNotificationStore } from "@/stores/use-notification-store";

function shouldNotifyConversationComplete(conversationId: string): boolean {
  const activeId = useLunaStore.getState().activeConversationId;
  return activeId !== conversationId;
}

export function notifyConversationComplete(conversationId: string) {
  if (!shouldNotifyConversationComplete(conversationId)) return;

  const conv = useLunaStore
    .getState()
    .conversations.find((c) => c.id === conversationId);
  if (!conv) return;

  const lastAssistant = [...conv.messages]
    .reverse()
    .find((m) => m.role === "assistant");
  const preview = lastAssistant?.content.trim().slice(0, 140);
  const body = preview
    ? preview + (lastAssistant && lastAssistant.content.length > 140 ? "…" : "")
    : "Luna finished responding.";

  useNotificationStore.getState().push({
    title: `Luna · ${conv.title}`,
    body,
    conversationId,
  });
}
