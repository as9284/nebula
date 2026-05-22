import type { SearchTopic } from "@/lib/search-query";
import type { SearchSource } from "@/types/search";

const MAX_RESULTS = 5;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripHtml(html: string): string {
  return decodeEntities(html)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function searchGoogleNewsRss(query: string): Promise<SearchSource[]> {
  const q = encodeURIComponent(query);
  const url = `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`;

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`News search failed (${res.status})`);
  }

  const xml = await res.text();
  const sources: SearchSource[] = [];

  for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    if (sources.length >= MAX_RESULTS) break;

    const block = match[1];
    const title = stripHtml(block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
    const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim();
    const publishedDate = block
      .match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]
      ?.trim();
    const snippet = stripHtml(
      block.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? "",
    ).slice(0, 280);

    if (!title || !link?.startsWith("http")) continue;

    sources.push({
      index: sources.length + 1,
      title,
      url: link,
      snippet,
      publishedDate,
    });
  }

  return sources;
}

async function searchMojeek(query: string): Promise<SearchSource[]> {
  const res = await fetch(
    `https://www.mojeek.com/search?q=${encodeURIComponent(query)}`,
    {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    },
  );

  if (!res.ok) {
    throw new Error(`Web search failed (${res.status})`);
  }

  const html = await res.text();
  const sources: SearchSource[] = [];
  const blocks = html.split(/<li class="r\d+ clu-result"/);

  for (const block of blocks.slice(1)) {
    if (sources.length >= MAX_RESULTS) break;

    const titleMatch = block.match(
      /<a[^>]*class="title"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i,
    );
    const snippetMatch = block.match(/<p class="s">([\s\S]*?)<\/p>/i);

    if (!titleMatch) continue;

    const url = titleMatch[1];
    const title = stripHtml(titleMatch[2]);
    const snippet = snippetMatch ? stripHtml(snippetMatch[1]).slice(0, 280) : "";

    if (!url.startsWith("http") || !title) continue;
    if (url.includes("mojeek.com")) continue;

    sources.push({
      index: sources.length + 1,
      title,
      url,
      snippet,
    });
  }

  return sources;
}

export async function searchWithBuiltin(
  query: string,
  topic: SearchTopic = "general",
): Promise<{ sources: SearchSource[] }> {
  const errors: string[] = [];

  if (topic === "news") {
    try {
      const sources = await searchGoogleNewsRss(query);
      if (sources.length > 0) return { sources };
    } catch (e) {
      errors.push(String(e));
    }
  }

  try {
    const sources = await searchMojeek(query);
    if (sources.length > 0) return { sources };
  } catch (e) {
    errors.push(String(e));
  }

  if (topic !== "news") {
    try {
      const sources = await searchGoogleNewsRss(query);
      if (sources.length > 0) return { sources };
    } catch (e) {
      errors.push(String(e));
    }
  }

  throw new Error(
    errors.length > 0
      ? `Built-in search failed: ${errors.join("; ")}`
      : "No results from built-in search",
  );
}
