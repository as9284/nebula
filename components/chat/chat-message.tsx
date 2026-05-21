"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import { MessageActions } from "./message-actions";
import { ActionResults } from "@/components/cards/action-result";
import { ThinkingIndicator } from "./thinking-indicator";
import { useLunaStore } from "@/stores/use-luna-store";
import type { ChatMessage as ChatMessageType } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming: boolean;
  isLastAssistant: boolean;
  onRegenerate?: () => void;
  onEditUser?: (content: string) => void;
}

export function ChatMessage({
  message,
  isStreaming,
  isLastAssistant,
  onRegenerate,
  onEditUser,
}: ChatMessageProps) {
  const actionResults = useLunaStore((s) => s.actionResults[message.id]);
  const streamPhase = useLunaStore((s) => s.streamPhase);
  const isUser = message.role === "user";
  const showCursor =
    !isUser && isStreaming && isLastAssistant && message.content.length > 0;
  const showThinking =
    !isUser && isStreaming && isLastAssistant && !message.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group py-3 px-2 sm:px-4",
        isUser ? "flex justify-end" : "",
      )}
    >
      <div
        className={cn(
          "max-w-3xl w-full",
          isUser ? "flex flex-col items-end" : "",
        )}
      >
        {!isUser && (
          <span className="text-xs font-medium text-text-muted mb-1 tracking-wide">
            Luna
          </span>
        )}
        <div
          className={cn(
            "relative",
            isUser &&
              "bg-surface border border-border rounded-2xl px-4 py-3 max-w-[85%]",
          )}
        >
          {isUser ? (
            <p className="text-[0.9375rem] whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div
              className={cn(
                "luna-prose",
                showCursor && "typing-cursor",
              )}
            >
              {message.content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              ) : showThinking ? (
                <ThinkingIndicator
                  phase={
                    streamPhase === "searching"
                      ? "searching"
                      : streamPhase === "streaming"
                        ? "streaming"
                        : "thinking"
                  }
                />
              ) : null}
            </div>
          )}
          <MessageActions
            role={message.role}
            content={message.content}
            isLastAssistant={isLastAssistant}
            onRegenerate={onRegenerate}
            onEdit={
              isUser && onEditUser
                ? () => onEditUser(message.content)
                : undefined
            }
            className={cn("mt-1", isUser ? "justify-end" : "")}
          />
        </div>
        {actionResults && actionResults.length > 0 && (
          <div className="mt-2 max-w-3xl">
            <ActionResults results={actionResults} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
