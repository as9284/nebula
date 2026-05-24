/** Unescape literal \\n / \\t sequences models sometimes emit inside JSON strings. */
export function normalizeArtifactFileContent(content: string): string {
  if (!content.includes("\\n")) return content;

  const realNewlines = (content.match(/\n/g) ?? []).length;
  const escapedNewlines = (content.match(/\\n/g) ?? []).length;

  if (realNewlines > 2 && realNewlines >= escapedNewlines) {
    return content;
  }

  return content
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\r/g, "\r");
}

export function normalizeArtifactFiles(
  files: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [path, content] of Object.entries(files)) {
    out[path] = normalizeArtifactFileContent(content);
  }
  return out;
}
