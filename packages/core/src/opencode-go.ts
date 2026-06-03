import type { LlmConfig, LlmProvider } from "./llm-config";

/** OpenCode Go API — https://opencode.ai/docs/go/ */
export const OPENCODE_GO_MODELS_URL =
  "https://opencode.ai/zen/go/v1/models";
export const OPENCODE_GO_CHAT_COMPLETIONS_URL =
  "https://opencode.ai/zen/go/v1/chat/completions";
export const OPENCODE_GO_MESSAGES_URL =
  "https://opencode.ai/zen/go/v1/messages";

export const OPENCODE_GO_DEFAULT_MODEL = "deepseek-v4-pro";

export const OPENCODE_GO_AUTH_URL = "https://opencode.ai/auth";

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
}

export interface OpenCodeGoModelsResponse {
  object: "list";
  data: OpenCodeGoModel[];
}

export function isOpenCodeGoAnthropicModel(modelId: string): boolean {
  return OPENCODE_GO_ANTHROPIC_MODELS.has(modelId.trim().toLowerCase());
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
  return data.filter(
    (m): m is OpenCodeGoModel =>
      !!m &&
      typeof m === "object" &&
      typeof (m as OpenCodeGoModel).id === "string",
  );
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
