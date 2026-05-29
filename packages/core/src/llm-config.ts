export type LlmProvider = "openai" | "anthropic";

export interface LlmConfig {
  provider: LlmProvider;
  apiKey: string;
  /** OpenAI-compatible chat completions URL (ignored for Anthropic). */
  baseUrl: string;
  model: string;
}

export const DEFAULT_LLM_CONFIG: LlmConfig = {
  provider: "openai",
  apiKey: "",
  baseUrl: "https://api.openai.com/v1/chat/completions",
  model: "gpt-4o-mini",
};

export interface LlmPreset {
  id: string;
  label: string;
  provider: LlmProvider;
  baseUrl: string;
  model: string;
  hint?: string;
}

export const LLM_PRESETS: LlmPreset[] = [
  {
    id: "openai",
    label: "OpenAI",
    provider: "openai",
    baseUrl: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4.1-mini",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    provider: "openai",
    baseUrl: "https://api.deepseek.com/chat/completions",
    model: "deepseek-chat",
  },
  {
    id: "minimax",
    label: "MiniMax",
    provider: "openai",
    baseUrl: "https://api.minimax.io/v1/chat/completions",
    model: "MiniMax-M2.7",
    hint: "API key from platform.minimax.io. Use MiniMax-M2.7-highspeed for faster output.",
  },
  {
    id: "gemini",
    label: "Google Gemini",
    provider: "openai",
    baseUrl:
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    model: "gemini-2.5-flash",
    hint: "API key from aistudio.google.com (Gemini API).",
  },
  {
    id: "mistral",
    label: "Mistral",
    provider: "openai",
    baseUrl: "https://api.mistral.ai/v1/chat/completions",
    model: "mistral-small-latest",
  },
  {
    id: "xai",
    label: "xAI (Grok)",
    provider: "openai",
    baseUrl: "https://api.x.ai/v1/chat/completions",
    model: "grok-3-mini",
  },
  {
    id: "ollama",
    label: "Ollama (local)",
    provider: "openai",
    baseUrl: "http://localhost:11434/v1/chat/completions",
    model: "llama3.2",
    hint: "Run Ollama locally; API key can be any placeholder. For the hosted app, allow this site's origin via OLLAMA_ORIGINS so the browser can connect.",
  },
  {
    id: "lmstudio",
    label: "LM Studio (local)",
    provider: "openai",
    baseUrl: "http://localhost:1234/v1/chat/completions",
    model: "local-model",
    hint: "Start the Local Server in LM Studio (enable CORS so the hosted app's browser can connect). Use the model ID from the server tab or GET /v1/models. API key can be any placeholder (e.g. lm-studio).",
  },
  {
    id: "anthropic",
    label: "Anthropic",
    provider: "anthropic",
    baseUrl: "https://api.anthropic.com/v1/messages",
    model: "claude-sonnet-4-20250514",
  },
];

export function isLlmConfigured(config: LlmConfig): boolean {
  if (!config.apiKey.trim() || !config.model.trim()) return false;
  if (config.provider === "anthropic") return true;
  return !!config.baseUrl.trim();
}

export function normalizeOpenAiCompletionsUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");
  if (!trimmed) return trimmed;
  let completions: string;
  if (trimmed.endsWith("/chat/completions")) {
    completions = trimmed;
  } else if (isBareOrigin(trimmed)) {
    // Bare host like http://localhost:1234 — OpenAI-compatible servers
    // (Ollama, LM Studio) serve the API under /v1, so don't drop it.
    completions = `${trimmed}/v1/chat/completions`;
  } else {
    // Has a path already (e.g. ".../v1") — just append the endpoint.
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

/**
 * True when the base URL points at the user's own machine (Ollama/LM Studio).
 * Such providers must be called from the browser, not a hosted server — a
 * remote server's loopback isn't the user's machine.
 */
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

/**
 * Node's fetch resolves "localhost" to IPv6 (::1) first, but Ollama and
 * LM Studio bind to IPv4 (127.0.0.1) only by default — so requests to a
 * "localhost" base URL fail with ECONNREFUSED. Pin loopback to IPv4.
 */
export function forceIpv4Loopback(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname === "localhost") {
      u.hostname = "127.0.0.1";
      return u.toString();
    }
  } catch {
    // not an absolute URL — leave it untouched
  }
  return url;
}

/** Migrate legacy DeepSeek-only key storage. */
export function migrateDeepseekKey(deepseekKey: string | undefined): LlmConfig {
  if (!deepseekKey?.trim()) return { ...DEFAULT_LLM_CONFIG };
  const preset = LLM_PRESETS.find((p) => p.id === "deepseek")!;
  return {
    provider: "openai",
    apiKey: deepseekKey.trim(),
    baseUrl: preset.baseUrl,
    model: preset.model,
  };
}
