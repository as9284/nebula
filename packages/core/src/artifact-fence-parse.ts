import { jsonrepair } from "jsonrepair";
import type { ArtifactTemplate } from "./artifact-schema";

const MULTILINE_FILE_SPLIT_RE = /\r?\n---\s+(\/?[\w./-]+)\s*\r?\n/;

function readMetaValue(block: string, key: string): string | undefined {
  const re = new RegExp(`^${key}\\s*:\\s*(.+)$`, "im");
  const match = block.match(re);
  return match?.[1]?.trim();
}

/** LLM-friendly multiline format (avoids JSON escaping issues). */
export function parseMultilineArtifactBody(
  body: string,
): Record<string, unknown> | null {
  const trimmed = body.trim();
  if (!trimmed || trimmed.startsWith("{")) return null;
  if (!MULTILINE_FILE_SPLIT_RE.test(trimmed)) return null;

  const sections = trimmed.split(MULTILINE_FILE_SPLIT_RE);
  if (sections.length < 3) return null;

  const metaBlock = sections[0] ?? "";
  const templateRaw = readMetaValue(metaBlock, "template");
  const template: ArtifactTemplate =
    templateRaw === "html" ? "html" : "react";

  const files: Record<string, string> = {};
  for (let i = 1; i < sections.length; i += 2) {
    const rawPath = sections[i];
    const content = (sections[i + 1] ?? "").replace(/\s+$/, "");
    if (!rawPath) continue;
    const path = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
    files[path] = content;
  }

  if (Object.keys(files).length === 0) return null;

  const payload: Record<string, unknown> = { template, files };
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
