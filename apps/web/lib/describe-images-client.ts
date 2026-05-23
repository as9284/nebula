import { formatImageDescriptionsForModel } from "@nebula/core/describe-images";
import type { LlmConfig } from "@nebula/core/llm-config";
import type { MessageImage } from "@/types/chat";

export async function describeImagesForChat(
  images: MessageImage[],
  visionConfig: LlmConfig,
): Promise<string> {
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
