import type { ExportFormat } from "./export-schema";
import {
  parseNebulaExportFences,
  validateFileExport,
  type FileExport,
} from "./export-schema";

const ALT_EXPORT_FENCE_RE =
  /```(html|htm|markdown|md|txt|text|csv|json)\s*\r?\n([\s\S]*?)```/gi;

const USER_FORMAT_HINT_RE =
  /\b(pdf|docx?|word|html|htm|markdown|md|txt|text|csv|json|download|export|save as|give me a file)\b/i;

function langToFormat(lang: string): ExportFormat | null {
  const n = lang.trim().toLowerCase();
  if (n === "html" || n === "htm") return "html";
  if (n === "markdown" || n === "md") return "md";
  if (n === "txt" || n === "text") return "txt";
  if (n === "csv") return "csv";
  if (n === "json") return "json";
  return null;
}

function detectFormatFromUserMessage(userMessage: string): ExportFormat | null {
  const lower = userMessage.toLowerCase();
  if (/\b(pdf|\.pdf)\b/.test(lower)) return "pdf";
  if (/\b(docx?|word|\.docx)\b/.test(lower)) return "docx";
  if (/\b(html|\.html|htm|web page)\b/.test(lower)) return "html";
  if (/\b(csv|\.csv|spreadsheet)\b/.test(lower)) return "csv";
  if (/\b(json|\.json)\b/.test(lower)) return "json";
  if (/\b(markdown|\.md)\b/.test(lower)) return "md";
  if (/\b(txt|text file|\.txt|plain text)\b/.test(lower)) return "txt";
  if (USER_FORMAT_HINT_RE.test(lower)) return "pdf";
  return null;
}

/** Parse ```html / ```md / etc. as downloadable exports. */
export function parseAlternateExportFences(
  content: string,
  assignId: () => string,
): FileExport[] {
  const exports: FileExport[] = [];

  for (const match of content.matchAll(ALT_EXPORT_FENCE_RE)) {
    const lang = match[1] ?? "";
    const codeBody = (match[2] ?? "").trim();
    const format = langToFormat(lang);
    if (!format || !codeBody) continue;

    const result = validateFileExport({ format, body: codeBody }, assignId);
    if ("export" in result) exports.push(result.export);
  }

  return exports;
}

function stripFencesForBody(raw: string): string {
  let text = raw;
  text = text.replace(ALT_EXPORT_FENCE_RE, "");
  text = text.replace(/```nebula-export\s*\r?\n[\s\S]*?```/gi, "");
  return text.trim();
}

/** When the model ignores nebula-export, infer export from user intent + response body. */
export function inferExportFromIntent(
  userMessage: string,
  rawAssistant: string,
  assignId: () => string,
): FileExport[] {
  const format = detectFormatFromUserMessage(userMessage);
  if (!format) return [];

  const fromAlt = parseAlternateExportFences(rawAssistant, assignId);
  if (fromAlt.length > 0) return [];

  let body = stripFencesForBody(rawAssistant);
  if (format === "html" && body && !/<html[\s>]/i.test(body)) {
    body = `<!DOCTYPE html>\n<html><head><meta charset="utf-8"><title>Export</title></head><body>\n${body}\n</body></html>`;
  }

  if (body.length < 20) return [];

  const result = validateFileExport({ format, body }, assignId);
  return "export" in result ? [result.export] : [];
}

export function extractAllExportsFromContent(
  content: string,
  assignId: () => string,
  userMessage?: string,
): { exports: FileExport[]; errors: { message: string }[] } {
  const { exports: primary, errors } = parseNebulaExportFences(content, assignId);
  const seen = new Set(primary.map((e) => e.id));
  const merged = [...primary];

  for (const alt of parseAlternateExportFences(content, assignId)) {
    if (seen.has(alt.id)) continue;
    seen.add(alt.id);
    merged.push(alt);
  }

  if (userMessage && merged.length === 0) {
    for (const inferred of inferExportFromIntent(userMessage, content, assignId)) {
      if (seen.has(inferred.id)) continue;
      seen.add(inferred.id);
      merged.push(inferred);
    }
  }

  return { exports: merged, errors };
}
