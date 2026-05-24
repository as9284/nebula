"use client";

import type {
  ConstellationHandler,
  ParsedCommand,
  ActionResult,
} from "../constellation-registry";
import {
  validateCodeArtifact,
  type CodeArtifact,
} from "@nebula/core/artifact-schema";
import { generateId } from "@/lib/utils";

let sandboxPayload: Record<string, unknown> | null = null;

export function getSandboxPayload() {
  return sandboxPayload;
}

export function clearSandboxPayload() {
  sandboxPayload = null;
}

function artifactFromOpenSandboxArgs(
  args: Record<string, unknown>,
): { artifact: CodeArtifact } | { error: string } {
  const template =
    args.template === "html" || args.type === "html"
      ? "html"
      : args.template === "react" || args.type === "ui" || args.type === "react"
        ? "react"
        : null;

  if (!template) {
    return { error: "OPEN_SANDBOX ui type requires template react or html" };
  }

  const files = args.files as Record<string, string> | undefined;
  if (!files || typeof files !== "object") {
    return { error: "OPEN_SANDBOX ui type requires a files object" };
  }

  return validateCodeArtifact(
    {
      title: args.title,
      template,
      files,
      entry: args.entry,
      dependencies: args.dependencies,
    },
    generateId,
  );
}

function SandboxCard({ result }: { result: ActionResult }) {
  if (result.type === "ui_artifact") return null;

  const type = String(result.sandboxType ?? "code");
  return (
    <div className="tool-card">
      <span className="text-text-secondary text-sm">
        Sandbox opened ({type}) — check the side panel
      </span>
    </div>
  );
}

export const sandboxHandler: ConstellationHandler = {
  tag: "sandbox-commands",
  name: "Sandbox",
  multiCommand: false,

  promptInstructions: `### Sandbox — code previews & UI artifacts

**Live UI (components, pages, animations):** append a \`nebula-artifact\` fence at the very end with valid JSON (no trailing commas). Do not repeat the full source in visible prose.

\`\`\`nebula-artifact
{"title":"Neon button","template":"react","files":{"/App.tsx":"export default function App() { return <button style={{...}}>Click</button>; }"}}
\`\`\`

- **template "react"**: interactive React demo. Default export from \`/App.tsx\` (or \`/App.jsx\`). Add \`/styles.css\` in files if needed. Optional \`dependencies\` (allowlist only): react, react-dom, framer-motion, lucide-react, clsx.
- **template "html"**: static page in \`/index.html\` plus optional \`/styles.css\`, \`/script.js\`. No remote script URLs.
- **Iterations** ("make it brighter", "add hover"): emit a new artifact in this reply; reference the prior title briefly in prose.
- **Complex UIs**: use multiple files (e.g. \`/App.tsx\`, \`/components/Card.tsx\`).

**Legacy text sandbox** (plans, raw snippets, chart JSON — no live preview):

\`\`\`sandbox-commands
OPEN_SANDBOX {"type":"code|plan|chart","content":"..."}
\`\`\`

Optional UI via command (prefer nebula-artifact fence for large code):

\`\`\`sandbox-commands
OPEN_SANDBOX {"type":"ui","title":"...","template":"react|html","files":{"/App.tsx":"..."}}
\`\`\``,

  buildContext: () => "",

  async execute(commands: ParsedCommand[]): Promise<ActionResult[]> {
    const cmd = commands[0];
    if (!cmd) return [];

    const sandboxType = String(cmd.args.type ?? "code");

    if (
      sandboxType === "ui" ||
      sandboxType === "react" ||
      sandboxType === "html" ||
      cmd.args.files
    ) {
      const parsed = artifactFromOpenSandboxArgs(cmd.args);
      if ("error" in parsed) {
        return [
          {
            type: "command_error",
            handler: "sandbox-commands",
            message: parsed.error,
          },
        ];
      }
      return [
        {
          type: "ui_artifact",
          handler: "sandbox-commands",
          artifact: parsed.artifact,
        },
      ];
    }

    sandboxPayload = {
      type: sandboxType,
      content: cmd.args.content,
      title: cmd.args.title,
      data: cmd.args.data,
    };
    return [
      {
        type: "sandbox_open",
        handler: "sandbox-commands",
        sandboxType,
      },
    ];
  },

  ResultCard: SandboxCard,
};
