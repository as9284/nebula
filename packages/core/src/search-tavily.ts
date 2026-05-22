import type { SearchTopic } from "./search-query";
import type { SearchSource } from "./types/search";

interface TavilySearchResult {
  results?: {
    title?: string;
    url?: string;
    content?: string;
    published_date?: string;
  }[];
  answer?: string;
}

/** Tavily REST API — no Node SDK so web client and React Native can share this module. */
export async function searchWithTavily(
  apiKey: string,
  query: string,
  topic: SearchTopic = "general",
): Promise<{ sources: SearchSource[]; answer?: string }> {
  const body: Record<string, unknown> = {
    api_key: apiKey,
    query,
    max_results: 5,
    include_answer: topic === "news" ? "advanced" : true,
  };
  if (topic === "news") {
    body.topic = "news";
    body.days = 1;
  }

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(err.detail ?? `Tavily search failed (${res.status})`);
  }

  const result = (await res.json()) as TavilySearchResult;
  const sources: SearchSource[] = (result.results ?? []).map((r, i) => ({
    index: i + 1,
    title: r.title ?? "Untitled",
    url: r.url ?? "",
    snippet: (r.content ?? "").slice(0, 280),
    publishedDate: r.published_date,
  }));

  return { sources, answer: result.answer };
}
