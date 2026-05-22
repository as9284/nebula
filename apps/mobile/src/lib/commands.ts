import {
  parseCommands,
  hasCommandBlocks,
  stripCommandBlocks,
  type ActionResult,
} from "@nebula/core/constellation-registry";
import { constellationHandlers } from "./constellations";

export async function executeCommandsFromResponse(
  content: string,
): Promise<{ cleaned: string; results: ActionResult[] }> {
  if (!hasCommandBlocks(content, constellationHandlers)) {
    return { cleaned: content, results: [] };
  }

  const allResults: ActionResult[] = [];

  for (const handler of constellationHandlers) {
    const commands = parseCommands(
      content,
      handler.tag,
      handler.multiCommand,
    );
    if (commands.length > 0) {
      const results = await handler.execute(commands);
      allResults.push(...results);
    }
  }

  const cleaned = stripCommandBlocks(content, constellationHandlers);
  return { cleaned, results: allResults };
}
