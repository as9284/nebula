import { tavily } from "@tavily/core";

export async function POST(req: Request) {
  const apiKey = req.headers.get("x-tavily-key");
  if (!apiKey) {
    return Response.json(
      { error: "Tavily API key required. Add it in Settings." },
      { status: 401 },
    );
  }

  const body = (await req.json()) as { query: string };
  const query = body.query?.trim();
  if (!query) {
    return Response.json({ error: "Query required" }, { status: 400 });
  }

  try {
    const client = tavily({ apiKey });
    const result = await client.search(query, { maxResults: 5 });
    const formatted = (result.results ?? [])
      .map(
        (r, i) =>
          `[${i + 1}] ${r.title}\n${r.url}\n${r.content ?? ""}`,
      )
      .join("\n\n");
    return Response.json({ results: formatted });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
