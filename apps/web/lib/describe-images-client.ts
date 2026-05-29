import {
  describeImages,
  formatImageDescriptionsForModel,
} from "@nebula/core/describe-images";
import { isLoopbackUrl, type LlmConfig } from "@nebula/core/llm-config";
import type { MessageImage } from "@/types/chat";

export async function describeImagesForChat(
  images: MessageImage[],
  visionConfig: LlmConfig,
): Promise<string> {
  const payloads = images.map((img) => ({
    name: img.name,
    mediaType: img.mediaType,
    data: img.data,
  }));

  // Vision helper on the user's machine must run in the browser (same as chat).
  if (isLoopbackUrl(visionConfig.baseUrl)) {
    const descriptions = await describeImages(visionConfig, payloads);
    return formatImageDescriptionsForModel(descriptions);
  }

  const res = await fetch("/api/ai/describe-images", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ llm: visionConfig, images }),
  });

  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? `Image description failed (${res.status})`);
  }

  const data = (await res.json()) as {
    formatted?: string;
    descriptions?: { name: string; description: string }[];
  };

  if (data.formatted) return data.formatted;
  if (data.descriptions?.length) {
    return formatImageDescriptionsForModel(data.descriptions);
  }
  return "";
}
