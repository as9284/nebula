import { buildImageContentParts } from "@nebula/core/image-content-parts";
import type { LlmContentPart } from "@nebula/core/llm";
import type { LlmProvider } from "@nebula/core/llm-config";
import { modelSupportsVision } from "@nebula/core/vision-support";
import type { MessageImage } from "@nebula/core/types/chat";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const TEXT_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".json",
  ".csv",
  ".xml",
  ".html",
  ".css",
  ".js",
  ".ts",
  ".tsx",
  ".jsx",
  ".py",
  ".go",
  ".rs",
  ".java",
  ".yaml",
  ".yml",
  ".toml",
  ".sql",
  ".sh",
  ".env",
  ".log",
]);

export interface ChatAttachment {
  id: string;
  name: string;
  kind: "text" | "image";
  /** Plain text or base64 payload (no data: prefix). */
  payload: string;
  mediaType?: string;
}

export interface AttachFilesResult {
  attachments: ChatAttachment[];
  errors: string[];
}

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

function mimeToExtension(mime: string): string {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "image/bmp": "bmp",
    "text/plain": "txt",
    "text/markdown": "md",
    "application/json": "json",
  };
  if (map[mime]) return map[mime];
  const sub = mime.split("/")[1];
  if (sub && /^[a-z0-9.+_-]+$/i.test(sub)) {
    return sub.replace("svg+xml", "svg").replace("x-", "");
  }
  return "bin";
}

/** Screenshots and clipboard blobs often have an empty or generic name. */
export function normalizePastedFile(file: File, index = 0): File {
  const trimmed = file.name?.trim();
  if (trimmed && trimmed !== "blob") {
    return file;
  }
  const ext = mimeToExtension(file.type || "image/png");
  const stamp = Date.now();
  const suffix = index > 0 ? `-${index + 1}` : "";
  const name = `pasted-${stamp}${suffix}.${ext}`;
  return new File([file], name, {
    type: file.type || "application/octet-stream",
    lastModified: file.lastModified,
  });
}

function fileDedupeKey(file: File): string {
  if (isImage(file)) {
    return `img\0${file.size}\0${file.type}`;
  }
  return `${file.name}\0${file.size}\0${file.type}\0${file.lastModified}`;
}

function collectFilesFromItems(items: DataTransferItemList | undefined): File[] {
  if (!items?.length) return [];
  const out: File[] = [];
  for (const item of Array.from(items)) {
    if (item.kind !== "file") continue;
    const file = item.getAsFile();
    if (file) out.push(normalizePastedFile(file, out.length));
  }
  return out;
}

function collectFilesFromFileList(files: FileList | undefined): File[] {
  if (!files?.length) return [];
  return Array.from(files).map((file, index) =>
    normalizePastedFile(file, index),
  );
}

/** Clipboard paste: one image max (most recent), no duplicate sources. */
function limitPasteToMostRecentImage(files: File[]): File[] {
  const images = files.filter(isImage);
  const other = files.filter((f) => !isImage(f));
  if (images.length <= 1) return files;
  return [...other, images[images.length - 1]!];
}

export function dedupeFiles(files: File[]): File[] {
  const seen = new Set<string>();
  const out: File[] = [];
  for (const file of files) {
    const key = fileDedupeKey(file);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(file);
  }
  return out;
}

function isTextLike(file: File): boolean {
  if (file.type.startsWith("text/")) return true;
  const ext = extOf(file.name);
  return TEXT_EXTENSIONS.has(ext);
}

function isImage(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  const ext = extOf(file.name);
  return [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"].includes(
    ext,
  );
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Could not read image data."));
        return;
      }
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error("Could not read image data."));
    reader.readAsDataURL(file);
  });
}

function dataUrlToFile(dataUrl: string, index: number): File | null {
  const match = /^data:([^;,]+)?(?:;[^,]*)?;base64,(.+)$/i.exec(dataUrl.trim());
  if (!match) return null;
  try {
    const mediaType = match[1] || "image/png";
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const ext = mimeToExtension(mediaType);
    const blob = new Blob([bytes], { type: mediaType });
    return normalizePastedFile(
      new File([blob], `pasted-${Date.now()}-${index + 1}.${ext}`, {
        type: mediaType,
      }),
      index,
    );
  } catch {
    return null;
  }
}

function filesFromHtml(html: string): File[] {
  if (!html.includes("<img")) return [];
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const files: File[] = [];
    doc.querySelectorAll("img[src]").forEach((img, index) => {
      const src = img.getAttribute("src");
      if (!src?.startsWith("data:")) return;
      const file = dataUrlToFile(src, index);
      if (file) files.push(file);
    });
    return files;
  } catch {
    return [];
  }
}

/**
 * Files from a clipboard paste. Uses one source (items → files → html) to avoid
 * duplicates, and keeps only the most recent image when several are present.
 */
export function clipboardPasteToFiles(data: DataTransfer | null): File[] {
  if (!data) return [];

  const fromItems = collectFilesFromItems(data.items);
  if (fromItems.length > 0) {
    return limitPasteToMostRecentImage(dedupeFiles(fromItems));
  }

  const fromFiles = collectFilesFromFileList(data.files);
  if (fromFiles.length > 0) {
    return limitPasteToMostRecentImage(dedupeFiles(fromFiles));
  }

  const html = data.getData("text/html");
  if (html) {
    const fromHtml = filesFromHtml(html);
    if (fromHtml.length) {
      return limitPasteToMostRecentImage(dedupeFiles(fromHtml));
    }
  }

  return [];
}

/** Collect attachable files from drop or generic DataTransfer (multi-file OK). */
export function dataTransferToFiles(data: DataTransfer | null): File[] {
  if (!data) return [];

  const fromItems = collectFilesFromItems(data.items);
  if (fromItems.length > 0) {
    return dedupeFiles(fromItems);
  }

  const fromFiles = collectFilesFromFileList(data.files);
  if (fromFiles.length > 0) {
    return dedupeFiles(fromFiles);
  }

  const html = data.getData("text/html");
  if (html) {
    return dedupeFiles(filesFromHtml(html));
  }

  return [];
}

/** Whether to call preventDefault on paste (pure file/image paste, no text). */
export function shouldPreventDefaultOnPaste(
  data: DataTransfer | null,
): boolean {
  if (!data || !clipboardPasteToFiles(data).length) return false;
  const plain = data.getData("text/plain")?.trim() ?? "";
  return plain.length === 0;
}

export async function fileToAttachment(file: File): Promise<ChatAttachment> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`${file.name} is too large (max 5 MB).`);
  }

  const id = crypto.randomUUID();

  if (isImage(file)) {
    const payload = await readFileAsBase64(file);
    return {
      id,
      name: file.name,
      kind: "image",
      payload,
      mediaType: file.type || "image/png",
    };
  }

  if (isTextLike(file)) {
    const text = await file.text();
    return { id, name: file.name, kind: "text", payload: text };
  }

  throw new Error(
    `${file.name}: unsupported type. Use text or code files, or images.`,
  );
}

export async function filesToAttachments(
  files: File[],
): Promise<AttachFilesResult> {
  const attachments: ChatAttachment[] = [];
  const errors: string[] = [];

  for (const file of files) {
    try {
      attachments.push(await fileToAttachment(file));
    } catch (e) {
      errors.push((e as Error).message);
    }
  }

  return { attachments, errors };
}

export function mergeAttachmentErrors(errors: string[]): string {
  if (!errors.length) return "";
  if (errors.length === 1) return errors[0];
  return errors.join(" ");
}

export function imageAttachmentToDataUrl(attachment: {
  mediaType?: string;
  payload?: string;
  data?: string;
}): string | null {
  const payload = attachment.payload ?? attachment.data;
  if (!payload) return null;
  const mediaType = attachment.mediaType ?? "image/png";
  return `data:${mediaType};base64,${payload}`;
}

export function formatAttachmentsForDisplay(
  attachments: ChatAttachment[],
): string {
  if (!attachments.length) return "";
  const blocks = attachments
    .filter((a) => a.kind === "text")
    .map((a) => {
    const preview =
      a.payload.length > 800
        ? `${a.payload.slice(0, 800)}\n… (truncated)`
        : a.payload;
    return `--- ${a.name} ---\n${preview}`;
    });
  return blocks.length ? `\n\n${blocks.join("\n\n")}` : "";
}

export function toMessageImages(
  attachments: ChatAttachment[] | undefined,
): MessageImage[] | undefined {
  const images = attachments?.filter((a) => a.kind === "image");
  if (!images?.length) return undefined;
  return images.map((a) => ({
    name: a.name,
    mediaType: a.mediaType ?? "image/png",
    data: a.payload,
  }));
}

export function buildVisionParts(
  attachments: ChatAttachment[],
  provider: LlmProvider,
): LlmContentPart[] {
  const images = attachments.filter((a) => a.kind === "image");
  if (!images.length) return [];

  return buildImageContentParts(
    provider,
    images.map((img) => ({
      name: img.name,
      mediaType: img.mediaType ?? "image/png",
      data: img.payload,
    })),
  );
}

export { modelSupportsVision };
