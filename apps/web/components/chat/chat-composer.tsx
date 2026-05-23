"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Send, Paperclip } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLunaStore } from "@/stores/use-luna-store";
import { isConversationStreaming } from "@/lib/luna-stream-selectors";
import { useSettingsStore } from "@/stores/use-settings-store";
import { isLlmConfigured } from "@nebula/core/llm-config";
import { modelSupportsVision } from "@nebula/core/vision-support";
import {
  dataTransferToFiles,
  filesToAttachments,
  mergeAttachmentErrors,
  shouldPreventDefaultOnPaste,
  type ChatAttachment,
} from "@/lib/chat-attachments";
import { cn } from "@/lib/utils";
import { ComposerAttachmentChip } from "./composer-attachment-chip";
import { StopButton } from "./stop-button";

interface ChatComposerProps {
  onSend: (text: string, attachments?: ChatAttachment[]) => void;
  onStop: () => void;
  onOpenSettings: () => void;
}

export function ChatComposer({
  onSend,
  onStop,
  onOpenSettings,
}: ChatComposerProps) {
  const draft = useLunaStore((s) => s.draftMessage);
  const setDraft = useLunaStore((s) => s.setDraftMessage);
  const isStreaming = useLunaStore((s) =>
    isConversationStreaming(s, s.activeConversationId),
  );
  const llmConfig = useSettingsStore((s) => s.llmConfig);
  const describeImagesForTextModels = useSettingsStore(
    (s) => s.describeImagesForTextModels,
  );
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [attachError, setAttachError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [draft]);

  const modelReady = isLlmConfigured(llmConfig);
  const canSend =
    modelReady &&
    (draft.trim().length > 0 || attachments.length > 0) &&
    !isStreaming;

  const appendFiles = useCallback(async (files: File[]) => {
    if (!files.length || isStreaming) return;
    setAttachError("");
    const { attachments: added, errors } = await filesToAttachments(files);
    if (added.length) {
      setAttachments((prev) => [...prev, ...added]);
    }
    const errMsg = mergeAttachmentErrors(errors);
    if (errMsg) setAttachError(errMsg);
  }, [isStreaming]);

  const handleSend = () => {
    if (!canSend) return;
    onSend(draft.trim(), attachments.length ? attachments : undefined);
    setAttachments([]);
    setAttachError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const ingestDataTransfer = useCallback(
    (data: DataTransfer | null) => {
      const files = dataTransferToFiles(data);
      if (files.length) void appendFiles(files);
    },
    [appendFiles],
  );

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (isStreaming) return;
    const { clipboardData } = e;
    const files = dataTransferToFiles(clipboardData);
    if (!files.length) return;

    void appendFiles(files);
    if (shouldPreventDefaultOnPaste(clipboardData)) {
      e.preventDefault();
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    void appendFiles(Array.from(files));
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isStreaming) return;
    dragDepthRef.current += 1;
    if (dataTransferToFiles(e.dataTransfer).length > 0) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isStreaming) e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragOver(false);
    if (isStreaming) return;
    ingestDataTransfer(e.dataTransfer);
  };

  if (!modelReady) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="nebula-composer-offset nebula-chat-inset-x fixed left-0 right-0 z-30"
      >
        <div className="nebula-panel max-w-xl mx-auto text-center text-sm text-text-secondary rounded-2xl px-4 py-4 nebula-shadow-elevated sm:px-6">
          Configure your{" "}
          <button
            type="button"
            onClick={onOpenSettings}
            className="text-text-primary underline underline-offset-2"
          >
            AI model & API key
          </button>{" "}
          in Settings to start chatting.
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="nebula-composer-offset nebula-chat-inset-x fixed left-0 right-0 z-30"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="max-w-2xl mx-auto w-full min-w-0">
        <AnimatePresence>
          {(attachments.length > 0 || attachError) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2 space-y-1.5"
            >
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 items-end">
                  {attachments.map((a) => (
                    <ComposerAttachmentChip
                      key={a.id}
                      attachment={a}
                      onRemove={() =>
                        setAttachments((prev) =>
                          prev.filter((x) => x.id !== a.id),
                        )
                      }
                    />
                  ))}
                </div>
              )}
              {attachError && (
                <p className="text-xs text-warning px-1">{attachError}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={cn(
            "nebula-panel flex items-end gap-1.5 rounded-2xl px-2 py-2 nebula-shadow-elevated sm:px-3 sm:gap-2 transition-colors",
            isDragOver && "ring-2 ring-accent/50 bg-surface-hover/30",
          )}
        >
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,.txt,.md,.json,.csv,.js,.ts,.tsx,.jsx,.py,.go,.rs,.java,.yaml,.yml,.html,.css,.xml,.sql,.sh,.log,.env"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isStreaming}
            aria-label="Attach files"
            className={cn(
              "shrink-0 p-2 rounded-xl mb-0.5 transition-colors",
              isStreaming
                ? "text-text-muted opacity-40"
                : "text-text-muted hover:text-text-primary hover:bg-surface-hover",
            )}
          >
            <Paperclip size={18} aria-hidden />
          </button>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            aria-label="Message Luna"
            placeholder="Message Luna…"
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none bg-transparent text-[0.9375rem] text-text-primary placeholder:text-text-muted outline-none max-h-[200px] py-2 min-w-0"
          />
          {isStreaming ? (
            <StopButton onStop={onStop} />
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              aria-label="Send message"
              className={cn(
                "shrink-0 p-2 rounded-xl mb-0.5 transition-colors",
                canSend
                  ? "bg-accent text-accent-fg"
                  : "text-text-muted opacity-40",
              )}
            >
              <Send size={18} aria-hidden />
            </button>
          )}
        </div>
        {!modelSupportsVision(llmConfig) && (
          <p className="mt-1.5 text-[0.65rem] text-text-muted text-center px-2">
            {describeImagesForTextModels
              ? "Paste or attach images — they'll be described in text for your model."
              : "Paste or attach images — enable description in Settings → AI model for text-only models."}
          </p>
        )}
      </div>
    </motion.div>
  );
}
