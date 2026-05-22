import type { SearchSource } from "./types/search";

export function formatSearchForModel(
  sources: SearchSource[],
  answer?: string,
): string {
  if (sources.length === 0) return "No results found.";

  const snippets = sources
    .map(
      (s) =>
        `[${s.index}] ${s.title}\n${s.url}${s.publishedDate ? `\nPublished: ${s.publishedDate}` : ""}\n${s.snippet}`,
    )
    .join("\n\n");

  return answer ? `Summary: ${answer}\n\n${snippets}` : snippets;
}

/** Turn inline [n] citations into markdown links when sources are known. */
export function linkifyCitations(
  markdown: string,
  sources: SearchSource[],
): string {
  if (!sources.length) return markdown;

  const byIndex = new Map(sources.map((s) => [s.index, s]));

  return markdown.replace(/\[(\d+)\](?!\()/g, (match, num) => {
    const source = byIndex.get(Number(num));
    if (!source) return match;
    const title = source.title.replace(/"/g, "'");
    return `[${match}](${source.url} "${title}")`;
  });
}

export function hostnameFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
