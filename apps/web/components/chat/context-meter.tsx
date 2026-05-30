"use client";

import { useLunaStore } from "@/stores/use-luna-store";
import { cn } from "@/lib/utils";

export function ContextMeter() {
  const activeId = useLunaStore((s) => s.activeConversationId);
  const usage = useLunaStore((s) =>
    activeId ? s.contextUsageByConversationId[activeId] : undefined,
  );
  const hasSummary = useLunaStore((s) => {
    if (!activeId) return false;
    const conv = s.conversations.find((c) => c.id === activeId);
    return !!conv?.contextSummary?.trim();
  });

  if (!usage || usage.usageRatio < 0.05) return null;

  const pct = Math.round(usage.usageRatio * 100);
  const warn = pct >= 75;
  const critical = pct >= 90;

  return (
    <div
      className="flex items-center gap-2 px-1 pb-1 text-[11px] text-text-muted"
      title={
        hasSummary
          ? "Older messages were summarized so Luna keeps context within the model limit."
          : "Estimated share of the model context window used by this chat."
      }
    >
      <div
        className="h-1 flex-1 max-w-[6rem] rounded-full bg-surface-elevated overflow-hidden"
        aria-hidden
      >
        <div
          className={cn(
            "h-full rounded-full transition-all",
            critical
              ? "bg-danger"
              : warn
                ? "bg-[var(--color-warning)]"
                : "bg-luna/70",
          )}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <span className={cn(critical && "text-danger", warn && !critical && "text-warning")}>
        {pct >= 100 ? "Context full" : `${pct}%`}
        {hasSummary ? " · compacted" : ""}
      </span>
    </div>
  );
}
