import { jsonrepair } from "jsonrepair";
import type { ExportFormat } from "./export-schema";
import { EXPORT_FORMATS } from "./export-schema";

const META_BODY_SPLIT_RE = /\r?\n---\r?\n/;

function readMetaValue(block: string, key: string): string | undefined {
  const re = new RegExp(`^${key}\\s*:\\s*(.+)$`, "im");
  const match = block.match(re);
  return match?.[1]?.trim();
}

function parseFormat(raw: string | undefined): ExportFormat | null {
  if (!raw) return null;
  const normalized = raw.trim().toLowerCase() as ExportFormat;
  return EXPORT_FORMATS.includes(normalized) ? normalized : null;
}

/** LLM-friendly multiline format: meta lines, then ---, then body. */
export function parseMultilineExportBody(
  body: string,
): Record<string, unknown> | null {
  const trimmed = body.trim();
  if (!trimmed || trimmed.startsWith("{")) return null;
  if (!META_BODY_SPLIT_RE.test(trimmed)) return null;

  const parts = trimmed.split(META_BODY_SPLIT_RE);
  if (parts.length < 2) return null;

  const metaBlock = parts[0] ?? "";
  const exportBody = parts.slice(1).join("\n---\n").replace(/\s+$/, "");
  if (!exportBody.trim()) return null;

  const format = parseFormat(readMetaValue(metaBlock, "format"));
  if (!format) return null;

  const payload: Record<string, unknown> = {
    format,
    body: exportBody,
  };

  const filename = readMetaValue(metaBlock, "filename");
  if (filename) payload.filename = filename;
  const title = readMetaValue(metaBlock, "title");
  if (title) payload.title = title;

  return payload;
}

export function parseExportFenceJson(body: string): unknown | null {
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

/** Parse nebula-export fence body (JSON, repaired JSON, or multiline meta + --- body). */
export function parseExportFenceBody(body: string): unknown | null {
  const trimmed = body.trim();
  if (!trimmed) return null;

  const json = parseExportFenceJson(trimmed);
  if (json !== null) return json;

  return parseMultilineExportBody(trimmed);
}
