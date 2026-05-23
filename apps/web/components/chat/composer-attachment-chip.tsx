"use client";

import { FileText, X } from "lucide-react";
import {
  imageAttachmentToDataUrl,
  type ChatAttachment,
} from "@/lib/chat-attachments";
import { ExpandableImage } from "@/components/ui/image-lightbox";
import { cn } from "@/lib/utils";

interface ComposerAttachmentChipProps {
  attachment: ChatAttachment;
  onRemove: () => void;
}

export function ComposerAttachmentChip({
  attachment,
  onRemove,
}: ComposerAttachmentChipProps) {
  if (attachment.kind === "image") {
    const src = imageAttachmentToDataUrl(attachment);
    if (!src) return null;

    return (
      <div className="relative shrink-0 group/chip">
        <ExpandableImage
          src={src}
          alt={attachment.name}
          className="w-[4.5rem] h-[4.5rem] border-border"
          imgClassName="w-[4.5rem] h-[4.5rem] max-h-[4.5rem] object-cover"
        />
        <button
          type="button"
          aria-label={`Remove ${attachment.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={cn(
            "absolute -top-1.5 -right-1.5 flex items-center justify-center",
            "w-5 h-5 rounded-full bg-surface-elevated border border-border",
            "text-text-muted hover:text-text-primary shadow-sm",
            "opacity-100 sm:opacity-0 sm:group-hover/chip:opacity-100 transition-opacity",
          )}
        >
          <X size={11} aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 max-w-[14rem] pl-2.5 pr-1 py-1 rounded-lg bg-surface-elevated border border-border text-xs text-text-secondary">
      <FileText size={12} className="shrink-0 opacity-70" aria-hidden />
      <span className="truncate">{attachment.name}</span>
      <button
        type="button"
        aria-label={`Remove ${attachment.name}`}
        onClick={onRemove}
        className="shrink-0 p-0.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover"
      >
        <X size={12} aria-hidden />
      </button>
    </span>
  );
}
