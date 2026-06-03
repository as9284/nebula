"use client";

import { useState } from "react";
import { Eye, Code2 } from "lucide-react";
import type { CodeArtifact } from "@/types/chat";
import { cn } from "@/lib/utils";
import { ArtifactCodePanel } from "./artifact-code-panel";
import { ArtifactPreviewPane } from "./artifact-preview-pane";

type ArtifactTab = "preview" | "code";

interface CodeArtifactCardProps {
  artifact: CodeArtifact;
}

export function CodeArtifactCard({ artifact }: CodeArtifactCardProps) {
  const [tab, setTab] = useState<ArtifactTab>("preview");
  const title = artifact.title ?? "Preview";

  return (
    <div className="artifact-card mt-3 w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2 sm:px-3">
        <span className="min-w-0 flex-1 text-sm font-medium text-text-primary truncate">
          {title}
        </span>
        <div
          className="flex w-full shrink-0 rounded-lg border border-border p-0.5 sm:w-auto"
          role="tablist"
          aria-label="Artifact view"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "preview"}
            onClick={() => setTab("preview")}
            className={cn(
              "flex min-h-9 flex-1 items-center justify-center gap-1 rounded-md px-3 py-2 text-xs font-medium transition-colors sm:flex-initial sm:px-2.5 sm:py-1",
              tab === "preview"
                ? "bg-surface-hover text-text-primary"
                : "text-text-muted hover:text-text-secondary",
            )}
          >
            <Eye size={13} aria-hidden />
            Preview
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "code"}
            onClick={() => setTab("code")}
            className={cn(
              "flex min-h-9 flex-1 items-center justify-center gap-1 rounded-md px-3 py-2 text-xs font-medium transition-colors sm:flex-initial sm:px-2.5 sm:py-1",
              tab === "code"
                ? "bg-surface-hover text-text-primary"
                : "text-text-muted hover:text-text-secondary",
            )}
          >
            <Code2 size={13} aria-hidden />
            Code
          </button>
        </div>
      </div>

      <div className="artifact-card-body">
        {tab === "preview" ? (
          <ArtifactPreviewPane artifact={artifact} title={title} />
        ) : (
          <div className="artifact-card-pane">
            <ArtifactCodePanel files={artifact.files} entry={artifact.entry} />
          </div>
        )}
      </div>
    </div>
  );
}
