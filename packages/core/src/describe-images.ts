import { buildImageContentParts, type ImagePayload } from "./image-content-parts";
import { completeLlmMessages, type LlmMessage } from "./llm";
import type { LlmConfig } from "./llm-config";

export const IMAGE_DESCRIBE_PROMPT = `Describe this image in detail for a text-only AI assistant that cannot see images.

Include:
- Main subject and scene
- Any visible text (transcribe accurately)
- Colors, layout, UI elements, charts, or data shown
- Notable details needed to answer follow-up questions

Be factual and concise. Do not speculate beyond what is visible.`;

export interface ImageDescription {
  name: string;
  description: string;
}

export function formatImageDescriptionsForModel(
  descriptions: ImageDescription[],
): string {
  if (!descriptions.length) return "";
  return descriptions
    .map(
      (d) =>
        `[Image: ${d.name} — described for your model because it cannot see images directly]\n${d.description.trim()}`,
    )
    .join("\n\n");
}

export async function describeImages(
  visionConfig: LlmConfig,
  images: ImagePayload[],
): Promise<ImageDescription[]> {
  const results: ImageDescription[] = [];

  for (const image of images) {
    const imageParts = buildImageContentParts(visionConfig.provider, [image]);
    const messages: LlmMessage[] = [
      {
        role: "user",
        content: [{ type: "text", text: IMAGE_DESCRIBE_PROMPT }, ...imageParts],
      },
    ];
    const description = await completeLlmMessages(visionConfig, messages);
    results.push({
      name: image.name,
      description: description.trim() || "(No description returned.)",
    });
  }

  return results;
}
