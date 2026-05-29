import { jsonrepair } from "jsonrepair";
import type { ArtifactTemplate } from "./artifact-schema";

/**
 * A file-section header line: three-or-more dashes followed by a path, e.g.
 * `--- /App.tsx`. Tolerant of missing space (`---/App.tsx`), extra dashes,
 * leading indentation, and a missing leading slash — all common in the output
 * of smaller local models. A bare `---` (markdown rule) has no path and so is
 * intentionally NOT treated as a header.
 */
const SECTION_HEADER_RE = /^\s*-{3,}\s*(\/?[\w.\-/]+)\s*$/;

function readMetaValue(block: string, key: string): string | undefined {
  const re = new RegExp(`^${key}\\s*:\\s*(.+)$`, "im");
  const match = block.match(re);
  return match?.[1]?.trim();
}

/** Use the declared template, else infer from file extensions. */
function resolveTemplate(
  declared: string | undefined,
  files: Record<string, string>,
): ArtifactTemplate {
  if (declared === "html" || declared === "react") return declared;
  const paths = Object.keys(files);
  const hasReact = paths.some((p) => /\.(tsx|jsx)$/i.test(p));
  const hasHtml = paths.some((p) => p.endsWith(".html"));
  if (hasHtml && !hasReact) return "html";
  return "react";
}

/**
 * LLM-friendly multiline format (avoids JSON escaping issues). Scans
 * line-by-line so it works even when the model omits the `template:`/`title:`
 * meta block and starts directly with a `--- /path` header.
 */
export function parseMultilineArtifactBody(
  body: string,
): Record<string, unknown> | null {
  const trimmed = body.trim();
  if (!trimmed || trimmed.startsWith("{")) return null;

  const metaLines: string[] = [];
  const files: Record<string, string> = {};
  let currentPath: string | null = null;
  let currentContent: string[] = [];

  const flush = () => {
    if (currentPath) {
      files[currentPath] = currentContent.join("\n").replace(/\s+$/, "");
    }
  };

  for (const line of trimmed.split(/\r?\n/)) {
    const header = line.match(SECTION_HEADER_RE);
    if (header) {
      flush();
      const rawPath = header[1] ?? "";
      currentPath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
      currentContent = [];
      continue;
    }
    if (currentPath) currentContent.push(line);
    else metaLines.push(line);
  }
  flush();

  if (Object.keys(files).length === 0) return null;

  const metaBlock = metaLines.join("\n");
  const payload: Record<string, unknown> = {
    template: resolveTemplate(readMetaValue(metaBlock, "template"), files),
    files,
  };
  const title = readMetaValue(metaBlock, "title");
  if (title) payload.title = title;
  return payload;
}

export function parseArtifactFenceJson(body: string): unknown | null {
  const trimmed = body.trim();
  if (!trimmed.startsWith("{")) return null;

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    try {
      return JSON.parse(jsonrepair(trimmed)) as unknown;
    } catch {
      return null;
    }
  }
}

/** Parse nebula-artifact fence body (JSON, repaired JSON, or multiline). */
export function parseArtifactFenceBody(body: string): unknown | null {
  const trimmed = body.trim();
  if (!trimmed) return null;

  const json = parseArtifactFenceJson(trimmed);
  if (json !== null) return json;

  return parseMultilineArtifactBody(trimmed);
}
