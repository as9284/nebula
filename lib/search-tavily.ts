import { tavily } from "@tavily/core";
import type { TavilySearchOptions } from "@tavily/core";
import type { SearchTopic } from "@/lib/search-query";
import type { SearchSource } from "@/types/search";

export async function searchWithTavily(
  apiKey: string,
  query: string,
  topic: SearchTopic = "general",
): Promise<{ sources: SearchSource[]; answer?: string }> {
  const client = tavily({ apiKey });
  const options: TavilySearchOptions = {
    maxResults: 5,
    includeAnswer: topic === "news" ? "advanced" : true,
  };
  if (topic === "news") {
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

  return { sources, answer: result.answer };
}
