import type { LlmConfig, LlmProvider } from "./llm-config";

/** OpenCode Go API — https://opencode.ai/docs/go/ */
export const OPENCODE_GO_MODELS_URL =
  "https://opencode.ai/zen/go/v1/models";
export const OPENCODE_GO_CHAT_COMPLETIONS_URL =
  "https://opencode.ai/zen/go/v1/chat/completions";
export const OPENCODE_GO_MESSAGES_URL =
  "https://opencode.ai/zen/go/v1/messages";

export const OPENCODE_GO_DEFAULT_MODEL = "deepseek-v4-pro";

/** Default vision/multimodal model when the chat model cannot see images. */
export const OPENCODE_GO_DEFAULT_VISION_MODEL = "kimi-k2.5";

/**
 * OpenCode's model catalog (ZenData source). The Go `/v1/models` endpoint returns a
 * lite OpenAI-compatible list without modalities; vision flags live here.
 * @see https://models.dev/api.json (`opencode-go.models`)
 */
export const OPENCODE_GO_CATALOG_URL = "https://models.dev/api.json";

/** Used only when the catalog cannot be loaded. Matches models.dev as of 2026-04. */
export const OPENCODE_GO_VISION_MODELS_FALLBACK = new Set([
  "kimi-k2.5",
  "kimi-k2.6",
  "mimo-v2-omni",
  "mimo-v2.5",
  "minimax-m3",
  "qwen3.5-plus",
  "qwen3.6-plus",
  "qwen3.7-plus",
]);

export const OPENCODE_GO_AUTH_URL = "https://opencode.ai/auth";

export interface OpenCodeGoModalities {
  input?: string[];
  output?: string[];
}

export interface OpenCodeGoCatalogEntry {
  id: string;
  modalities?: OpenCodeGoModalities;
}

let cachedVisionModelIds: Set<string> | null = null;

/** Test hook: inject catalog vision ids without fetching models.dev. */
export function setOpenCodeGoVisionModelIdsForTests(
  ids: Iterable<string> | null,
): void {
  cachedVisionModelIds = ids ? new Set(ids) : null;
}

export function getOpenCodeGoVisionModelIds(): Set<string> | null {
  return cachedVisionModelIds;
}

export function readModelInputModalities(
  entry: OpenCodeGoCatalogEntry | OpenCodeGoModel,
): string[] {
  const fromModel = (entry as OpenCodeGoModel).modalities?.input;
  if (fromModel?.length) return fromModel;
  const fromCatalog = (entry as OpenCodeGoCatalogEntry).modalities?.input;
  if (fromCatalog?.length) return fromCatalog;
  return [];
}

export function modalitiesIncludeVision(
  entry: OpenCodeGoCatalogEntry | OpenCodeGoModel,
): boolean {
  return readModelInputModalities(entry).includes("image");
}

export function parseOpenCodeGoCatalog(body: unknown): Map<string, OpenCodeGoCatalogEntry> {
  const map = new Map<string, OpenCodeGoCatalogEntry>();
  if (!body || typeof body !== "object") return map;
  const provider = (body as { "opencode-go"?: { models?: Record<string, unknown> } })[
    "opencode-go"
  ];
  const models = provider?.models;
  if (!models || typeof models !== "object") return map;

  for (const [id, raw] of Object.entries(models)) {
    if (!raw || typeof raw !== "object") continue;
    const modalities = (raw as { modalities?: OpenCodeGoModalities }).modalities;
    map.set(id.trim().toLowerCase(), {
      id: id.trim().toLowerCase(),
      modalities,
    });
  }
  return map;
}

export function applyOpenCodeGoVisionCatalog(
  catalog: Map<string, OpenCodeGoCatalogEntry>,
): void {
  const visionIds = new Set<string>();
  for (const [id, entry] of catalog) {
    if (modalitiesIncludeVision(entry)) visionIds.add(id);
  }
  cachedVisionModelIds = visionIds;
}

export async function fetchOpenCodeGoCatalog(
  signal?: AbortSignal,
): Promise<Map<string, OpenCodeGoCatalogEntry>> {
  const res = await fetch(OPENCODE_GO_CATALOG_URL, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) {
    throw new Error(`Failed to load OpenCode Go model catalog (${res.status})`);
  }
  const json: unknown = await res.json();
  const catalog = parseOpenCodeGoCatalog(json);
  applyOpenCodeGoVisionCatalog(catalog);
  return catalog;
}

export async function ensureOpenCodeGoVisionCatalog(
  signal?: AbortSignal,
): Promise<Set<string>> {
  if (cachedVisionModelIds) return cachedVisionModelIds;
  try {
    await fetchOpenCodeGoCatalog(signal);
  } catch {
    cachedVisionModelIds = new Set(OPENCODE_GO_VISION_MODELS_FALLBACK);
  }
  return cachedVisionModelIds ?? new Set(OPENCODE_GO_VISION_MODELS_FALLBACK);
}

/** Models routed through the Anthropic Messages API on OpenCode Go. */
export const OPENCODE_GO_ANTHROPIC_MODELS = new Set([
  "minimax-m3",
  "minimax-m2.7",
  "minimax-m2.5",
  "qwen3.7-max",
  "qwen3.7-plus",
  "qwen3.6-plus",
]);

export interface OpenCodeGoModel {
  id: string;
  object: string;
  created?: number;
  owned_by?: string;
  /** From models.dev catalog (`modalities.input` includes `image`). */
  supportsVision?: boolean;
  modalities?: OpenCodeGoModalities;
}

export interface OpenCodeGoModelsResponse {
  object: "list";
  data: OpenCodeGoModel[];
}

export function isOpenCodeGoAnthropicModel(modelId: string): boolean {
  return OPENCODE_GO_ANTHROPIC_MODELS.has(modelId.trim().toLowerCase());
}

export function isOpenCodeGoVisionModel(modelId: string): boolean {
  const id = modelId.trim().toLowerCase();
  if (cachedVisionModelIds) return cachedVisionModelIds.has(id);
  return OPENCODE_GO_VISION_MODELS_FALLBACK.has(id);
}

export function resolveOpenCodeGoLlmConfig(
  apiKey: string,
  model: string,
): LlmConfig {
  const modelId = model.trim();
  const provider: LlmProvider = isOpenCodeGoAnthropicModel(modelId)
    ? "anthropic"
    : "openai";
  return {
    provider,
    apiKey: apiKey.trim(),
    model: modelId,
    baseUrl:
      provider === "anthropic"
        ? OPENCODE_GO_MESSAGES_URL
        : OPENCODE_GO_CHAT_COMPLETIONS_URL,
  };
}

export function isOpenCodeGoConfig(config: LlmConfig): boolean {
  const url = config.baseUrl.toLowerCase();
  return url.includes("opencode.ai/zen/go");
}

/** Human-readable label for a Go model id (e.g. deepseek-v4-pro → DeepSeek V4 Pro). */
export function formatOpenCodeGoModelLabel(id: string): string {
  const special: Record<string, string> = {
    glm: "GLM",
    kimi: "Kimi",
    mimo: "MiMo",
    minimax: "MiniMax",
    qwen: "Qwen",
    deepseek: "DeepSeek",
    hy: "HY",
  };
  return id
    .split("-")
    .map((part, i) => {
      const lower = part.toLowerCase();
      if (i === 0 && special[lower]) return special[lower];
      if (/^v?\d/.test(part)) return part.toUpperCase().replace(/^V/, "v");
      if (/^\d/.test(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

export function parseOpenCodeGoModelsResponse(
  body: unknown,
): OpenCodeGoModel[] {
  if (!body || typeof body !== "object") return [];
  const data = (body as OpenCodeGoModelsResponse).data;
  if (!Array.isArray(data)) return [];
  return data
    .filter(
      (m): m is OpenCodeGoModel =>
        !!m &&
        typeof m === "object" &&
        typeof (m as OpenCodeGoModel).id === "string",
    )
    .map((m) => ({
      ...m,
      id: m.id.trim().toLowerCase(),
    }));
}

export function enrichOpenCodeGoModelsWithCatalog(
  models: OpenCodeGoModel[],
  catalog: Map<string, OpenCodeGoCatalogEntry>,
): OpenCodeGoModel[] {
  return models.map((model) => {
    const id = model.id.trim().toLowerCase();
    const entry = catalog.get(id);
    const modalities = entry?.modalities ?? model.modalities;
    const supportsVision = entry
      ? modalitiesIncludeVision(entry)
      : (model.supportsVision ?? isOpenCodeGoVisionModel(id));
    return {
      ...model,
      modalities,
      supportsVision,
    };
  });
}

export async function fetchOpenCodeGoModels(
  apiKey?: string,
  signal?: AbortSignal,
): Promise<OpenCodeGoModel[]> {
  const headers: HeadersInit = { Accept: "application/json" };
  if (apiKey?.trim()) {
    headers.Authorization = `Bearer ${apiKey.trim()}`;
  }
  const res = await fetch(OPENCODE_GO_MODELS_URL, { headers, signal });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      text.trim() ||
        `Failed to load OpenCode Go models (${res.status})`,
    );
  }
  const json: unknown = await res.json();
  return parseOpenCodeGoModelsResponse(json);
}

/** Models from Go API plus vision flags from the OpenCode catalog on models.dev. */
export async function fetchOpenCodeGoModelsWithCapabilities(
  apiKey?: string,
  signal?: AbortSignal,
): Promise<OpenCodeGoModel[]> {
  const models = await fetchOpenCodeGoModels(apiKey, signal);
  let catalog: Map<string, OpenCodeGoCatalogEntry>;
  try {
    catalog = await fetchOpenCodeGoCatalog(signal);
  } catch {
    await ensureOpenCodeGoVisionCatalog(signal);
    catalog = new Map();
  }
  return enrichOpenCodeGoModelsWithCatalog(models, catalog);
}
