"use client";

import {
  BINARY_EXPORT_FORMATS,
  TEXT_EXPORT_FORMATS,
  type ExportFormat,
  type FileExport,
} from "@nebula/core/export-schema";

const MIME_BY_FORMAT: Record<ExportFormat, string> = {
  txt: "text/plain;charset=utf-8",
  md: "text/markdown;charset=utf-8",
  html: "text/html;charset=utf-8",
  json: "application/json;charset=utf-8",
  csv: "text/csv;charset=utf-8",
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadTextExport(fileExport: FileExport): void {
  const mime = MIME_BY_FORMAT[fileExport.format];
  const blob = new Blob([fileExport.body], { type: mime });
  triggerBlobDownload(blob, fileExport.filename);
}

export async function downloadBinaryExport(fileExport: FileExport): Promise<void> {
  if (!BINARY_EXPORT_FORMATS.has(fileExport.format)) {
    throw new Error(`Format ${fileExport.format} is not a server export`);
  }

  const res = await fetch("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      format: fileExport.format,
      filename: fileExport.filename,
      title: fileExport.title,
      body: fileExport.body,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message =
      typeof err?.error === "string" ? err.error : `Export failed (${res.status})`;
    throw new Error(message);
  }

  const blob = await res.blob();
  triggerBlobDownload(blob, fileExport.filename);
}

export async function downloadFileExport(fileExport: FileExport): Promise<void> {
  if (TEXT_EXPORT_FORMATS.has(fileExport.format)) {
    downloadTextExport(fileExport);
    return;
  }
  await downloadBinaryExport(fileExport);
}

export function fileExportFromActionResult(result: ActionResultLike): FileExport | null {
  if (result.type !== "file_generated") return null;
  const format = result.format as ExportFormat | undefined;
  const body = String(result.body ?? "");
  const filename = String(result.filename ?? "");
  const id = String(result.id ?? "");
  if (!format || !body || !filename || !id) return null;
  return {
    id,
    format,
    filename,
    title: result.title ? String(result.title) : undefined,
    body,
  };
}

interface ActionResultLike {
  type: string;
  format?: unknown;
  filename?: unknown;
  title?: unknown;
  body?: unknown;
  id?: unknown;
}
