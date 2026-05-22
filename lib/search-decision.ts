import type { SearchTopic } from "@/lib/search-query";
import { NEWS_INTENT } from "@/lib/search-query";

export interface SearchDecision {
  search: boolean;
  query: string;
  topic: SearchTopic;
}

const GREETING_ONLY =
  /^(?:hi|hey|hello|yo|sup|good\s+(?:morning|afternoon|evening)|thanks|thank\s+you|ok(?:ay)?|sure|cool|nice|bye|goodbye)(?:\s+there)?[!.,?\s]*$/i;

const CREATIVE_OR_EDIT =
  /\b(?:write|draft|compose|create)\s+(?:me\s+)?(?:a|an)\s+(?:poem|story|essay|song|joke|haiku)\b/i;

const REWRITE_ONLY =
  /\b(?:rewrite|rephrase|proofread|fix\s+(?:the\s+)?grammar|make\s+(?:it|this)\s+shorter|summarize\s+(?:this|the\s+above)|translate\s+(?:this|to))\b/i;

const FOLLOW_UP_ONLY =
  /\b(?:tell me more|go on|expand on|elaborate|what do you mean|can you clarify|explain that|say more about that|continue)\b/i;

const TIMELESS_KNOWLEDGE =
  /\b(?:explain|what\s+is|what\s+are|define|how\s+does|how\s+do|difference\s+between|who\s+was|history\s+of|tell\s+me\s+about)\b/i;

const CODING_OR_LOGIC =
  /\b(?:how\s+do\s+i|help\s+me\s+(?:fix|debug|write)|implement|refactor|typescript|javascript|python|react|next\.?js|css|html|sql|regex|algorithm|function\s+that)\b/i;

const OPINION_OR_PLANNING =
  /\b(?:should\s+i|what\s+do\s+you\s+think|recommend|brainstorm|ideas\s+for|help\s+me\s+plan|pros\s+and\s+cons)\b/i;

const FIGURATIVE_NEWS = /\b(?:good\s+news|news\s+to\s+me|that's\s+news)\b/i;

const ORBIT_TASKS =
  /\b(?:add\s+(?:a\s+)?task|create\s+(?:a\s+)?task|my\s+tasks|todo|add\s+(?:a\s+)?note|shorten\s+(?:this\s+)?url)\b/i;

/** Unmistakable live-data requests — fast path to search (narrow). */
const LIVE_WEATHER =
  /\b(?:weather|forecast|temperature|rain|snow)\b/i;

const LIVE_MARKETS =
  /\b(?:stock\s+price|share\s+price|ticker|earnings\s+report|market\s+cap)\b/i;

const LIVE_SPORTS =
  /\b(?:live\s+score|game\s+score|match\s+score|league\s+standings|who\s+won\s+(?:the\s+)?(?:game|match))\b/i;

const LIVE_LEADERSHIP =
  /\bwho\s+is\s+(?:the\s+)?(?:current\s+)?(?:ceo|president|prime\s+minister|pm|governor|mayor)\s+of\b/i;

const LIVE_PRICES =
  /\b(?:what(?:'s| is)\s+the\s+(?:current\s+)?price\s+of|how\s+much\s+(?:is|does|do)\s+.+\s+cost)\b/i;

const LIVE_HOURS =
  /\b(?:open\s+now|store\s+hours|closing\s+time|hours\s+for)\b/i;

const EXPLICIT_WEB =
  /\b(?:search\s+(?:the\s+)?web|look\s+up\s+online|google\s+this|find\s+(?:me\s+)?(?:online|on\s+the\s+web))\b/i;

const STRONG_TEMPORAL =
  /\b(?:right\s+now|yesterday|as\s+of\s+today|this\s+(?:morning|afternoon|evening|week|month)|tonight|today(?:'s)?\s+(?:news|headlines|events))\b/i;

const UPCOMING_EVENTS =
  /\bwhen\s+is\s+(?:the\s+)?next\b/i;

const WEAK_TEMPORAL =
  /\b(?:latest|current(?:ly)?|recent(?:ly)?|up\s+to\s+date|still\s+(?:open|in\s+office))\b/i;

function todayLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Last few turns for classifier follow-ups (excludes the message being sent). */
export function buildSearchContext(
  messages: { role: string; content: string; id: string }[],
  excludeMessageId: string,
  maxTurns = 3,
): string | undefined {
  const prior = messages.filter((m) => m.id !== excludeMessageId).slice(-maxTurns * 2);
  if (prior.length === 0) return undefined;

  const lines = prior.map((m) => {
    const role = m.role === "user" ? "User" : "Assistant";
    const body = m.content.replace(/\s+/g, " ").trim().slice(0, 280);
    return `${role}: ${body}`;
  });
  return lines.join("\n");
}

function hasLiveDataIntent(message: string): boolean {
  return (
    NEWS_INTENT.test(message) ||
    LIVE_WEATHER.test(message) ||
    LIVE_MARKETS.test(message) ||
    LIVE_SPORTS.test(message) ||
    LIVE_LEADERSHIP.test(message) ||
    LIVE_PRICES.test(message) ||
    LIVE_HOURS.test(message) ||
    EXPLICIT_WEB.test(message) ||
    STRONG_TEMPORAL.test(message) ||
    UPCOMING_EVENTS.test(message)
  );
}

/** Fast path: clearly does not need live web results. */
export function shouldSkipSearchHeuristic(message: string): boolean {
  const text = message.trim();
  if (!text || text.startsWith("/")) return true;
  if (text.length < 24 && GREETING_ONLY.test(text)) return true;
  if (CREATIVE_OR_EDIT.test(text)) return true;
  if (FIGURATIVE_NEWS.test(text)) return true;
  if (ORBIT_TASKS.test(text) && !hasLiveDataIntent(text)) return true;
  if (
    REWRITE_ONLY.test(text) &&
    !hasLiveDataIntent(text) &&
    !WEAK_TEMPORAL.test(text)
  ) {
    return true;
  }
  if (
    FOLLOW_UP_ONLY.test(text) &&
    !hasLiveDataIntent(text) &&
    !WEAK_TEMPORAL.test(text)
  ) {
    return true;
  }
  if (
    TIMELESS_KNOWLEDGE.test(text) &&
    !hasLiveDataIntent(text) &&
    !WEAK_TEMPORAL.test(text)
  ) {
    return true;
  }
  if (
    CODING_OR_LOGIC.test(text) &&
    !hasLiveDataIntent(text) &&
    !WEAK_TEMPORAL.test(text)
  ) {
    return true;
  }
  if (
    OPINION_OR_PLANNING.test(text) &&
    !hasLiveDataIntent(text) &&
    !LIVE_MARKETS.test(text) &&
    !LIVE_PRICES.test(text)
  ) {
    return true;
  }
  return false;
}

/** Fast path: unmistakable live-data need — skip classifier. */
export function shouldSearchHeuristic(message: string): boolean {
  const text = message.trim();
  if (shouldSkipSearchHeuristic(text)) return false;
  return hasLiveDataIntent(text);
}

function buildClassifierPrompt(userMessage: string, context?: string): string {
  const contextBlock = context
    ? `\nRecent conversation (for follow-ups only — do not search just because prior turns used the web):\n${context}\n`
    : "";

  return `You decide whether this user message needs a live web search BEFORE answering.

Today: ${todayLabel()}.
${contextBlock}
Default to search:false. Only search:true when the answer would likely be wrong or stale without fresh web results.

search:true examples:
- Today's news, weather, sports scores, stock prices, store hours
- Current office-holder (CEO, president) or "who won" for ongoing/recent events
- Product release/version availability the user treats as "now"

search:false examples:
- Greetings, thanks, small talk
- Timeless facts, history, science, coding help, math, writing/editing
- Opinions, brainstorming, "should I", creative writing
- Follow-ups that only rephrase, shorten, or elaborate prior chat (no new facts needed)
- "Latest" or a year alone in a historical/educational question (e.g. "explain the 2024 election" for learning)
- Tasks, notes, URLs, reminders handled locally

Reply with ONLY valid JSON (no markdown):
{"search":boolean,"query":"short search query if true else \"\"","topic":"general"|"news"}

User message:
${userMessage}`;
}

function parseClassifierJson(
  raw: string,
  fallbackMessage: string,
): SearchDecision {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { search: false, query: "", topic: "general" };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      search?: boolean;
      query?: string;
      topic?: string;
    };
    const topic: SearchTopic =
      parsed.topic === "news" ? "news" : "general";
    if (!parsed.search) {
      return { search: false, query: "", topic: "general" };
    }
    const query =
      typeof parsed.query === "string" && parsed.query.trim()
        ? parsed.query.trim()
        : fallbackMessage;
    return { search: true, query, topic };
  } catch {
    return { search: false, query: "", topic: "general" };
  }
}

export async function decideWebSearch(
  userMessage: string,
  classify: (prompt: string) => Promise<string>,
  recentContext?: string,
): Promise<SearchDecision> {
  if (shouldSkipSearchHeuristic(userMessage)) {
    return { search: false, query: "", topic: "general" };
  }

  if (shouldSearchHeuristic(userMessage)) {
    return {
      search: true,
      query: userMessage,
      topic: NEWS_INTENT.test(userMessage) ? "news" : "general",
    };
  }

  const raw = await classify(
    buildClassifierPrompt(userMessage, recentContext),
  );
  return parseClassifierJson(raw, userMessage);
}
