"use client";

import { useState } from "react";
import { Download, FileDown, AlertCircle } from "lucide-react";
import type { ActionResult } from "@/lib/constellation-registry";
import {
  downloadFileExport,
  fileExportFromActionResult,
} from "@/lib/download-export";

interface GeneratedFileCardProps {
  result: ActionResult;
}

export function GeneratedFileCard({ result }: GeneratedFileCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);

  if (result.type === "file_error") {
    return (
      <div className="tool-card flex items-start gap-2 border-destructive/30">
        <AlertCircle
          size={16}
          className="mt-0.5 shrink-0 text-destructive"
          aria-hidden
        />
        <span className="text-sm text-text-secondary">
          {String(result.message ?? "File export failed")}
        </span>
      </div>
    );
  }

  if (result.type !== "file_generated") return null;

  const fileExport = fileExportFromActionResult(result);
  if (!fileExport) return null;

  const label = fileExport.title ?? fileExport.filename;
  const formatLabel = fileExport.format.toUpperCase();

  async function handleDownload() {
    setLoading(true);
    setError(null);
    try {
      await downloadFileExport(fileExport!);
      setDownloaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="tool-card flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-2">
        <FileDown
          size={16}
          className="mt-0.5 shrink-0 text-text-secondary"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text-primary">
            {label}
          </p>
          <p className="text-xs text-text-muted">
            {fileExport.filename} · {formatLabel}
          </p>
          {error ? (
            <p className="mt-1 text-xs text-destructive">{error}</p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={() => void handleDownload()}
        disabled={loading}
        className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-hover px-3 py-2.5 text-xs font-medium text-text-primary transition-colors hover:bg-surface disabled:opacity-50 sm:w-auto sm:py-1.5"
      >
        <Download size={14} aria-hidden />
        {loading ? "Preparing…" : downloaded ? "Download again" : "Download"}
      </button>
    </div>
  );
}
