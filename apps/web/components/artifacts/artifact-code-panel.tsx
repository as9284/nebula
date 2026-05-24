"use client";

import { useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArtifactCodePanelProps {
  files: Record<string, string>;
  entry?: string;
  className?: string;
}

function languageFromPath(path: string): string | undefined {
  if (path.endsWith(".tsx")) return "tsx";
  if (path.endsWith(".ts")) return "typescript";
  if (path.endsWith(".jsx")) return "jsx";
  if (path.endsWith(".js")) return "javascript";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".html")) return "html";
  if (path.endsWith(".json")) return "json";
  return undefined;
}

export function ArtifactCodePanel({
  files,
  entry,
  className,
}: ArtifactCodePanelProps) {
  const paths = useMemo(() => Object.keys(files).sort(), [files]);
  const [activePath, setActivePath] = useState(
    () => entry && files[entry] ? entry : (paths[0] ?? ""),
  );
  const [copied, setCopied] = useState(false);

  const activeContent = files[activePath] ?? "";
  const lang = languageFromPath(activePath);

  const handleCopy = async () => {
    const all = paths.map((p) => `// ${p}\n${files[p]}`).join("\n\n");
    await navigator.clipboard.writeText(
      paths.length === 1 ? activeContent : all,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (paths.length === 0) {
    return (
      <p className="p-4 text-sm text-text-muted">No source files in artifact.</p>
    );
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      {paths.length > 1 && (
        <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-border px-2 py-1.5">
          {paths.map((path) => (
            <button
              key={path}
              type="button"
              onClick={() => setActivePath(path)}
              className={cn(
                "shrink-0 rounded-md px-2 py-1 text-xs font-mono transition-colors",
                activePath === path
                  ? "bg-surface-hover text-text-primary"
                  : "text-text-muted hover:text-text-secondary",
              )}
            >
              {path.replace(/^\//, "")}
            </button>
          ))}
        </div>
      )}
      <div className="relative min-h-0 flex-1 overflow-auto">
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-xs text-text-secondary hover:text-text-primary"
          aria-label="Copy code"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
        <pre
          className={cn(
            "artifact-code-pre m-0 p-4 pr-20 text-[13px] leading-[1.55]",
            lang === "css" && "artifact-code-pre--css",
          )}
        >
          <code className={`language-${lang ?? "plaintext"}`}>{activeContent}</code>
        </pre>
      </div>
    </div>
  );
}
