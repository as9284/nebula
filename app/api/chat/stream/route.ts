import { DEEPSEEK_API_URL, DEEPSEEK_MODEL } from "@/lib/deepseek";

export async function POST(req: Request) {
  const apiKey = req.headers.get("x-deepseek-key");
  if (!apiKey) {
    return Response.json(
      { error: "DeepSeek API key required. Add it in Settings." },
      { status: 401 },
    );
  }

  const body = (await req.json()) as {
    messages: { role: string; content: string }[];
    systemPrompt?: string;
  };

  const messages = body.systemPrompt
    ? [{ role: "system", content: body.systemPrompt }, ...body.messages]
    : body.messages;

  const upstream = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      stream: true,
    }),
    cache: "no-store",
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return Response.json(
      { error: text || `DeepSeek error ${upstream.status}` },
      { status: upstream.status },
    );
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
