import type { LlmContentPart } from "./llm";
import type { LlmProvider } from "./llm-config";

export interface ImagePayload {
  name: string;
  mediaType: string;
  data: string;
}

export function buildImageContentParts(
  provider: LlmProvider,
  images: ImagePayload[],
): LlmContentPart[] {
  return images.map((img) => {
    const mediaType = img.mediaType || "image/png";
    if (provider === "anthropic") {
      return {
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: mediaType,
          data: img.data,
        },
      };
    }
    return {
      type: "image_url" as const,
      image_url: {
        url: `data:${mediaType};base64,${img.data}`,
      },
    };
  });
}
