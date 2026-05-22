import { tavily } from "@tavily/core";
import type { TavilySearchOptions } from "@tavily/core";
import type { SearchTopic } from "@/lib/search-query";

export async function POST(req: Request) {
  const apiKey = req.headers.get("x-tavily-key");
  if (!apiKey) {
    return Response.json(
      { error: "Tavily API key required. Add it in Settings." },
      { status: 401 },
    );
  }

  const body = (await req.json()) as { query: string; topic?: SearchTopic };
  const query = body.query?.trim();
  if (!query) {
    return Response.json({ error: "Query required" }, { status: 400 });
  }

  try {
    const client = tavily({ apiKey });
    const options: TavilySearchOptions = {
      maxResults: 5,
      includeAnswer: body.topic === "news" ? "advanced" : true,
    };
    if (body.topic === "news") {
      options.topic = "news";
      options.days = 1;
    }

    const result = await client.search(query, options);
    const snippets = (result.results ?? [])
      .map(
        (r, i) =>
          `[${i + 1}] ${r.title}\n${r.url}${r.publishedDate ? `\nPublished: ${r.publishedDate}` : ""}\n${r.content ?? ""}`,
      )
      .join("\n\n");

    const formatted = result.answer
      ? `Summary: ${result.answer}\n\n${snippets}`
      : snippets;

    return Response.json({ results: formatted || "No results found." });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
