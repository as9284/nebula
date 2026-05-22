import { shortenUrl } from "@nebula/core/shorten";
import { useHyperlaneStore } from "@/stores/use-hyperlane-store";
import type {
  ConstellationHandler,
  ParsedCommand,
  ActionResult,
} from "@nebula/core/constellation-registry";
import { ShortlinkCard } from "@/components/cards/shortlink-card";

export const hyperlaneHandler: ConstellationHandler = {
  tag: "hyperlane-commands",
  name: "Hyperlane",
  multiCommand: false,

  promptInstructions: `### Hyperlane — URL shortening
\`\`\`hyperlane-commands
SHORTEN_URL {"url":"https://..."}
\`\`\`
Use when the user wants a short link.`,

  buildContext(): string {
    const count = useHyperlaneStore.getState().history.length;
    return count ? `## Hyperlane — ${count} links in history` : "";
  },

  async execute(commands: ParsedCommand[]): Promise<ActionResult[]> {
    const cmd = commands[0];
    if (!cmd?.args.url) return [];

    const originalUrl = String(cmd.args.url);
    const cached = useHyperlaneStore
      .getState()
      .history.find((h) => h.originalUrl === originalUrl);

    try {
      const shortUrl = cached?.shortUrl ?? (await shortenUrl(originalUrl));
      if (!cached) {
        useHyperlaneStore.getState().addEntry(originalUrl, shortUrl);
      }
      return [
        {
          type: "short_url",
          handler: "hyperlane-commands",
          original: originalUrl,
          short: shortUrl,
        },
      ];
    } catch (e) {
      return [
        {
          type: "short_url_error",
          handler: "hyperlane-commands",
          error: String(e),
        },
      ];
    }
  },

  ResultCard: ShortlinkCard,
};
