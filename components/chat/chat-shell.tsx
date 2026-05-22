"use client";

import { useState, useCallback } from "react";
import { ThreadSidebar } from "./thread-sidebar";
import { MessageList } from "./message-list";
import { ChatComposer } from "./chat-composer";
import { SettingsModal } from "./settings-modal";
import { ConstellationsModal } from "./constellations-modal";
import { SandboxPanel } from "./sandbox-panel";
import { Dock } from "./dock";
import { useChat } from "@/lib/use-chat";
import { useStoresHydrated } from "@/lib/use-stores-hydrated";
import { useLunaStore } from "@/stores/use-luna-store";
import { isActiveConversationEmpty } from "@/lib/conversation-utils";
import { ChatShellSkeleton } from "./chat-shell-skeleton";
import { NebulaToasts } from "@/components/ui/nebula-toasts";

export function ChatShell() {
  const storesHydrated = useStoresHydrated();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [orbitOpen, setOrbitOpen] = useState(false);
  const { sendMessage, stop, regenerate } = useChat();
  const setDraft = useLunaStore((s) => s.setDraftMessage);
  const truncateFromMessage = useLunaStore((s) => s.truncateFromMessage);
  const createConversation = useLunaStore((s) => s.createConversation);
  const activeConversationId = useLunaStore((s) => s.activeConversationId);
  const conversations = useLunaStore((s) => s.conversations);
  const newChatDisabled = isActiveConversationEmpty({
    conversations,
    activeConversationId,
  });

  const handleSuggest = useCallback(
    (text: string) => {
      void sendMessage(text);
    },
    [sendMessage],
  );

  const handleEditUser = useCallback(
    (content: string) => {
      const conv = useLunaStore.getState().getActiveConversation();
      if (!conv) return;
      const msg = [...conv.messages].reverse().find((m) => m.role === "user");
      if (!msg) return;
      truncateFromMessage(conv.id, msg.id);
      setDraft(content);
    },
    [truncateFromMessage, setDraft],
  );

  const handleNewChat = useCallback(() => {
    if (isActiveConversationEmpty(useLunaStore.getState())) return;
    createConversation();
    setSidebarOpen(false);
  }, [createConversation]);

  if (!storesHydrated) {
    return <ChatShellSkeleton />;
  }

  return (
    <div className="flex h-full w-full relative">
      <ThreadSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenSettings={() => {
          setSettingsOpen(true);
          setSidebarOpen(false);
        }}
      />

      <div className="flex flex-col flex-1 min-w-0 h-full">
        <MessageList
          onSuggest={handleSuggest}
          onRegenerate={() => void regenerate()}
          onEditUser={handleEditUser}
        />
      </div>

      <ChatComposer
        onSend={(t) => void sendMessage(t)}
        onStop={stop}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <Dock
        onNewChat={handleNewChat}
        newChatDisabled={newChatDisabled}
        onToggleSidebar={() => setSidebarOpen((s) => !s)}
        onOpenOrbit={() => setOrbitOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <SandboxPanel />
      <ConstellationsModal open={orbitOpen} onOpenChange={setOrbitOpen} />
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <NebulaToasts />
    </div>
  );
}
