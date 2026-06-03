import {
  OPENCODE_GO_CHAT_COMPLETIONS_URL,
  OPENCODE_GO_DEFAULT_MODEL,
  OPENCODE_GO_MESSAGES_URL,
  isOpenCodeGoAnthropicModel,
  isOpenCodeGoConfig,
  resolveOpenCodeGoLlmConfig,
} from "./opencode-go";

export type LlmProvider = "openai" | "anthropic";

export interface LlmConfig {
  provider: LlmProvider;
  apiKey: string;
  /** Chat completions or Anthropic messages URL for OpenCode Go. */
  baseUrl: string;
  model: string;
}

export const DEFAULT_LLM_CONFIG: LlmConfig = resolveOpenCodeGoLlmConfig(
  "",
  OPENCODE_GO_DEFAULT_MODEL,
);

export function isLlmConfigured(config: LlmConfig): boolean {
  return !!config.apiKey.trim() && !!config.model.trim();
}

/** Ensure stored config uses current OpenCode Go endpoints for the selected model. */
export function normalizeLlmConfig(config: LlmConfig): LlmConfig {
  if (!config.apiKey.trim() || !config.model.trim()) {
    return { ...DEFAULT_LLM_CONFIG, apiKey: config.apiKey };
  }
  if (isOpenCodeGoConfig(config)) {
    return resolveOpenCodeGoLlmConfig(config.apiKey, config.model);
  }
  return resolveOpenCodeGoLlmConfig(config.apiKey, config.model);
}

export function normalizeOpenAiCompletionsUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");
  if (!trimmed) return trimmed;
  let completions: string;
  if (trimmed.endsWith("/chat/completions")) {
    completions = trimmed;
  } else if (isBareOrigin(trimmed)) {
    completions = `${trimmed}/v1/chat/completions`;
  } else {
    completions = `${trimmed}/chat/completions`;
  }
  return forceIpv4Loopback(completions);
}

function isBareOrigin(url: string): boolean {
  try {
    const { pathname } = new URL(url);
    return pathname === "" || pathname === "/";
  } catch {
    return false;
  }
}

export function isLoopbackUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "[::1]"
    );
  } catch {
    return false;
  }
}

export function forceIpv4Loopback(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname === "localhost") {
      u.hostname = "127.0.0.1";
      return u.toString();
    }
  } catch {
    // not an absolute URL
  }
  return url;
}

/** Migrate legacy multi-provider or DeepSeek-only storage to OpenCode Go. */
export function migrateDeepseekKey(deepseekKey: string | undefined): LlmConfig {
  if (!deepseekKey?.trim()) return { ...DEFAULT_LLM_CONFIG };
  return resolveOpenCodeGoLlmConfig(deepseekKey.trim(), "deepseek-v4-pro");
}

/** Migrate persisted llmConfig from older app versions. */
export function migrateLlmConfig(
  config: LlmConfig | undefined,
  deepseekKey?: string,
): LlmConfig {
  if (config?.apiKey?.trim() && config.model?.trim()) {
    return normalizeLlmConfig(config);
  }
  return migrateDeepseekKey(deepseekKey);
}

export {
  OPENCODE_GO_CHAT_COMPLETIONS_URL,
  OPENCODE_GO_MESSAGES_URL,
  isOpenCodeGoAnthropicModel,
};
