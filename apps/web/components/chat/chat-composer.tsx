"use client";

import { useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { motion } from "framer-motion";
import { useLunaStore } from "@/stores/use-luna-store";
import { isConversationStreaming } from "@/lib/luna-stream-selectors";
import { useSettingsStore } from "@/stores/use-settings-store";
import { cn } from "@/lib/utils";
import { StopButton } from "./stop-button";

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
  const isStreaming = useLunaStore((s) =>
    isConversationStreaming(s, s.activeConversationId),
  );
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
        <div className="nebula-panel max-w-xl mx-auto text-center text-sm text-text-secondary rounded-2xl px-4 py-4 nebula-shadow-elevated sm:px-6">
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
        <div className="nebula-panel flex items-end gap-2 rounded-2xl px-3 py-3 nebula-shadow-elevated sm:px-4">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Message Luna"
            placeholder="Message Luna…"
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none bg-transparent text-[0.9375rem] text-text-primary placeholder:text-text-muted outline-none max-h-[200px] py-2"
          />
          {isStreaming ? (
            <StopButton onStop={onStop} />
          ) : (
            <button
              type="button"
              onClick={() => canSend && onSend(draft)}
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
      </div>
    </motion.div>
  );
}
