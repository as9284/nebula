"use client";

import { useEffect } from "react";
import {
  SandpackProvider,
  SandpackPreview,
  getSandpackCssText,
} from "@codesandbox/sandpack-react";
import type { CodeArtifact } from "@/types/chat";
import { prepareSandpackFiles } from "@/lib/sandpack-artifact";

const NEBULA_SANDPACK_THEME = {
  colors: {
    surface1: "#1f1f1c",
    surface2: "#252522",
    surface3: "#2a2a26",
    clickable: "#9b9a97",
    base: "#e8e6e3",
    disabled: "#6f6e6b",
    hover: "#e8e6e3",
    accent: "#8a78e6",
    error: "#f87171",
    errorSurface: "rgba(248, 113, 113, 0.1)",
  },
  font: {
    body: "ui-sans-serif, system-ui, sans-serif",
    mono: "ui-monospace, monospace",
    size: "13px",
    lineHeight: "20px",
  },
};

/** Sandpack's bundler targets React 18; React 19 breaks the preview iframe. */
const SANDPACK_DEPS: Record<string, string> = {
  react: "^18.2.0",
  "react-dom": "^18.2.0",
};

function SandpackStyles() {
  useEffect(() => {
    const id = "sandpack-css";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = getSandpackCssText();
    document.head.appendChild(style);
  }, []);
  return null;
}

interface ReactArtifactPreviewProps {
  artifact: CodeArtifact;
}

export function ReactArtifactPreview({ artifact }: ReactArtifactPreviewProps) {
  const { files, activeFile } = prepareSandpackFiles(artifact);
  const usesTypeScript = Object.keys(files).some((p) => /\.tsx?$/i.test(p));

  return (
    <>
      <SandpackStyles />
      <SandpackProvider
        template={usesTypeScript ? "react-ts" : "react"}
        theme={NEBULA_SANDPACK_THEME}
        files={files}
        options={{
          activeFile,
          visibleFiles: Object.keys(files),
          recompileMode: "immediate",
          autorun: true,
        }}
        customSetup={{
          dependencies: {
            ...SANDPACK_DEPS,
            ...artifact.dependencies,
          },
        }}
      >
        <SandpackPreview
          showNavigator={false}
          showRefreshButton={false}
          showOpenInCodeSandbox={false}
          showSandpackErrorOverlay
          style={{ height: "100%", width: "100%", minHeight: 200 }}
        />
      </SandpackProvider>
    </>
  );
}
