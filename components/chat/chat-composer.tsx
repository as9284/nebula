"use client";

import { useRef, useEffect } from "react";
import { Send, Square } from "lucide-react";
import { motion } from "framer-motion";
import { useLunaStore } from "@/stores/use-luna-store";
import { useSettingsStore } from "@/stores/use-settings-store";
import { cn } from "@/lib/utils";

interface ChatComposerProps {
  onSend: (text: string) => void;
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
  const isStreaming = useLunaStore((s) => s.isStreaming);
  const deepseekKey = useSettingsStore((s) => s.deepseekKey);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [draft]);

  const canSend = !!deepseekKey && draft.trim().length > 0 && !isStreaming;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSend(draft);
    }
  };

  if (!deepseekKey) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="nebula-composer-offset nebula-chat-inset-x fixed left-0 right-0 z-30"
      >
        <div className="max-w-xl mx-auto text-center text-sm text-text-secondary bg-surface-elevated/80 backdrop-blur-xl rounded-2xl px-4 py-4 border border-border sm:px-6">
          Add your{" "}
          <button
            type="button"
            onClick={onOpenSettings}
            className="text-text-primary underline underline-offset-2"
          >
            DeepSeek API key
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
    >
      <div className="max-w-2xl mx-auto w-full min-w-0">
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-surface-elevated/90 backdrop-blur-xl px-3 py-3 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] sm:px-4">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Luna…"
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none bg-transparent text-[0.9375rem] text-text-primary placeholder:text-text-muted outline-none max-h-[200px] py-2"
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="shrink-0 p-2 rounded-xl bg-accent text-accent-fg mb-0.5"
              title="Stop"
            >
              <Square size={18} fill="currentColor" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => canSend && onSend(draft)}
              disabled={!canSend}
              className={cn(
                "shrink-0 p-2 rounded-xl mb-0.5 transition-colors",
                canSend
                  ? "bg-accent text-accent-fg"
                  : "text-text-muted opacity-40",
              )}
              title="Send"
            >
              <Send size={18} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
