export type SearchTopic = "news" | "general";

export interface PreparedSearchQuery {
  /** Query sent to Tavily (assistant name and greetings stripped). */
  query: string;
  topic: SearchTopic;
}

const GREETING_PREFIX =
  /^(?:hi|hey|hello|yo|sup|good\s+(?:morning|afternoon|evening))(?:\s+there)?[,!]?\s*/i;

const LUNA_INVOCATION = /\b(?:hey\s+)?luna\b[,!?]?\s*/gi;

const NEWS_INTENT =
  /\b(?:news|headlines|breaking|current events|what(?:'s| is)\s+happening|today(?:'s)?\s+(?:news|events|headlines))\b/i;

/** Strip chat framing so Tavily searches the user's actual topic, not "Luna". */
export function buildSearchQuery(raw: string): PreparedSearchQuery {
  const original = raw.trim();
  let query = original;

  query = query.replace(GREETING_PREFIX, "");
  query = query.replace(LUNA_INVOCATION, "");
  query = query.replace(/\s{2,}/g, " ").trim();

  if (!query) {
    query = original;
  }

  const topic: SearchTopic = NEWS_INTENT.test(original) ? "news" : "general";

  if (topic === "news" && /\btoday\b/i.test(query)) {
    const date = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    query = `${query} ${date}`;
  }

  return { query, topic };
}
