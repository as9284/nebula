import type { ParsedCommand } from "./constellation-registry";

export interface SlashCommand {
  name: string;
  aliases: string[];
  handlerTag: string;
  handlerCommand: string;
  requiresArg: boolean;
  parseArgs: (raw: string) => Record<string, unknown> | null;
}

function parseLocation(raw: string) {
  const location = raw.trim();
  return location ? { location } : null;
}

function parseUrl(raw: string) {
  const url = raw.trim();
  if (!url) return null;
  const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  return { url: normalized };
}

function parseTask(raw: string) {
  const title = raw.trim();
  return title ? { title, priority: "medium" } : null;
}

function parseNote(raw: string) {
  const title = raw.trim();
  return title ? { title } : null;
}

export const SLASH_COMMANDS: readonly SlashCommand[] = [
  {
    name: "weather",
    aliases: ["forecast"],
    handlerTag: "solaris-commands",
    handlerCommand: "GET_WEATHER",
    requiresArg: true,
    parseArgs: parseLocation,
  },
  {
    name: "shorten",
    aliases: ["short", "link"],
    handlerTag: "hyperlane-commands",
    handlerCommand: "SHORTEN_URL",
    requiresArg: true,
    parseArgs: parseUrl,
  },
  {
    name: "task",
    aliases: ["todo"],
    handlerTag: "orbit-commands",
    handlerCommand: "CREATE_TASK",
    requiresArg: true,
    parseArgs: parseTask,
  },
  {
    name: "note",
    aliases: [],
    handlerTag: "orbit-commands",
    handlerCommand: "CREATE_NOTE",
    requiresArg: true,
    parseArgs: parseNote,
  },
];

export function resolveSlashInput(
  input: string,
): { command: SlashCommand; rawArgs: string } | null {
  const body = input.slice(1).trimStart();
  const spaceIdx = body.indexOf(" ");
  const typed = spaceIdx === -1 ? body : body.slice(0, spaceIdx);
  const rawArgs = spaceIdx === -1 ? "" : body.slice(spaceIdx + 1);
  const q = typed.toLowerCase();
  const match = SLASH_COMMANDS.find(
    (cmd) => cmd.name === q || cmd.aliases.includes(q),
  );
  return match ? { command: match, rawArgs } : null;
}

export function slashToParsedCommands(
  input: string,
): { tag: string; commands: ParsedCommand[] } | null {
  const resolved = resolveSlashInput(input);
  if (!resolved) return null;
  const args = resolved.command.parseArgs(resolved.rawArgs);
  if (resolved.command.requiresArg && !args) return null;
  return {
    tag: resolved.command.handlerTag,
    commands: [
      {
        command: resolved.command.handlerCommand,
        args: args ?? {},
      },
    ],
  };
}
