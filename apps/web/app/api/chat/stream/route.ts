import { streamLlm, type LlmMessage } from "@nebula/core/llm";
import {
  type LlmConfig,
  isLlmConfigured,
} from "@nebula/core/llm-config";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    messages: { role: string; content: LlmMessage["content"] }[];
    systemPrompt?: string;
    llm?: LlmConfig;
  };

  const llm = body.llm;
  if (!llm || !isLlmConfigured(llm)) {
    return Response.json(
      { error: "Model not configured. Add your API key in Settings." },
      { status: 401 },
    );
  }

  const chatMessages: LlmMessage[] = body.messages.map((m) => ({
    role: m.role as LlmMessage["role"],
    content: m.content,
  }));

  const messages: LlmMessage[] = body.systemPrompt
    ? [{ role: "system", content: body.systemPrompt }, ...chatMessages]
    : chatMessages;

  try {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const enqueue = (payload: Record<string, unknown>) => {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                choices: [{ delta: payload }],
              })}\n\n`,
            ),
          );
        };

        try {
          await streamLlm(llm, messages, req.signal, {
            onContent: (text) => enqueue({ content: text }),
            onReasoning: (text) => enqueue({ reasoning: text }),
          });
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
