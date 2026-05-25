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

/** Commands models may emit as bare lines (without fenced blocks). */
export const ACTION_COMMAND_NAMES = [
  "CREATE_TASK",
  "UPDATE_TASK",
  "COMPLETE_TASK",
  "DELETE_TASK",
  "DELETE_TASKS",
  "CREATE_NOTE",
  "UPDATE_NOTE",
  "DELETE_NOTE",
  "CREATE_PROJECT",
  "DELETE_PROJECT",
  "SAVE_MEMORY",
  "DELETE_MEMORY",
  "GET_WEATHER",
  "SHORTEN_URL",
  "OPEN_SANDBOX",
  "GENERATE_FILE",
] as const;

export type ActionCommandName = (typeof ACTION_COMMAND_NAMES)[number];

export const COMMAND_TO_HANDLER_TAG: Record<ActionCommandName, string> = {
  CREATE_TASK: "orbit-commands",
  UPDATE_TASK: "orbit-commands",
  COMPLETE_TASK: "orbit-commands",
  DELETE_TASK: "orbit-commands",
  DELETE_TASKS: "orbit-commands",
  CREATE_NOTE: "orbit-commands",
  UPDATE_NOTE: "orbit-commands",
  DELETE_NOTE: "orbit-commands",
  CREATE_PROJECT: "orbit-commands",
  DELETE_PROJECT: "orbit-commands",
  SAVE_MEMORY: "memory-commands",
  DELETE_MEMORY: "memory-commands",
  GET_WEATHER: "solaris-commands",
  SHORTEN_URL: "hyperlane-commands",
  OPEN_SANDBOX: "sandbox-commands",
  GENERATE_FILE: "file-commands",
};

const ACTION_COMMAND_PATTERN = ACTION_COMMAND_NAMES.join("|");

const BARE_COMMAND_START_RE = new RegExp(
  `\\b(${ACTION_COMMAND_PATTERN})\\s+\\{`,
  "gi",
);

/** Trailing partial bare command while streaming */
const TRAILING_BARE_COMMAND_RE = new RegExp(
  `\\n?\\s*(${ACTION_COMMAND_PATTERN})\\s+\\{[\\s\\S]*$`,
  "i",
);

/** Inline/backtick wrapped: `DELETE_TASK {...}` */
const INLINE_COMMAND_RE = new RegExp(
  "`\\s*(" + ACTION_COMMAND_PATTERN + ")\\s+(\\{[\\s\\S]*?\\})\\s*`",
  "gi",
);

function findBalancedJsonEnd(text: string, openBraceIndex: number): number | null {
  if (text[openBraceIndex] !== "{") return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = openBraceIndex; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return null;
}

function parseBareCommandLine(line: string): ParsedCommand | null {
  const trimmed = line.trim();
  const spaceIdx = trimmed.indexOf(" ");
  if (spaceIdx === -1) return null;
  const command = trimmed.slice(0, spaceIdx);
  if (!ACTION_COMMAND_NAMES.includes(command as ActionCommandName)) return null;
  const jsonStart = trimmed.indexOf("{", spaceIdx);
  if (jsonStart === -1) return null;
  const jsonEnd = findBalancedJsonEnd(trimmed, jsonStart);
  if (jsonEnd === null) return null;
  const jsonStr = trimmed.slice(jsonStart, jsonEnd + 1);
  try {
    return {
      command,
      args: JSON.parse(jsonStr) as Record<string, unknown>,
    };
  } catch {
    return null;
  }
}

function isActionCommandBody(body: string): boolean {
  const lines = body
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return false;
  return lines.every((line) => parseBareCommandLine(line) !== null);
}

/** Remove COMMAND + balanced JSON segments anywhere in text. */
function stripBareActionCommands(content: string): string {
  let result = "";
  let lastIndex = 0;
  BARE_COMMAND_START_RE.lastIndex = 0;
  let match = BARE_COMMAND_START_RE.exec(content);
  while (match) {
    const command = match[1];
    if (
      !ACTION_COMMAND_NAMES.includes(command.toUpperCase() as ActionCommandName)
    ) {
      match = BARE_COMMAND_START_RE.exec(content);
      continue;
    }
    const cmdStart = match.index;
    const jsonStart = match.index + match[0].length - 1;
    const jsonEnd = findBalancedJsonEnd(content, jsonStart);
    if (jsonEnd === null) {
      result += content.slice(lastIndex, cmdStart);
      lastIndex = content.length;
      break;
    }
    result += content.slice(lastIndex, cmdStart);
    lastIndex = jsonEnd + 1;
    while (lastIndex < content.length && /[ \t]/.test(content[lastIndex])) {
      lastIndex++;
    }
    if (content[lastIndex] === "\r") lastIndex++;
    if (content[lastIndex] === "\n") lastIndex++;
    match = BARE_COMMAND_START_RE.exec(content);
  }
  result += content.slice(lastIndex);
  return result;
}

function stripGenericCommandFences(content: string): string {
  return content.replace(
    /```[a-z0-9-]*\r?\n?([\s\S]*?)```/gi,
    (full, body) => {
      if (isActionCommandBody(body)) return "";
      return full;
    },
  );
}

const TOOL_FENCE_LANG_RE =
  /^(nebula-export|nebula-artifact|file-commands|sandbox-commands|orbit-commands|memory-commands|solaris-commands|hyperlane-commands)$/i;

function stripOrphanCodeFences(content: string): string {
  return content
    .replace(/```([a-z0-9-]*)\r?\n\s*```/gi, (full, lang) =>
      TOOL_FENCE_LANG_RE.test((lang ?? "").trim()) ? full : "",
    )
    .replace(/\n?```([a-z0-9-]*)\s*(?=\n|$)/gi, (full, lang) =>
      TOOL_FENCE_LANG_RE.test((lang ?? "").trim()) ? full : "",
    );
}

export function parseBareCommands(response: string): ParseCommandsResult {
  const commands: ParsedCommand[] = [];
  const errors: ActionResult[] = [];
  const lines = response.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const spaceIdx = trimmed.indexOf(" ");
    const command =
      spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
    if (!ACTION_COMMAND_NAMES.includes(command as ActionCommandName)) {
      continue;
    }
    const parsed = parseBareCommandLine(trimmed);
    if (parsed) {
      commands.push(parsed);
    } else if (trimmed.includes("{")) {
      const tag = COMMAND_TO_HANDLER_TAG[command as ActionCommandName];
      errors.push({
        type: tag === "orbit-commands" ? "orbit_error" : "command_error",
        handler: tag,
        message: `Invalid JSON for ${command}`,
      });
    }
  }

  return { commands, errors };
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

  const match = cleaned.match(/\s*```([a-z0-9-]*)$/i);
  if (match) {
    const partial = (match[1] ?? "").toLowerCase();
    const isHandlerFencePrefix =
      partial.length >= 5 &&
      handlers.some(({ tag }) => {
        const handlerTag = tag.toLowerCase();
        return handlerTag === partial || handlerTag.startsWith(partial);
      });
    if (isHandlerFencePrefix) {
      cleaned = cleaned.slice(0, cleaned.length - match[0].length).trimEnd();
    }
  }

  return cleaned.trimEnd();
}

/** Strip fenced blocks and bare `COMMAND {...}` lines from visible chat text. */
export function stripActionSyntax(
  content: string,
  handlers: readonly ConstellationHandler[],
): string {
  let cleaned = stripCommandBlocks(content, handlers);
  cleaned = stripGenericCommandFences(cleaned);
  cleaned = cleaned.replace(INLINE_COMMAND_RE, "");
  cleaned = stripBareActionCommands(cleaned);
  cleaned = cleaned.replace(TRAILING_BARE_COMMAND_RE, "");
  cleaned = stripGenericCommandFences(cleaned);
  cleaned = stripOrphanCodeFences(cleaned);
  return cleaned.replace(/\n{3,}/g, "\n\n").trimEnd();
}

export function hasCommandBlocks(
  content: string,
  handlers: readonly ConstellationHandler[],
): boolean {
  const lower = content.toLowerCase();
  return handlers.some(({ tag }) => lower.includes("```" + tag));
}

export function hasActionSyntax(
  content: string,
  handlers: readonly ConstellationHandler[],
): boolean {
  if (hasCommandBlocks(content, handlers)) return true;
  BARE_COMMAND_START_RE.lastIndex = 0;
  if (BARE_COMMAND_START_RE.test(content)) return true;
  for (const match of content.matchAll(/```[a-z0-9-]*\r?\n?([\s\S]*?)```/gi)) {
    if (isActionCommandBody(match[1] ?? "")) return true;
  }
  return false;
}
