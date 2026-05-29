import { jsonrepair } from "jsonrepair";
import type { ExportFormat } from "./export-schema";
import { EXPORT_FORMATS } from "./export-schema";

const META_BODY_SPLIT_RE = /\r?\n---\r?\n/;

function readMetaValue(block: string, key: string): string | undefined {
  const re = new RegExp(`^${key}\\s*:\\s*(.+)$`, "im");
  const match = block.match(re);
  return match?.[1]?.trim();
}

function readMetaValueAnyCase(block: string, key: string): string | undefined {
  const re = new RegExp(`^${key}\\s*:\\s*(.+)$`, "im");
  const match = block.match(re);
  return match?.[1]?.trim();
}

function parseFormat(raw: string | undefined): ExportFormat | null {
  if (!raw) return null;
  const normalized = raw.trim().toLowerCase() as ExportFormat;
  return EXPORT_FORMATS.includes(normalized) ? normalized : null;
}

const EXTENSION_FORMAT: Record<string, ExportFormat> = {
  ".txt": "txt",
  ".md": "md",
  ".markdown": "md",
  ".html": "html",
  ".htm": "html",
  ".json": "json",
  ".csv": "csv",
  ".pdf": "pdf",
  ".docx": "docx",
};

/** Map a filename's extension to an export format (e.g. report.pdf → pdf). */
function formatFromFilename(filename: string | undefined): ExportFormat | null {
  if (!filename) return null;
  const dot = filename.lastIndexOf(".");
  if (dot < 0) return null;
  return EXTENSION_FORMAT[filename.slice(dot).toLowerCase()] ?? null;
}

/**
 * The declared `format:` if valid, else inferred from the `filename:` extension.
 * Smaller local models often give one but not the other.
 */
function resolveFormat(metaBlock: string): ExportFormat | null {
  return (
    parseFormat(readMetaValueAnyCase(metaBlock, "format")) ??
    formatFromFilename(readMetaValueAnyCase(metaBlock, "filename"))
  );
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

  const format = resolveFormat(metaBlock);
  if (!format) return null;

  const payload: Record<string, unknown> = {
    format,
    body: exportBody,
  };

  const filename = readMetaValueAnyCase(metaBlock, "filename");
  if (filename) payload.filename = filename;
  const title = readMetaValueAnyCase(metaBlock, "title");
  if (title) payload.title = title;

  return payload;
}

/** Meta lines at top without a --- separator before body. */
export function parseMetaOnlyExportBody(
  body: string,
): Record<string, unknown> | null {
  const trimmed = body.trim();
  if (!trimmed || trimmed.startsWith("{")) return null;

  const format = resolveFormat(trimmed);
  if (!format) return null;

  const lines = trimmed.split("\n");
  const bodyStart = lines.findIndex((line, idx) => {
    if (idx === 0) return false;
    const t = line.trim();
    return t.length > 0 && !/^[a-z]+\s*:/i.test(t);
  });
  if (bodyStart === -1) return null;

  const metaBlock = lines.slice(0, bodyStart).join("\n");
  const exportBody = lines.slice(bodyStart).join("\n").trim();
  if (!exportBody) return null;

  const payload: Record<string, unknown> = { format, body: exportBody };
  const filename = readMetaValueAnyCase(metaBlock, "filename");
  if (filename) payload.filename = filename;
  const title = readMetaValueAnyCase(metaBlock, "title");
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

  const multiline = parseMultilineExportBody(trimmed);
  if (multiline !== null) return multiline;

  return parseMetaOnlyExportBody(trimmed);
}
