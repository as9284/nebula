import { z } from "zod";
import { normalizeArtifactFiles } from "./artifact-normalize";
import { parseArtifactFenceBody } from "./artifact-fence-parse";

export const ARTIFACT_TEMPLATE = ["react", "html"] as const;
export type ArtifactTemplate = (typeof ARTIFACT_TEMPLATE)[number];

const MAX_TOTAL_BYTES = 150_000;
const MAX_FILE_COUNT = 20;
const MAX_FILE_PATH_LENGTH = 120;

const ALLOWED_FILE_EXTENSIONS = new Set([
  ".tsx",
  ".ts",
  ".jsx",
  ".js",
  ".css",
  ".html",
  ".json",
  ".md",
]);

/** Curated npm packages Sandpack may load for React artifacts. */
export const ALLOWED_ARTIFACT_DEPENDENCIES = new Set([
  "react",
  "react-dom",
  "framer-motion",
  "lucide-react",
  "clsx",
]);

const artifactPayloadSchema = z.object({
  id: z.string().optional(),
  title: z.string().max(200).optional(),
  template: z.enum(ARTIFACT_TEMPLATE),
  files: z.record(z.string(), z.string()),
  entry: z.string().max(MAX_FILE_PATH_LENGTH).optional(),
  dependencies: z.record(z.string(), z.string()).optional(),
});

export type CodeArtifact = {
  id: string;
  title?: string;
  template: ArtifactTemplate;
  files: Record<string, string>;
  entry?: string;
  dependencies?: Record<string, string>;
};

export type ArtifactParseResult = {
  artifacts: CodeArtifact[];
  errors: { message: string }[];
};

function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return "/untitled";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function pathExtension(path: string): string {
  const dot = path.lastIndexOf(".");
  return dot === -1 ? "" : path.slice(dot).toLowerCase();
}

function totalBytes(files: Record<string, string>): number {
  return Object.values(files).reduce((sum, c) => sum + c.length, 0);
}

function defaultEntry(template: ArtifactTemplate, files: Record<string, string>): string {
  const paths = Object.keys(files);
  if (template === "html") {
    return paths.find((p) => p.endsWith("index.html")) ?? paths[0] ?? "/index.html";
  }
  return (
    paths.find((p) => /\/App\.(tsx|jsx|js)$/i.test(p)) ??
    paths.find((p) => /\.(tsx|jsx)$/i.test(p)) ??
    paths[0] ??
    "/App.tsx"
  );
}

const REMOTE_SCRIPT_RE = /<script[^>]+src\s*=\s*["']https?:/i;
const JAVASCRIPT_URL_RE = /javascript\s*:/i;

function validateHtmlSecurity(files: Record<string, string>): string | null {
  for (const [path, content] of Object.entries(files)) {
    if (JAVASCRIPT_URL_RE.test(content)) {
      return `Disallowed javascript: URL in ${path}`;
    }
    if (path.endsWith(".html") && REMOTE_SCRIPT_RE.test(content)) {
      return `Remote script tags are not allowed in ${path}`;
    }
  }
  return null;
}

function validateFiles(
  template: ArtifactTemplate,
  files: Record<string, string>,
): string | null {
  const entries = Object.entries(files);
  if (entries.length === 0) return "Artifact must include at least one file";
  if (entries.length > MAX_FILE_COUNT) {
    return `Too many files (max ${MAX_FILE_COUNT})`;
  }

  const normalized: Record<string, string> = {};
  for (const [rawPath, content] of entries) {
    const path = normalizePath(rawPath);
    if (path.length > MAX_FILE_PATH_LENGTH) {
      return `File path too long: ${path}`;
    }
    const ext = pathExtension(path);
    if (!ALLOWED_FILE_EXTENSIONS.has(ext)) {
      return `Disallowed file extension: ${ext || path}`;
    }
    normalized[path] = content;
  }

  const bytes = totalBytes(normalized);
  if (bytes > MAX_TOTAL_BYTES) {
    return `Artifact too large (max ${MAX_TOTAL_BYTES} bytes)`;
  }

  if (template === "html") {
    const htmlErr = validateHtmlSecurity(normalized);
    if (htmlErr) return htmlErr;
    if (!Object.keys(normalized).some((p) => p.endsWith(".html"))) {
      return "HTML artifacts must include an .html file";
    }
  }

  return null;
}

function validateDependencies(
  deps: Record<string, string> | undefined,
): string | null {
  if (!deps) return null;
  for (const name of Object.keys(deps)) {
    if (!ALLOWED_ARTIFACT_DEPENDENCIES.has(name)) {
      return `Dependency not allowed: ${name}`;
    }
  }
  return null;
}

/** Validate and normalize a parsed artifact payload (assigns id if missing). */
export function validateCodeArtifact(
  raw: unknown,
  assignId: () => string,
): { artifact: CodeArtifact } | { error: string } {
  const parsed = artifactPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid artifact JSON" };
  }

  const { title, template, entry, dependencies } = parsed.data;
  const fileErr = validateFiles(template, parsed.data.files);
  if (fileErr) return { error: fileErr };

  const depErr = validateDependencies(dependencies);
  if (depErr) return { error: depErr };

  const normalizedFiles = normalizeArtifactFiles(
    Object.fromEntries(
      Object.entries(parsed.data.files).map(([rawPath, content]) => [
        normalizePath(rawPath),
        content,
      ]),
    ),
  );

  const resolvedEntry = entry
    ? normalizePath(entry)
    : defaultEntry(template, normalizedFiles);

  if (!normalizedFiles[resolvedEntry]) {
    return { error: `Entry file not found: ${resolvedEntry}` };
  }

  return {
    artifact: {
      id: parsed.data.id?.trim() || assignId(),
      title: title?.trim() || undefined,
      template,
      files: normalizedFiles,
      entry: resolvedEntry,
      dependencies: dependencies
        ? Object.fromEntries(
            Object.entries(dependencies).filter(([k]) =>
              ALLOWED_ARTIFACT_DEPENDENCIES.has(k),
            ),
          )
        : undefined,
    },
  };
}

const ARTIFACT_FENCE_RE =
  /```\s*nebula-artifact\s*\r?\n([\s\S]*?)```/gi;

const TRAILING_ARTIFACT_FENCE_RE =
  /```\s*nebula-artifact\s*\r?\n[\s\S]*$/i;

/** Extract validated artifacts from nebula-artifact fenced blocks. */
export function parseNebulaArtifactFences(
  content: string,
  assignId: () => string,
): ArtifactParseResult {
  const artifacts: CodeArtifact[] = [];
  const errors: { message: string }[] = [];

  for (const match of content.matchAll(ARTIFACT_FENCE_RE)) {
    const body = (match[1] ?? "").trim();
    if (!body) {
      errors.push({ message: "Empty nebula-artifact block" });
      continue;
    }
    const json = parseArtifactFenceBody(body);
    if (json === null) {
      errors.push({
        message:
          "Could not parse nebula-artifact block (use JSON or multiline --- /path format)",
      });
      continue;
    }
    const result = validateCodeArtifact(json, assignId);
    if ("error" in result) {
      errors.push({ message: result.error });
    } else {
      artifacts.push(result.artifact);
    }
  }

  return { artifacts, errors };
}

/** Remove nebula-artifact fences and trailing partial fences from visible chat text. */
export function stripNebulaArtifactFences(content: string): string {
  let cleaned = content.replace(ARTIFACT_FENCE_RE, "");
  cleaned = cleaned.replace(TRAILING_ARTIFACT_FENCE_RE, "");
  const partial = cleaned.match(/\s*```\s*nebula-artifact\s*$/i);
  if (partial) {
    cleaned = cleaned.slice(0, cleaned.length - partial[0].length).trimEnd();
  }
  return cleaned.replace(/\n{3,}/g, "\n\n").trimEnd();
}

export function hasNebulaArtifactFences(content: string): boolean {
  ARTIFACT_FENCE_RE.lastIndex = 0;
  return ARTIFACT_FENCE_RE.test(content) || TRAILING_ARTIFACT_FENCE_RE.test(content);
}
