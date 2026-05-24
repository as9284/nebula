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

**Live UI (components, pages, animations):** append ONE \`nebula-artifact\` fence at the very end. Do not repeat full source in visible prose. Prefer the **multiline** format below (models often break JSON when code spans multiple lines).

\`\`\`nebula-artifact
template: react
title: Neon button
--- /App.tsx
export default function App() {
  return <button className="neon">Click me</button>;
}
--- /styles.css
.neon {
  color: #0ff;
  text-shadow: 0 0 8px #0ff, 0 0 20px #0ff;
  background: #111;
  border: 1px solid #0ff;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
}
\`\`\`

Single-line JSON is allowed only if all code strings use \\n for newlines (no raw line breaks inside JSON strings).

- **template "react"**: interactive React demo. Default export from \`/App.tsx\` (or \`/App.jsx\`). Add \`/styles.css\` via a \`--- /styles.css\` section. Optional JSON \`dependencies\` (allowlist only): react, react-dom, framer-motion, lucide-react, clsx.
- **template "html"**: static page in \`/index.html\` plus optional \`/styles.css\`, \`/script.js\`. No remote script URLs.
- **Iterations** ("make it brighter", "add hover"): emit a new artifact in this reply; reference the prior title briefly in prose.
- **Complex UIs**: use multiple files (e.g. \`/App.tsx\`, \`/components/Card.tsx\`).
- **Full pages** (news sites, dashboards, landing pages): use \`template: html\` with \`/index.html\`, \`/styles.css\`, optional \`/script.js\`. Keep CSS concise (under ~80KB total). Always include brief visible prose before the fence.
- **Never** end with only internal reasoning and no user-visible reply + artifact. If the build is large, stream a short status line in prose first, then the artifact fence.

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
