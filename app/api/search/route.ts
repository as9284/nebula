import { formatSearchForModel } from "@/lib/search-format";
import { searchWithBuiltin } from "@/lib/search-fallback";
import type { SearchTopic } from "@/lib/search-query";
import { searchWithTavily } from "@/lib/search-tavily";
import type { SearchProvider } from "@/types/search";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    query: string;
    topic?: SearchTopic;
    provider?: SearchProvider;
  };

  const query = body.query?.trim();
  if (!query) {
    return Response.json({ error: "Query required" }, { status: 400 });
  }

  const provider: SearchProvider =
    body.provider === "tavily" ? "tavily" : "builtin";
  const topic: SearchTopic = body.topic === "news" ? "news" : "general";

  try {
    if (provider === "tavily") {
      const apiKey = req.headers.get("x-tavily-key");
      if (!apiKey) {
        return Response.json(
          { error: "Tavily API key required. Add it in Settings." },
          { status: 401 },
        );
      }

      const { sources, answer } = await searchWithTavily(apiKey, query, topic);
      const formatted = formatSearchForModel(sources, answer);

      return Response.json({
        results: formatted || "No results found.",
        sources,
        answer,
        provider: "tavily",
      });
    }

    const { sources } = await searchWithBuiltin(query, topic);
    const formatted = formatSearchForModel(sources);

    return Response.json({
      results: formatted || "No results found.",
      sources,
      provider: "builtin",
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
