"use client";

import { useId, useState } from "react";
import { ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReasoningPanelProps {
  thinking: string;
  isStreaming?: boolean;
  className?: string;
}

export function ReasoningPanel({
  thinking,
  isStreaming = false,
  className,
}: ReasoningPanelProps) {
  const panelId = useId();
  const [pinnedOpen, setPinnedOpen] = useState<boolean | null>(null);
  const expanded = pinnedOpen ?? isStreaming;

  if (!thinking.trim()) return null;

  return (
    <div
      className={cn(
        "mb-3 rounded-xl border border-border/80 bg-bg/60 overflow-hidden",
        className,
      )}
    >
      <button
        type="button"
        id={`${panelId}-trigger`}
        aria-expanded={expanded}
        aria-controls={`${panelId}-body`}
        onClick={() => setPinnedOpen(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-medium text-text-muted hover:text-text-secondary hover:bg-surface-hover/50 transition-colors"
      >
        {expanded ? (
          <ChevronDown size={14} className="shrink-0" aria-hidden />
        ) : (
          <ChevronRight size={14} className="shrink-0" aria-hidden />
        )}
        <Sparkles size={13} className="shrink-0 opacity-70" aria-hidden />
        <span>Thinking</span>
        {isStreaming && (
          <span className="ml-auto text-[10px] font-normal text-text-muted animate-pulse">
            …
          </span>
        )}
      </button>
      {expanded && (
        <div
          id={`${panelId}-body`}
          role="region"
          aria-labelledby={`${panelId}-trigger`}
          className="px-3 pb-3 pt-0 max-h-64 overflow-y-auto border-t border-border/50"
        >
          <pre className="text-xs leading-relaxed text-text-muted whitespace-pre-wrap font-sans">
            {thinking}
          </pre>
        </div>
      )}
    </div>
  );
}
