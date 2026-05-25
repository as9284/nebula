import { stripNebulaArtifactFences, hasNebulaArtifactFences } from "@nebula/core/artifact-schema";
import { stripNebulaExportFences, hasNebulaExportFences } from "@nebula/core/export-schema";
import {
  parseCommandsDetailed,
  parseBareCommands,
  COMMAND_TO_HANDLER_TAG,
  hasActionSyntax,
  stripActionSyntax,
  type ActionResult,
  type ParsedCommand,
} from "./constellation-registry";
import { constellationHandlers } from "./constellations";

function commandKey(cmd: ParsedCommand): string {
  return `${cmd.command}:${JSON.stringify(cmd.args)}`;
}

function mergeCommands(
  fenced: ParsedCommand[],
  bare: ParsedCommand[],
): ParsedCommand[] {
  const seen = new Set(fenced.map(commandKey));
  const merged = [...fenced];
  for (const cmd of bare) {
    const key = commandKey(cmd);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(cmd);
  }
  return merged;
}

function groupBareCommandsByHandler(
  commands: ParsedCommand[],
): Map<string, ParsedCommand[]> {
  const map = new Map<string, ParsedCommand[]>();
  for (const cmd of commands) {
    const tag =
      COMMAND_TO_HANDLER_TAG[
        cmd.command as keyof typeof COMMAND_TO_HANDLER_TAG
      ];
    if (!tag) continue;
    const list = map.get(tag) ?? [];
    list.push(cmd);
    map.set(tag, list);
  }
  return map;
}

function stripInlineModelFences(content: string): string {
  return stripNebulaExportFences(stripNebulaArtifactFences(content));
}

export async function executeCommandsFromResponse(
  content: string,
): Promise<{ cleaned: string; results: ActionResult[] }> {
  const hasFences =
    hasNebulaArtifactFences(content) || hasNebulaExportFences(content);
  if (!hasActionSyntax(content, constellationHandlers) && !hasFences) {
    return { cleaned: content, results: [] };
  }

  const allResults: ActionResult[] = [];
  const bare = parseBareCommands(content);
  if (bare.errors.length > 0) {
    allResults.push(...bare.errors);
  }
  const bareByHandler = groupBareCommandsByHandler(bare.commands);

  for (const handler of constellationHandlers) {
    const fenced = parseCommandsDetailed(
      content,
      handler.tag,
      handler.multiCommand,
    );
    const commands = mergeCommands(
      fenced.commands,
      bareByHandler.get(handler.tag) ?? [],
    );
    if (fenced.errors.length > 0) {
      allResults.push(...fenced.errors);
    }
    if (commands.length > 0) {
      const results = await handler.execute(commands);
      allResults.push(...results);
    }
  }

  const cleaned = stripInlineModelFences(
    stripActionSyntax(content, constellationHandlers),
  );
  return { cleaned, results: allResults };
}
