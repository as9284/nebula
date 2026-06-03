import {
  type LlmConfig,
  isLlmConfigured,
  normalizeOpenAiCompletionsUrl,
} from "./llm-config";
import {
  isOpenCodeGoConfig,
  isOpenCodeGoVisionModel,
  OPENCODE_GO_DEFAULT_VISION_MODEL,
} from "./opencode-go";

const KNOWN_VISION_MODEL = [
  /gpt-4o/i,
  /gpt-4-turbo/i,
  /gpt-4-vision/i,
  /claude-3/i,
  /claude-sonnet-4/i,
  /claude-opus-4/i,
  /claude-haiku-4/i,
  /gemini/i,
  /vision/i,
  /llava/i,
  /bakllava/i,
  /deepseek-chat/i,
  /qwen2\.?5?-vl/i,
  /qwen-vl/i,
  /pixtral/i,
  /moondream/i,
];

const KNOWN_NON_VISION_MODEL = [
  /^llama-3\.[12]-\d+b/i,
  /^llama-3\.2-3b/i,
  /^llama3\.2(?![^\s]*vision)/i,
  /^mistral-/i,
  /^mixtral/i,
  /^deepseek-reasoner/i,
  /^minimax-m2/i,
  /^o1(-mini|-preview)?$/i,
  /^o3(-mini)?$/i,
  /^command-r(?!-vision)/i,
];

export function modelSupportsVision(config: LlmConfig): boolean {
  const model = config.model.trim();
  if (!model) return false;

  if (isOpenCodeGoConfig(config)) {
    return isOpenCodeGoVisionModel(model);
  }

  if (KNOWN_VISION_MODEL.some((p) => p.test(model))) return true;
  if (KNOWN_NON_VISION_MODEL.some((p) => p.test(model))) return false;

  if (config.provider === "anthropic" && /claude/i.test(model)) {
    return true;
  }

  return false;
}

function hostFromBaseUrl(baseUrl: string): string {
  try {
    const normalized = normalizeOpenAiCompletionsUrl(baseUrl);
    return new URL(normalized).host.toLowerCase();
  } catch {
    return baseUrl.toLowerCase();
  }
}

/** Suggest a vision-capable model on the same endpoint/credentials. */
export function suggestVisionModel(config: LlmConfig): string | null {
  if (modelSupportsVision(config)) return config.model;

  if (isOpenCodeGoConfig(config)) {
    return OPENCODE_GO_DEFAULT_VISION_MODEL;
  }

  const host = hostFromBaseUrl(config.baseUrl);
  const url = config.baseUrl.toLowerCase();

  if (config.provider === "anthropic") {
    return "claude-3-5-haiku-20241022";
  }
  if (host.includes("api.openai.com")) return "gpt-4o-mini";
  if (host.includes("deepseek.com") || url.includes("deepseek")) {
    return "deepseek-chat";
  }
  if (host.includes("minimax.io") || url.includes("minimax")) {
    return null;
  }
  if (host.includes("generativelanguage.googleapis.com")) {
    return "gemini-2.5-flash";
  }
  if (host.includes("mistral.ai")) return "pixtral-12b-2409";
  if (
    host.includes("localhost") ||
    host.includes("127.0.0.1") ||
    url.includes(":11434") ||
    url.includes(":1234")
  ) {
    return "llava";
  }
  if (host.includes("openrouter.ai")) return "openai/gpt-4o-mini";

  return null;
}

export function buildAutoVisionConfig(primary: LlmConfig): LlmConfig | null {
  if (!isLlmConfigured(primary)) return null;
  const visionModel = suggestVisionModel(primary);
  if (!visionModel) return null;
  return { ...primary, model: visionModel };
}

export function resolveVisionHelperConfig(
  primary: LlmConfig,
  override: LlmConfig | null | undefined,
): LlmConfig | null {
  if (override && isLlmConfigured(override)) return override;
  return buildAutoVisionConfig(primary);
}

export function canDescribeImages(
  primary: LlmConfig,
  override: LlmConfig | null | undefined,
): boolean {
  return resolveVisionHelperConfig(primary, override) !== null;
}
