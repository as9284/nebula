"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import type { CodeArtifact } from "@/types/chat";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { ArtifactPreviewErrorBoundary } from "./artifact-preview-error";
import {
  isElementFullscreen,
  toggleElementFullscreen,
} from "@/lib/fullscreen";

const ReactArtifactPreview = dynamic(
  () =>
    import("./react-artifact-preview").then((m) => m.ReactArtifactPreview),
  { ssr: false, loading: () => <ArtifactPreviewSkeleton />,
  },
);

const HtmlArtifactPreview = dynamic(
  () =>
    import("./html-artifact-preview").then((m) => m.HtmlArtifactPreview),
  { ssr: false, loading: () => <ArtifactPreviewSkeleton />,
  },
);

function ArtifactPreviewSkeleton() {
  return (
    <div className="flex h-full min-h-0 items-center justify-center text-xs text-text-muted">
      Loading preview…
    </div>
  );
}

interface ArtifactPreviewPaneProps {
  artifact: CodeArtifact;
  title: string;
}

export function ArtifactPreviewPane({
  artifact,
  title,
}: ArtifactPreviewPaneProps) {
  const paneRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const syncFullscreen = useCallback(() => {
    setFullscreen(isElementFullscreen(paneRef.current));
  }, []);

  useEffect(() => {
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () =>
      document.removeEventListener("fullscreenchange", syncFullscreen);
  }, [syncFullscreen]);

  const handleToggleFullscreen = () => {
    void toggleElementFullscreen(paneRef.current);
  };

  return (
    <div
      ref={paneRef}
      className={cn(
        "artifact-card-pane artifact-preview-pane",
        fullscreen && "artifact-preview-pane--fullscreen",
      )}
    >
      <button
        type="button"
        onClick={handleToggleFullscreen}
        aria-label={fullscreen ? "Exit fullscreen preview" : "Fullscreen preview"}
        title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
        className={cn(
          "absolute right-2 top-2 z-20 flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs",
          "bg-surface/90 text-text-secondary backdrop-blur-sm",
          "hover:text-text-primary hover:bg-surface-hover",
        )}
      >
        {fullscreen ? (
          <Minimize2 size={14} aria-hidden />
        ) : (
          <Maximize2 size={14} aria-hidden />
        )}
        <span className="hidden sm:inline">
          {fullscreen ? "Exit" : "Fullscreen"}
        </span>
      </button>
      <ArtifactPreviewErrorBoundary>
        {artifact.template === "html" ? (
          <HtmlArtifactPreview artifact={artifact} />
        ) : (
          <ReactArtifactPreview artifact={artifact} />
        )}
      </ArtifactPreviewErrorBoundary>
      {fullscreen ? (
        <span className="sr-only">{title} preview fullscreen</span>
      ) : null}
    </div>
  );
}
