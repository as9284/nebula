import type { SearchProvider } from "./types/search";

export function isWebSearchAvailable(
  provider: SearchProvider,
  tavilyKey: string,
): boolean {
  return provider === "builtin" || !!tavilyKey;
}
