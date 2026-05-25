import type { FileExport } from "./export-schema";

const MAX_VISIBLE_EXPORT_CHARS = 280;

/** Short user-facing line when a file export succeeded. */
export function defaultExportAckMessage(exports: FileExport[]): string {
  if (exports.length === 0) return "";
  if (exports.length === 1) {
    const label = exports[0].title ?? exports[0].filename;
    return `Your file is ready — download **${label}** below.`;
  }
  return `Your ${exports.length} files are ready — download below.`;
}

function normalizeForCompare(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

/** Hide duplicated document bodies from visible chat when content lives in the export fence. */
export function resolveExportDisplayMessage(
  display: string,
  exports: FileExport[],
): string {
  if (exports.length === 0) return display;

  const trimmed = display.trim();
  const ack = defaultExportAckMessage(exports);

  if (!trimmed) return ack;

  const normalizedDisplay = normalizeForCompare(trimmed);

  for (const exp of exports) {
    const body = exp.body.trim();
    if (!body) continue;

    const normalizedBody = normalizeForCompare(body);

    if (normalizedDisplay === normalizedBody) {
      return ack;
    }

    if (normalizedBody.length >= 40) {
      const prefix = normalizedBody.slice(0, Math.min(160, normalizedBody.length));
      if (prefix.length >= 40 && normalizedDisplay.includes(prefix)) {
        return ack;
      }
    }

    if (
      trimmed.length > 400 &&
      Math.abs(trimmed.length - body.length) / Math.max(body.length, 1) < 0.2
    ) {
      return ack;
    }
  }

  if (trimmed.length > MAX_VISIBLE_EXPORT_CHARS && exports.length > 0) {
    const looksLikeDocument =
      /^#\s|^\s*[-*]\s|<!doctype|<html[\s>]|^<\?xml|^%pdf-/im.test(trimmed) ||
      (trimmed.match(/\n/g)?.length ?? 0) > 12;
    if (looksLikeDocument) return ack;
  }

  return trimmed;
}
