import { z } from "zod";
import { parseExportFenceBody } from "./export-fence-parse";

export const EXPORT_FORMATS = [
  "txt",
  "md",
  "html",
  "json",
  "csv",
  "pdf",
  "docx",
] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const TEXT_EXPORT_FORMATS = new Set<ExportFormat>([
  "txt",
  "md",
  "html",
  "json",
  "csv",
]);

export const BINARY_EXPORT_FORMATS = new Set<ExportFormat>(["pdf", "docx"]);

export const MAX_EXPORT_BODY_BYTES = 500_000;
export const MAX_EXPORT_FILENAME_LENGTH = 200;

const FORMAT_EXTENSION: Record<ExportFormat, string> = {
  txt: ".txt",
  md: ".md",
  html: ".html",
  json: ".json",
  csv: ".csv",
  pdf: ".pdf",
  docx: ".docx",
};

const SAFE_FILENAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

const exportPayloadSchema = z.object({
  id: z.string().optional(),
  format: z.enum(EXPORT_FORMATS),
  filename: z.string().max(MAX_EXPORT_FILENAME_LENGTH).optional(),
  title: z.string().max(200).optional(),
  body: z.string(),
});

export type FileExport = {
  id: string;
  format: ExportFormat;
  filename: string;
  title?: string;
  body: string;
};

export type ExportParseResult = {
  exports: FileExport[];
  errors: { message: string }[];
};

function sanitizeFilename(raw: string | undefined, format: ExportFormat, id: string): string {
  const ext = FORMAT_EXTENSION[format];
  let name = (raw ?? "").trim().replace(/\\/g, "/");
  const slash = name.lastIndexOf("/");
  if (slash >= 0) name = name.slice(slash + 1);
  name = name.replace(/\.\./g, "").trim();
  if (!name) return `export-${id}${ext}`;
  if (!name.toLowerCase().endsWith(ext)) {
    const dot = name.lastIndexOf(".");
    if (dot > 0) name = name.slice(0, dot);
    name = `${name}${ext}`;
  }
  if (!SAFE_FILENAME_RE.test(name)) {
    const base = name
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, MAX_EXPORT_FILENAME_LENGTH - ext.length);
    name = `${base || `export-${id}`}${ext}`;
  }
  return name.slice(0, MAX_EXPORT_FILENAME_LENGTH);
}

/** Validate and normalize a parsed export payload (assigns id if missing). */
export function validateFileExport(
  raw: unknown,
  assignId: () => string,
): { export: FileExport } | { error: string } {
  const parsed = exportPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid export payload" };
  }

  const body = parsed.data.body;
  const bytes = new TextEncoder().encode(body).length;
  if (bytes > MAX_EXPORT_BODY_BYTES) {
    return {
      error: `Export body too large (max ${MAX_EXPORT_BODY_BYTES} bytes)`,
    };
  }

  if (body.trim().length === 0) {
    return { error: "Export body must not be empty" };
  }

  const id = parsed.data.id?.trim() || assignId();
  const format = parsed.data.format;
  const filename = sanitizeFilename(parsed.data.filename, format, id);

  if (format === "json") {
    try {
      JSON.parse(body);
    } catch {
      return { error: "JSON export body must be valid JSON" };
    }
  }

  return {
    export: {
      id,
      format,
      filename,
      title: parsed.data.title?.trim() || undefined,
      body,
    },
  };
}

const EXPORT_FENCE_RE = /```nebula-export\s*\r?\n([\s\S]*?)```/gi;

const TRAILING_EXPORT_FENCE_RE = /```nebula-export\s*\r?\n[\s\S]*$/i;

/** Extract validated exports from nebula-export fenced blocks. */
export function parseNebulaExportFences(
  content: string,
  assignId: () => string,
): ExportParseResult {
  const exports: FileExport[] = [];
  const errors: { message: string }[] = [];

  for (const match of content.matchAll(EXPORT_FENCE_RE)) {
    const body = (match[1] ?? "").trim();
    if (!body) {
      errors.push({ message: "Empty nebula-export block" });
      continue;
    }
    const json = parseExportFenceBody(body);
    if (json === null) {
      errors.push({
        message:
          "Could not parse nebula-export block (use format/filename meta + --- body, or JSON)",
      });
      continue;
    }
    const result = validateFileExport(json, assignId);
    if ("error" in result) {
      errors.push({ message: result.error });
    } else {
      exports.push(result.export);
    }
  }

  return { exports, errors };
}

/** Remove nebula-export fences and trailing partial fences from visible chat text. */
const ALT_EXPORT_FENCE_RE =
  /```(html|htm|markdown|md|txt|text|csv|json)\s*\r?\n[\s\S]*?```/gi;

export function stripAlternateExportFences(content: string): string {
  return content.replace(ALT_EXPORT_FENCE_RE, "").replace(/\n{3,}/g, "\n\n").trimEnd();
}

export function stripNebulaExportFences(content: string): string {
  let cleaned = content.replace(EXPORT_FENCE_RE, "");
  cleaned = cleaned.replace(ALT_EXPORT_FENCE_RE, "");
  cleaned = cleaned.replace(TRAILING_EXPORT_FENCE_RE, "");
  const partial = cleaned.match(/\s*```nebula-export\s*$/i);
  if (partial) {
    cleaned = cleaned.slice(0, cleaned.length - partial[0].length).trimEnd();
  }
  return cleaned.replace(/\n{3,}/g, "\n\n").trimEnd();
}

export function hasNebulaExportFences(content: string): boolean {
  EXPORT_FENCE_RE.lastIndex = 0;
  return EXPORT_FENCE_RE.test(content) || TRAILING_EXPORT_FENCE_RE.test(content);
}
