"use client";

import { useState } from "react";
import { Link, Copy, Check, ExternalLink } from "lucide-react";
import type { ActionResult } from "@/lib/constellation-registry";

export function ShortlinkCard({ result }: { result: ActionResult }) {
  const [copied, setCopied] = useState(false);

  if (result.type === "short_url_error") {
    return (
      <div className="tool-card tool-card-error">
        <Link size={14} />
        <span>Could not shorten: {String(result.error)}</span>
      </div>
    );
  }

  const short = String(result.short);
  const original = String(result.original);

  const copy = () => {
    void navigator.clipboard.writeText(short).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="tool-card">
      <Link size={14} className="shrink-0 text-text-secondary max-sm:mt-0.5" />
      <div className="min-w-0 flex-1 basis-[min(100%,12rem)] flex flex-col gap-1">
        <a
          href={short}
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-primary hover:underline truncate text-sm font-medium"
        >
          {short}
        </a>
        <span className="text-text-secondary text-xs truncate">{original}</span>
      </div>
      <div className="ml-auto flex shrink-0 gap-0.5">
      <button
        type="button"
        onClick={copy}
        aria-label="Copy short link"
        className="flex min-h-9 min-w-9 items-center justify-center rounded-md p-2 text-text-secondary hover:bg-surface-hover sm:min-h-0 sm:min-w-0 sm:p-1.5"
      >
        {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
      </button>
      <a
        href={short}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open short link"
        className="flex min-h-9 min-w-9 items-center justify-center rounded-md p-2 text-text-secondary hover:bg-surface-hover sm:min-h-0 sm:min-w-0 sm:p-1.5"
      >
        <ExternalLink size={14} aria-hidden />
      </a>
      </div>
    </div>
  );
}
