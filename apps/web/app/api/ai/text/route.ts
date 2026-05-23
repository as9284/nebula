import { completeLlm } from "@nebula/core/llm";
import {
  type LlmConfig,
  isLlmConfigured,
} from "@nebula/core/llm-config";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    messages: { role: string; content: string }[];
    llm?: LlmConfig;
  };

  const llm = body.llm;
  if (!llm || !isLlmConfigured(llm)) {
    return Response.json(
      { error: "Model not configured. Add your API key in Settings." },
      { status: 401 },
    );
  }

  const prompt =
    body.messages.find((m) => m.role === "user")?.content ??
    body.messages[0]?.content ??
    "";

  try {
    const text = await completeLlm(llm, prompt);
    return Response.json({ text });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
