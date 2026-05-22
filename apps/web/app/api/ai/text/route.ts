import { DEEPSEEK_API_URL, DEEPSEEK_MODEL } from "@/lib/deepseek";

export async function POST(req: Request) {
  const apiKey = req.headers.get("x-deepseek-key");
  if (!apiKey) {
    return Response.json({ error: "DeepSeek API key required." }, { status: 401 });
  }

  const body = (await req.json()) as {
    messages: { role: string; content: string }[];
  };

  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: body.messages,
      stream: false,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    return Response.json({ error: text }, { status: res.status });
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content ?? "";
  return Response.json({ text });
}
