"use client";

import { Copy, RotateCcw, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageActionsProps {
  role: "user" | "assistant";
  content: string;
  isLastAssistant: boolean;
  onRegenerate?: () => void;
  onEdit?: () => void;
  className?: string;
}

export function MessageActions({
  role,
  content,
  isLastAssistant,
  onRegenerate,
  onEdit,
  className,
}: MessageActionsProps) {
  const copy = () => void navigator.clipboard.writeText(content);

  return (
    <div
      className={cn(
        "flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
        className,
      )}
    >
      <button
        type="button"
        onClick={copy}
        className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover"
        title="Copy"
      >
        <Copy size={14} />
      </button>
      {role === "assistant" && isLastAssistant && onRegenerate && (
        <button
          type="button"
          onClick={onRegenerate}
          className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover"
          title="Regenerate"
        >
          <RotateCcw size={14} />
        </button>
      )}
      {role === "user" && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover"
          title="Edit"
        >
          <Pencil size={14} />
        </button>
      )}
    </div>
  );
}
