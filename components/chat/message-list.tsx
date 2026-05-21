"use client";

import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "./chat-message";
import { WelcomeState } from "./welcome-state";
import { useLunaStore } from "@/stores/use-luna-store";

interface MessageListProps {
  onSuggest: (text: string) => void;
  onRegenerate: () => void;
  onEditUser: (content: string) => void;
}

export function MessageList({
  onSuggest,
  onRegenerate,
  onEditUser,
}: MessageListProps) {
  const conversation = useLunaStore((s) =>
    s.conversations.find((c) => c.id === s.activeConversationId),
  );
  const isStreaming = useLunaStore((s) => s.isStreaming);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [stickToBottom, setStickToBottom] = useState(true);

  const messages = conversation?.messages ?? [];
  const lastAssistantId = [...messages]
    .reverse()
    .find((m) => m.role === "assistant")?.id;

  useEffect(() => {
    if (!stickToBottom || !scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isStreaming, stickToBottom]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setStickToBottom(atBottom);
  };

  if (!conversation || messages.length === 0) {
    return <WelcomeState onSuggest={onSuggest} />;
  }

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className="nebula-chat-scroll flex-1 overflow-y-auto px-4 pb-40 pt-4"
    >
      <div className="max-w-3xl mx-auto w-full">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isStreaming={isStreaming && msg.id === lastAssistantId}
            isLastAssistant={msg.id === lastAssistantId}
            onRegenerate={
              msg.id === lastAssistantId ? onRegenerate : undefined
            }
            onEditUser={onEditUser}
          />
        ))}
      </div>
    </div>
  );
}
