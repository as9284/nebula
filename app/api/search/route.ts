import { tavily } from "@tavily/core";
import type { TavilySearchOptions } from "@tavily/core";
import type { SearchTopic } from "@/lib/search-query";
import { formatSearchForModel } from "@/lib/search-format";
import type { SearchSource } from "@/types/search";

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
    const sources: SearchSource[] = (result.results ?? []).map((r, i) => ({
      index: i + 1,
      title: r.title ?? "Untitled",
      url: r.url,
      snippet: (r.content ?? "").slice(0, 280),
      publishedDate: r.publishedDate,
    }));

    const formatted = formatSearchForModel(sources, result.answer);

    return Response.json({
      results: formatted || "No results found.",
      sources,
      answer: result.answer,
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
