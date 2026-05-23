import {
  describeImages,
  formatImageDescriptionsForModel,
} from "@nebula/core/describe-images";
import {
  type LlmConfig,
  isLlmConfigured,
} from "@nebula/core/llm-config";
import type { MessageImage } from "@nebula/core/types/chat";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    llm?: LlmConfig;
    images?: MessageImage[];
  };

  const llm = body.llm;
  const images = body.images ?? [];

  if (!llm || !isLlmConfigured(llm)) {
    return Response.json(
      { error: "Vision helper model not configured." },
      { status: 401 },
    );
  }

  if (!images.length) {
    return Response.json({ descriptions: [], formatted: "" });
  }

  try {
    const descriptions = await describeImages(
      llm,
      images.map((img) => ({
        name: img.name,
        mediaType: img.mediaType,
        data: img.data,
      })),
    );
    return Response.json({
      descriptions,
      formatted: formatImageDescriptionsForModel(descriptions),
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
