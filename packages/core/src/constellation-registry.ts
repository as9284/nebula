import type { ComponentType } from "react";

export interface ParsedCommand {
  command: string;
  args: Record<string, unknown>;
}

export interface ActionResult {
  type: string;
  handler: string;
  [key: string]: unknown;
}

export interface ConstellationHandler {
  tag: string;
  name: string;
  multiCommand: boolean;
  promptInstructions: string;
  buildContext: () => string;
  execute: (commands: ParsedCommand[]) => Promise<ActionResult[]>;
  ResultCard: ComponentType<{
    result: ActionResult;
  }>;
}

export function sanitizeForPrompt(text: string, maxLen = 120): string {
  const withoutControlChars = Array.from(text, (char) => {
    const code = char.charCodeAt(0);
    return code <= 0x1f || code === 0x7f ? " " : char;
  }).join("");
  return withoutControlChars.replace(/`{3,}/g, "```").slice(0, maxLen);
}

function getCommandBlockBody(response: string, tag: string): string | null {
  const re = new RegExp("```" + tag + "\\r?\\n([\\s\\S]*?)(?:```|$)", "i");
  const match = response.match(re);
  return match?.[1] ?? null;
}

export interface ParseCommandsResult {
  commands: ParsedCommand[];
  errors: ActionResult[];
}

export function parseCommands(
  response: string,
  tag: string,
  multi: boolean,
): ParsedCommand[] {
  return parseCommandsDetailed(response, tag, multi).commands;
}

export function parseCommandsDetailed(
  response: string,
  tag: string,
  multi: boolean,
): ParseCommandsResult {
  const body = getCommandBlockBody(response, tag);
  if (!body) return { commands: [], errors: [] };

  const lines = multi ? body.trim().split("\n") : [body.trim().split("\n")[0]];

  const commands: ParsedCommand[] = [];
  const errors: ActionResult[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const spaceIdx = trimmed.indexOf(" ");
    const command = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
    const jsonStr = spaceIdx === -1 ? "{}" : trimmed.slice(spaceIdx + 1);
    try {
      commands.push({
        command,
        args: JSON.parse(jsonStr) as Record<string, unknown>,
      });
    } catch {
      errors.push({
        type: tag === "orbit-commands" ? "orbit_error" : "command_error",
        handler: tag,
        message: `Invalid JSON for ${command}`,
      });
    }
  }

  return { commands, errors };
}

export function stripCommandBlocks(
  content: string,
  handlers: readonly ConstellationHandler[],
): string {
  let cleaned = content;
  for (const { tag } of handlers) {
    const re = new RegExp("\\s*```" + tag + "\\r?\\n[\\s\\S]*?(?:```|$)", "gi");
    cleaned = cleaned.replace(re, "");
  }

  const match = cleaned.match(/\s*```([a-z-]*)$/i);
  if (match) {
    const partial = (match[1] ?? "").toLowerCase();
    if (
      partial.length === 0 ||
      handlers.some(({ tag }) => tag.startsWith(partial))
    ) {
      cleaned = cleaned.slice(0, cleaned.length - match[0].length).trimEnd();
    }
  }

  return cleaned.trimEnd();
}

export function hasCommandBlocks(
  content: string,
  handlers: readonly ConstellationHandler[],
): boolean {
  const lower = content.toLowerCase();
  return handlers.some(({ tag }) => lower.includes("```" + tag));
}
