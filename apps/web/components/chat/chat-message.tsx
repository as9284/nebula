"use client";

import { motion } from "framer-motion";
import { MessageActions } from "./message-actions";
import { ActionResults } from "@/components/cards/action-result";
import { ThinkingIndicator } from "./thinking-indicator";
import { ReasoningPanel } from "./reasoning-panel";
import { LunaMarkdown } from "./luna-markdown";
import { CodeArtifactCard } from "@/components/artifacts/code-artifact-card";
import { UserMessageContent } from "./user-message-content";
import { MessageSources } from "./message-sources";
import { useLunaStore } from "@/stores/use-luna-store";
import type { ChatMessage as ChatMessageType } from "@/types/chat";
import { cn } from "@/lib/utils";

type ActiveStreamPhase =
  | "searching"
  | "describing"
  | "thinking"
  | "building_ui"
  | "streaming";

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming: boolean;
  isLastAssistant: boolean;
  activeStreamPhase?: ActiveStreamPhase;
  streamStatusHint?: string | null;
  onRegenerate?: () => void;
  onEditUser?: (content: string) => void;
}

function toIndicatorPhase(
  phase: ActiveStreamPhase | undefined,
): ActiveStreamPhase {
  if (
    phase === "searching" ||
    phase === "describing" ||
    phase === "streaming" ||
    phase === "building_ui"
  ) {
    return phase;
  }
  return "thinking";
}

export function ChatMessage({
  message,
  isStreaming,
  isLastAssistant,
  activeStreamPhase,
  streamStatusHint,
  onRegenerate,
  onEditUser,
}: ChatMessageProps) {
  const actionResults = useLunaStore((s) => s.actionResults[message.id]);
  const displayActionResults = actionResults?.filter(
    (r) => r.type !== "ui_artifact",
  );
  const hasFileExport = displayActionResults?.some(
    (r) => r.type === "file_generated",
  );
  const sources = message.sources;
  const isUser = message.role === "user";
  const hasThinking = !!message.thinking?.trim();
  const hasContent = message.content.trim().length > 0;
  const showCursor =
    !isUser && isStreaming && isLastAssistant && hasContent;
  const showPhaseIndicator =
    !isUser &&
    isStreaming &&
    isLastAssistant &&
    !hasContent &&
    !hasFileExport;
  const showStreamHint =
    !isUser && isStreaming && isLastAssistant && !!streamStatusHint;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group px-2 sm:px-4",
        isUser ? "flex justify-end py-1.5" : "py-2.5",
      )}
    >
      <div
        className={cn(
          isUser
            ? "relative max-w-[min(85%,36rem)]"
            : "max-w-3xl w-full min-w-0",
        )}
      >
        {!isUser && (
          <span className="text-xs font-medium text-text-muted mb-1.5 tracking-wide">
            Luna
          </span>
        )}

        <div className="relative">
          <div
            className={cn(
              isUser &&
                "rounded-2xl border border-border bg-surface px-3.5 py-2 shadow-sm",
            )}
          >
            {isUser ? (
              <UserMessageContent
                content={message.content}
                images={message.images}
              />
            ) : (
              <div
                className={cn("luna-prose", showCursor && "typing-cursor")}
              >
                {hasThinking && (
                  <ReasoningPanel thinking={message.thinking ?? ""} />
                )}
                {hasContent ? (
                  <LunaMarkdown content={message.content} sources={sources} />
                ) : showPhaseIndicator ? (
                  <ThinkingIndicator
                    key={activeStreamPhase ?? "thinking"}
                    phase={toIndicatorPhase(activeStreamPhase)}
                  />
                ) : null}
                {showStreamHint && (
                  <p
                    className={cn(
                      "text-xs text-text-muted leading-relaxed max-w-md",
                      hasContent || showPhaseIndicator ? "mt-2" : "",
                    )}
                  >
                    {streamStatusHint}
                  </p>
                )}
              </div>
            )}
          </div>

          {isUser ? (
            <MessageActions
              role={message.role}
              content={message.content}
              isLastAssistant={isLastAssistant}
              onRegenerate={onRegenerate}
              onEdit={
                onEditUser ? () => onEditUser(message.content) : undefined
              }
              className="absolute right-0 top-full mt-0.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto"
            />
          ) : (
            <MessageActions
              role={message.role}
              content={message.content}
              isLastAssistant={isLastAssistant}
              onRegenerate={onRegenerate}
              className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          )}
        </div>

        {!isUser && sources && sources.length > 0 && !isStreaming && (
          <MessageSources sources={sources} />
        )}
        {!isUser && message.artifacts && message.artifacts.length > 0 && (
          <div className="mt-2 flex min-w-0 max-w-full flex-col gap-3">
            {message.artifacts.map((artifact) => (
              <CodeArtifactCard key={artifact.id} artifact={artifact} />
            ))}
          </div>
        )}
        {!isUser &&
          (!message.artifacts || message.artifacts.length === 0) &&
          displayActionResults?.some(
            (r) =>
              r.type === "command_error" && r.handler === "sandbox-commands",
          ) && (
            <div className="mt-2 tool-card tool-card-error text-sm">
              Preview could not be built — Luna&apos;s artifact block was
              invalid. Try asking again; multiline{" "}
              <code className="text-xs">--- /App.tsx</code> sections work best.
            </div>
          )}
        {displayActionResults && displayActionResults.length > 0 && (
          <div className="mt-2 min-w-0 max-w-full">
            <ActionResults results={displayActionResults} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
