"use client";

import { Copy, RotateCcw, Pencil, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageActionsProps {
  role: "user" | "assistant";
  content: string;
  isLastAssistant: boolean;
  onRegenerate?: () => void;
  onEdit?: () => void;
  onEditAndResend?: () => void;
  className?: string;
}

export function MessageActions({
  role,
  content,
  isLastAssistant,
  onRegenerate,
  onEdit,
  onEditAndResend,
  className,
}: MessageActionsProps) {
  const copy = () => void navigator.clipboard.writeText(content);

  return (
    <div
      className={cn(
        "flex gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100",
        className,
      )}
    >
      <button
        type="button"
        onClick={copy}
        aria-label="Copy message"
        className="min-h-9 min-w-9 flex items-center justify-center rounded-md p-2 text-text-muted hover:text-text-primary hover:bg-surface-hover sm:min-h-0 sm:min-w-0 sm:p-1.5"
      >
        <Copy size={14} aria-hidden />
      </button>
      {role === "assistant" && isLastAssistant && onRegenerate && (
        <button
          type="button"
          onClick={onRegenerate}
          aria-label="Regenerate response"
          className="min-h-9 min-w-9 flex items-center justify-center rounded-md p-2 text-text-muted hover:text-text-primary hover:bg-surface-hover sm:min-h-0 sm:min-w-0 sm:p-1.5"
        >
          <RotateCcw size={14} aria-hidden />
        </button>
      )}
      {role === "user" && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit message"
          className="min-h-9 min-w-9 flex items-center justify-center rounded-md p-2 text-text-muted hover:text-text-primary hover:bg-surface-hover sm:min-h-0 sm:min-w-0 sm:p-1.5"
        >
          <Pencil size={14} aria-hidden />
        </button>
      )}
      {role === "user" && onEditAndResend && (
        <button
          type="button"
          onClick={onEditAndResend}
          aria-label="Edit and resend"
          title="Edit and resend"
          className="min-h-9 min-w-9 flex items-center justify-center rounded-md p-2 text-text-muted hover:text-text-primary hover:bg-surface-hover sm:min-h-0 sm:min-w-0 sm:p-1.5"
        >
          <Send size={14} aria-hidden />
        </button>
      )}
    </div>
  );
}
