"use client";

import type {
  ConstellationHandler,
  ParsedCommand,
  ActionResult,
} from "../constellation-registry";
import { GeneratedFileCard } from "@/components/cards/generated-file-card";
import { fileExportFromCommandArgs } from "@/lib/export-processing";

export const exportHandler: ConstellationHandler = {
  tag: "file-commands",
  name: "Export",
  multiCommand: true,

  promptInstructions: `### Export — downloadable files

Use when the user wants a file to download (PDF, DOCX, TXT, HTML, CSV, JSON, Markdown).

**Visible reply:** ONE short sentence only (e.g. "Your file is ready."). Never paste the document, HTML, markdown, or code in visible chat — the Download button appears automatically; users must not see the full file content in the thread. Never output \`[Actions executed]\` headers or \`Generated file … [id]\` lines — those are internal only.

**Primary:** append ONE or more \`nebula-export\` fences at the very end (after that one sentence). Prefer **multiline** format (models break JSON with long bodies):

\`\`\`nebula-export
format: pdf
filename: quarterly-report.pdf
title: Q4 Report
---
# Executive summary
Revenue grew 12% year over year.
\`\`\`

- **format**: txt | md | html | json | csv | pdf | docx
- **filename**: safe name with extension (e.g. notes.txt, report.pdf)
- **title**: optional display title
- Body after \`---\`: markdown for pdf/docx/md; plain text for txt; full HTML document for html; valid JSON for json; CSV rows for csv
- If you omit \`---\`, put format/filename lines first, then the body on following lines

**Do not** use nebula-artifact or a generic \`\`\`html code block for downloads.
**Do not** use CREATE_NOTE for file exports.

Small payloads only — optional legacy fence:

\`\`\`file-commands
GENERATE_FILE {"format":"txt","filename":"notes.txt","body":"Hello"}
\`\`\``,

  buildContext: () => "",

  async execute(commands: ParsedCommand[]): Promise<ActionResult[]> {
    const results: ActionResult[] = [];
    for (const cmd of commands) {
      if (cmd.command !== "GENERATE_FILE") continue;
      const result = fileExportFromCommandArgs(cmd.args);
      if (result) results.push(result);
    }
    return results;
  },

  ResultCard: GeneratedFileCard,
};
