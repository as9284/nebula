"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChatMessage } from "./chat-message";
import { WelcomeState } from "./welcome-state";
import { useLunaStore } from "@/stores/use-luna-store";
import {
  getActiveStreamAssistantMessageId,
  getConversationStreamPhase,
  isConversationStreaming,
} from "@/lib/luna-stream-selectors";

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
  const isStreaming = useLunaStore((s) =>
    isConversationStreaming(s, s.activeConversationId),
  );
  const streamPhase = useLunaStore((s) =>
    getConversationStreamPhase(s, s.activeConversationId),
  );
  const streamingAssistantId = useLunaStore(getActiveStreamAssistantMessageId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [stickToBottom, setStickToBottom] = useState(true);

  const messages = useMemo(
    () => conversation?.messages ?? [],
    [conversation?.messages],
  );
  const lastAssistantId = [...messages]
    .reverse()
    .find((m) => m.role === "assistant")?.id;
  const activeStreamPhase =
    isStreaming &&
    (streamPhase === "searching" ||
      streamPhase === "thinking" ||
      streamPhase === "streaming")
      ? streamPhase
      : undefined;

  useEffect(() => {
    if (!stickToBottom || !scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isStreaming, streamPhase, stickToBottom]);

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
      className="nebula-chat-scroll nebula-chat-inset-x nebula-chat-bottom-pad flex-1 overflow-y-auto pt-[max(1rem,env(safe-area-inset-top,0px))]"
    >
      <div className="max-w-3xl mx-auto w-full">
        {messages.map((msg) => {
          const isActiveAssistant =
            isStreaming &&
            msg.id === (streamingAssistantId ?? lastAssistantId);
          return (
            <ChatMessage
              key={msg.id}
              message={msg}
              isStreaming={isActiveAssistant}
              isLastAssistant={msg.id === lastAssistantId}
              activeStreamPhase={
                isActiveAssistant ? activeStreamPhase : undefined
              }
              onRegenerate={
                msg.id === lastAssistantId ? onRegenerate : undefined
              }
              onEditUser={onEditUser}
            />
          );
        })}
      </div>
    </div>
  );
}
