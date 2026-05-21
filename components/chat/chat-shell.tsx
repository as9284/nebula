"use client";

import { useState, useCallback } from "react";
import { ThreadSidebar } from "./thread-sidebar";
import { MessageList } from "./message-list";
import { ChatComposer } from "./chat-composer";
import { SettingsModal } from "./settings-modal";
import { SandboxPanel } from "./sandbox-panel";
import { Dock } from "./dock";
import { useChat } from "@/lib/use-chat";
import { useLunaStore } from "@/stores/use-luna-store";

export function ChatShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { sendMessage, stop, regenerate } = useChat();
  const setDraft = useLunaStore((s) => s.setDraftMessage);
  const truncateFromMessage = useLunaStore((s) => s.truncateFromMessage);
  const createConversation = useLunaStore((s) => s.createConversation);

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
    createConversation();
    setSidebarOpen(false);
  }, [createConversation]);

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
        onToggleSidebar={() => setSidebarOpen((s) => !s)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <SandboxPanel />
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
