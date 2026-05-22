export type SearchProvider = "builtin" | "tavily";

export interface SearchSource {
  index: number;
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
}

export interface WebSearchResponse {
  results: string;
  sources: SearchSource[];
  answer?: string;
}
