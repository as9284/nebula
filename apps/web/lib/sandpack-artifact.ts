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

/** Map artifact files for Sandpack without overriding the bundler entry (index.tsx). */
export function prepareSandpackFiles(artifact: CodeArtifact): {
  files: SandpackFiles;
  activeFile: string;
} {
  const entry = artifact.entry ?? "/App.tsx";
  let files = { ...artifact.files };
  files = ensureEntryImportsCss(files, entry);

  const sandpackFiles: SandpackFiles = {};
  for (const [path, code] of Object.entries(files)) {
    sandpackFiles[path] = code;
  }

  return { files: sandpackFiles, activeFile: entry };
}
