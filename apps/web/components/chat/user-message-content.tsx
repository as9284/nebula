"use client";

import type { MessageImage } from "@/types/chat";
import { imageAttachmentToDataUrl } from "@/lib/chat-attachments";
import { ExpandableImage } from "@/components/ui/image-lightbox";
import { cn } from "@/lib/utils";

interface UserMessageContentProps {
  content: string;
  images?: MessageImage[];
  className?: string;
}

/** Legacy messages stored image placeholders in plain text. */
function stripLegacyImageMarkers(text: string): string {
  return text.replace(/\n*\[Attached image:[^\]]+\]/g, "").trim();
}

export function UserMessageContent({
  content,
  images,
  className,
}: UserMessageContentProps) {
  const text = (
    images?.length ? stripLegacyImageMarkers(content) : content
  ).trim();
  const hasImages = images && images.length > 0;

  return (
    <div className={cn("space-y-2", className)}>
      {hasImages && (
        <div className="flex flex-wrap gap-2">
          {images.map((img) => {
            const src = imageAttachmentToDataUrl(img);
            if (!src) return null;
            return (
              <ExpandableImage
                key={`${img.name}-${img.data.slice(0, 16)}`}
                src={src}
                alt={img.name}
                imgClassName="max-h-48"
              />
            );
          })}
        </div>
      )}
      {text ? (
        <p className="text-[0.9375rem] leading-snug whitespace-pre-wrap text-text-primary">
          {text}
        </p>
      ) : null}
    </div>
  );
}
