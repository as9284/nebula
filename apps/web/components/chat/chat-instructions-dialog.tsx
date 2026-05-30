"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLunaStore } from "@/stores/use-luna-store";

interface ChatInstructionsDialogProps {
  conversationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatInstructionsDialog({
  conversationId,
  open,
  onOpenChange,
}: ChatInstructionsDialogProps) {
  const conv = useLunaStore((s) =>
    conversationId
      ? s.conversations.find((c) => c.id === conversationId)
      : undefined,
  );
  const setInstructions = useLunaStore(
    (s) => s.setConversationCustomInstructions,
  );
  const [text, setText] = useState("");

  useEffect(() => {
    if (open) setText(conv?.customInstructions ?? "");
  }, [open, conv?.customInstructions]);

  const save = () => {
    if (!conversationId) return;
    setInstructions(conversationId, text);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] nebula-overlay" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[61] w-[min(100vw-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-5 nebula-shadow-elevated">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <Dialog.Title className="text-base font-semibold text-text-primary">
                Chat instructions
              </Dialog.Title>
              <Dialog.Description className="text-sm text-text-muted mt-1">
                How Luna should behave in this thread only — like custom
                instructions in ChatGPT or Claude projects.
              </Dialog.Description>
            </div>
            <Dialog.Close
              type="button"
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover"
              aria-label="Close"
            >
              <X size={18} />
            </Dialog.Close>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Always reply in Spanish. Be terse. Focus on TypeScript."
            rows={6}
            className="w-full resize-none rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-text-muted"
          />
          <div className="flex justify-end gap-2 mt-4">
            <Dialog.Close
              type="button"
              className="px-4 py-2 text-sm rounded-xl text-text-secondary hover:bg-surface-hover"
            >
              Cancel
            </Dialog.Close>
            <button
              type="button"
              onClick={save}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-luna text-bg hover:opacity-90"
            >
              Save
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
