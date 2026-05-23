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
    model: "gpt-4o-mini",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    provider: "openai",
    baseUrl: "https://api.deepseek.com/chat/completions",
    model: "deepseek-chat",
  },
  {
    id: "groq",
    label: "Groq",
    provider: "openai",
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.3-70b-versatile",
  },
  {
    id: "together",
    label: "Together",
    provider: "openai",
    baseUrl: "https://api.together.xyz/v1/chat/completions",
    model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
  },
  {
    id: "ollama",
    label: "Ollama (local)",
    provider: "openai",
    baseUrl: "http://localhost:11434/v1/chat/completions",
    model: "llama3.2",
    hint: "Run Ollama locally; API key can be any placeholder.",
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
  if (trimmed.endsWith("/chat/completions")) return trimmed;
  if (trimmed.endsWith("/v1")) return `${trimmed}/chat/completions`;
  return `${trimmed}/chat/completions`;
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
