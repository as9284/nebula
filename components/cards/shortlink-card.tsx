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
      <Link size={14} className="shrink-0 text-text-secondary" />
      <div className="flex flex-col gap-1 min-w-0 flex-1">
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
      <button
        type="button"
        onClick={copy}
        className="p-1.5 rounded-md hover:bg-surface-hover text-text-secondary"
        title="Copy"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
      <a
        href={short}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 rounded-md hover:bg-surface-hover text-text-secondary"
        title="Open"
      >
        <ExternalLink size={14} />
      </a>
    </div>
  );
}
