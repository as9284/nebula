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
        "flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
        className,
      )}
    >
      <button
        type="button"
        onClick={copy}
        aria-label="Copy message"
        className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover"
      >
        <Copy size={14} aria-hidden />
      </button>
      {role === "assistant" && isLastAssistant && onRegenerate && (
        <button
          type="button"
          onClick={onRegenerate}
          aria-label="Regenerate response"
          className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover"
        >
          <RotateCcw size={14} aria-hidden />
        </button>
      )}
      {role === "user" && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit message"
          className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover"
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
          className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover"
        >
          <Send size={14} aria-hidden />
        </button>
      )}
    </div>
  );
}
