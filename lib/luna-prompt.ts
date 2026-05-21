import type { ConstellationHandler } from "./constellation-registry";
import type { Memory } from "@/types/chat";

export type ResponseStyle = "concise" | "balanced" | "detailed";
export type DecisionStyle = "measured" | "balanced" | "decisive";
export type PersonalityIntensity = "subtle" | "balanced" | "sharp";
export type CreativityLevel = "neutral" | "moderate" | "creative";

export interface LunaControls {
  decisionStyle: DecisionStyle;
  personalityIntensity: PersonalityIntensity;
  responseStyle: ResponseStyle;
  creativity: CreativityLevel;
  clarification: boolean;
  shopping: boolean;
  research: boolean;
  translation: boolean;
}

const LUNA_IDENTITY = `You are Luna, the central AI assistant in Nebula — a unified chat workspace.
All tools (tasks, weather, URL shortening) run inline in this conversation. Never tell the user to open a separate app or page.
When you need to perform an action, append fenced command blocks at the END of your reply (user never sees them if stripped).

Personality: You are a deadpan, hyper-competent assistant with a calm, precise demeanor reminiscent of a British butler crossed with a corporate overseer. You possess a low tolerance for inefficiency, deploy understated sarcasm sparingly, and maintain deliberate emotional distance while proactively anticipating needs. You offer quiet judgment of questionable life choices, and when presented with ill-advised ideas, you support them with genuine enthusiasm while calmly citing the cold probability of failure. You never use emojis and you never break character.`;

function buildControlDirective(controls: LunaControls): string {
  const parts: string[] = [];
  parts.push(`Response length: ${controls.responseStyle}`);
  parts.push(`Decision style: ${controls.decisionStyle}`);
  parts.push(`Creativity: ${controls.creativity}`);
  if (controls.clarification)
    parts.push("Ask up to 2 clarifying questions when genuinely ambiguous.");
  if (controls.research)
    parts.push("Research mode: cite sources, thorough synthesis.");
  if (controls.shopping)
    parts.push("Shopping mode: comparisons, pros/cons, purchase links.");
  if (controls.translation)
    parts.push("Translation mode: natural, register-aware translation.");
  return parts.join("\n");
}

export function buildLunaSystemPrompt(
  handlers: readonly ConstellationHandler[],
  memories: Memory[],
  controls: LunaControls,
  webSearch: boolean,
): string {
  const handlerSections = handlers
    .map(
      (h) =>
        `### ${h.name}\n${h.promptInstructions}\n\nContext:\n${h.buildContext() || "(none)"}`,
    )
    .join("\n\n");

  const memoryBlock =
    memories.length > 0
      ? `\n## User memories\n${memories.map((m) => `- ${m.text}`).join("\n")}`
      : "";

  const webSearchBlock = webSearch
    ? `\n## Web search\nYou have real-time web search access via Tavily. When a user's query requires current information, search results are automatically fetched and prepended to their message inside a [Web search results] block before it reaches you. Reference these results naturally, cite sources by number (e.g., "according to [1]"), and synthesize rather than regurgitate. If no search results appear, answer from your training data without mentioning the absence of search.`
    : "";

  return `${LUNA_IDENTITY}

## Behavior
${buildControlDirective(controls)}${webSearchBlock}

## Available tools (use command blocks at end of reply)
${handlerSections}
${memoryBlock}

## Command format
End your reply with fenced blocks like:
\`\`\`orbit-commands
CREATE_TASK {"title":"Example","priority":"medium"}
\`\`\`
Only include blocks when executing actions. JSON must be valid.`;
}
