"use client";

import { Sparkles } from "lucide-react";
import { useLunaStore } from "@/stores/use-luna-store";

export function CompactionNotice() {
  const conv = useLunaStore((s) =>
    s.conversations.find((c) => c.id === s.activeConversationId),
  );

  if (!conv?.contextSummary?.trim()) return null;

  return (
    <div className="mx-auto mb-2 max-w-3xl flex items-start gap-2 rounded-xl border border-border/80 bg-surface/60 px-3 py-2 text-xs text-text-muted nebula-chat-inset-x">
      <Sparkles size={14} className="shrink-0 mt-0.5 text-luna" aria-hidden />
      <p>
        This thread is long — older messages were summarized automatically so
        Luna keeps full context without hitting model limits. Recent messages
        stay verbatim.
      </p>
    </div>
  );
}
