import type {
  ConstellationHandler,
  ParsedCommand,
  ActionResult,
} from "@nebula/core/constellation-registry";
import { ActionResultCard } from "@/components/cards/action-result";

let sandboxPayload: Record<string, unknown> | null = null;

export function getSandboxPayload() {
  return sandboxPayload;
}

export function clearSandboxPayload() {
  sandboxPayload = null;
}

export const sandboxHandler: ConstellationHandler = {
  tag: "sandbox-commands",
  name: "Sandbox",
  multiCommand: false,

  promptInstructions: `### Sandbox — inline previews
\`\`\`sandbox-commands
OPEN_SANDBOX {"type":"code|plan|chart","content":"..."}
\`\`\`
Use for code snippets, plans, or chart JSON the user should inspect.`,

  buildContext: () => "",

  async execute(commands: ParsedCommand[]): Promise<ActionResult[]> {
    const cmd = commands[0];
    if (!cmd) return [];
    sandboxPayload = {
      type: cmd.args.type ?? "code",
      content: cmd.args.content,
      title: cmd.args.title,
      data: cmd.args.data,
    };
    return [
      {
        type: "sandbox_open",
        handler: "sandbox-commands",
        sandboxType: cmd.args.type,
      },
    ];
  },

  ResultCard: ActionResultCard,
};
