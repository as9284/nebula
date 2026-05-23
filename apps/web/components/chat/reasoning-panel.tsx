"use client";

import { useId, useState } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReasoningPanelProps {
  thinking: string;
  className?: string;
}

export function ReasoningPanel({ thinking, className }: ReasoningPanelProps) {
  const panelId = useId();
  const [expanded, setExpanded] = useState(false);

  if (!thinking.trim()) return null;

  return (
    <div
      className={cn(
        "mb-2 rounded-lg border border-border/50 bg-surface/30 overflow-hidden",
        className,
      )}
    >
      <button
        type="button"
        id={`${panelId}-trigger`}
        aria-expanded={expanded}
        aria-controls={`${panelId}-body`}
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-1.5 px-2 py-1 text-left text-[11px] text-text-muted hover:text-text-secondary transition-colors"
      >
        <ChevronRight
          size={12}
          className={cn(
            "shrink-0 transition-transform duration-150",
            expanded && "rotate-90",
          )}
          aria-hidden
        />
        <Sparkles size={11} className="shrink-0 opacity-60" aria-hidden />
        <span className="font-medium">Thinking</span>
      </button>
      {expanded && (
        <div
          id={`${panelId}-body`}
          role="region"
          aria-labelledby={`${panelId}-trigger`}
          className="px-2 pb-2 max-h-28 overflow-y-auto border-t border-border/40"
        >
          <p className="text-[11px] leading-snug text-text-muted whitespace-pre-wrap">
            {thinking}
          </p>
        </div>
      )}
    </div>
  );
}
