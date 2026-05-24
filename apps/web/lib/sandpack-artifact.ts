import type { SandpackFiles } from "@codesandbox/sandpack-react";
import type { CodeArtifact } from "@/types/chat";

function ensureEntryImportsCss(
  files: Record<string, string>,
  entry: string,
): Record<string, string> {
  const entryContent = files[entry];
  if (!entryContent) return files;

  let next = entryContent;
  for (const path of Object.keys(files)) {
    if (!path.endsWith(".css") || path === entry) continue;
    const importPath = path.startsWith("/") ? `.${path}` : `./${path}`;
    if (
      next.includes(importPath) ||
      next.includes(`"${path}"`) ||
      next.includes(`'${path}'`)
    ) {
      continue;
    }
    next = `import "${importPath}";\n${next}`;
  }

  if (next === entryContent) return files;
  return { ...files, [entry]: next };
}

const PREVIEW_BASE_CSS = `html, body, #root {
  height: 100%;
  margin: 0;
}
body {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #171714;
}
`;

function ensurePreviewBaseStyles(
  files: Record<string, string>,
  entry: string,
): Record<string, string> {
  const stylePath = Object.keys(files).find((p) => p.endsWith(".css"));
  if (stylePath) {
    const existing = files[stylePath];
    if (!/html\s*,\s*body/i.test(existing)) {
      files[stylePath] = `${PREVIEW_BASE_CSS}\n${existing}`;
    }
    return files;
  }
  files["/styles.css"] = PREVIEW_BASE_CSS;
  return ensureEntryImportsCss(files, entry);
}

/** Map artifact files for Sandpack without overriding the bundler entry (index.tsx). */
export function prepareSandpackFiles(artifact: CodeArtifact): {
  files: SandpackFiles;
  activeFile: string;
} {
  const entry = artifact.entry ?? "/App.tsx";
  let files = { ...artifact.files };
  files = ensurePreviewBaseStyles(files, entry);
  files = ensureEntryImportsCss(files, entry);

  const sandpackFiles: SandpackFiles = {};
  for (const [path, code] of Object.entries(files)) {
    sandpackFiles[path] = code;
  }

  return { files: sandpackFiles, activeFile: entry };
}
