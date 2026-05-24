"use client";

import {
  SandpackProvider,
  SandpackPreview,
  type SandpackFiles,
} from "@codesandbox/sandpack-react";
import type { CodeArtifact } from "@/types/chat";

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
    body: 'ui-sans-serif, system-ui, sans-serif',
    mono: 'ui-monospace, monospace',
    size: "13px",
    lineHeight: "20px",
  },
};

const BASE_DEPS: Record<string, string> = {
  react: "^19.2.0",
  "react-dom": "^19.2.0",
};

interface ReactArtifactPreviewProps {
  artifact: CodeArtifact;
}

export function ReactArtifactPreview({ artifact }: ReactArtifactPreviewProps) {
  const files = artifact.files as SandpackFiles;
  const entry = artifact.entry ?? "/App.tsx";
  const usesTypeScript = Object.keys(files).some((p) =>
    /\.tsx?$/i.test(p),
  );

  return (
    <SandpackProvider
      template={usesTypeScript ? "react-ts" : "react"}
      theme={NEBULA_SANDPACK_THEME}
      files={files}
      options={{
        visibleFiles: Object.keys(files),
        activeFile: entry,
      }}
      customSetup={{
        entry,
        dependencies: {
          ...BASE_DEPS,
          ...artifact.dependencies,
        },
      }}
    >
      <SandpackPreview
        showNavigator={false}
        showRefreshButton={false}
        showOpenInCodeSandbox={false}
        style={{
          height: "min(360px, 50vh)",
          minHeight: 200,
          borderRadius: 0,
        }}
      />
    </SandpackProvider>
  );
}
