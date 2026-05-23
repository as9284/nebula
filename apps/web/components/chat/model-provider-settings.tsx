"use client";

import { useState } from "react";
import {
  LLM_PRESETS,
  type LlmConfig,
  type LlmProvider,
  isLlmConfigured,
} from "@nebula/core/llm-config";
import {
  buildAutoVisionConfig,
  canDescribeImages,
  modelSupportsVision,
  suggestVisionModel,
} from "@nebula/core/vision-support";
import { maskApiKey } from "@/lib/api-keys";
import { useSettingsStore } from "@/stores/use-settings-store";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

export function ModelProviderSettings() {
  const llmConfig = useSettingsStore((s) => s.llmConfig);
  const setLlmConfig = useSettingsStore((s) => s.setLlmConfig);
  const describeImagesForTextModels = useSettingsStore(
    (s) => s.describeImagesForTextModels,
  );
  const setDescribeImagesForTextModels = useSettingsStore(
    (s) => s.setDescribeImagesForTextModels,
  );
  const visionHelperConfig = useSettingsStore((s) => s.visionHelperConfig);
  const setVisionHelperConfig = useSettingsStore((s) => s.setVisionHelperConfig);

  const [draft, setDraft] = useState<LlmConfig>(() => ({ ...llmConfig }));
  const [keyInput, setKeyInput] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showVisionHelper, setShowVisionHelper] = useState(
    () => !!visionHelperConfig?.apiKey?.trim(),
  );
  const [visionDraft, setVisionDraft] = useState<LlmConfig>(() => ({
    ...(visionHelperConfig ?? buildAutoVisionConfig(llmConfig) ?? llmConfig),
  }));
  const [visionKeyInput, setVisionKeyInput] = useState("");
  const [status, setStatus] = useState("");

  const applyPreset = (presetId: string) => {
    const preset = LLM_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setDraft((d) => ({
      ...d,
      provider: preset.provider,
      baseUrl: preset.baseUrl,
      model: preset.model,
    }));
  };

  const setProvider = (provider: LlmProvider) => {
    setDraft((d) => {
      const preset = LLM_PRESETS.find(
        (p) => p.provider === provider && p.id === (provider === "anthropic" ? "anthropic" : "openai"),
      );
      return {
        ...d,
        provider,
        baseUrl: preset?.baseUrl ?? d.baseUrl,
        model: preset?.model ?? d.model,
      };
    });
  };

  const save = () => {
    const next: LlmConfig = {
      ...draft,
      apiKey: keyInput.trim() || llmConfig.apiKey,
    };
    if (!isLlmConfigured(next)) return;
    setLlmConfig(next);
    setDraft(next);
    setKeyInput("");
    setStatus("Model settings saved locally.");
    setTimeout(() => setStatus(""), 3000);
  };

  const canSave =
    isLlmConfigured({
      ...draft,
      apiKey: keyInput.trim() || llmConfig.apiKey,
    });

  const configured = isLlmConfigured(llmConfig);
  const displayKey = llmConfig.apiKey ? maskApiKey(llmConfig.apiKey) : null;
  const autoVisionModel = suggestVisionModel(draft);
  const visionAvailable = canDescribeImages(draft, visionHelperConfig);

  const saveVisionHelper = () => {
    if (!showVisionHelper) {
      setVisionHelperConfig(null);
      return;
    }
    const next: LlmConfig = {
      ...visionDraft,
      apiKey: visionKeyInput.trim() || visionHelperConfig?.apiKey || llmConfig.apiKey,
    };
    if (!isLlmConfigured(next)) return;
    setVisionHelperConfig(next);
    setVisionDraft(next);
    setVisionKeyInput("");
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-muted leading-relaxed">
        Connect any OpenAI-compatible API (OpenAI, DeepSeek, Groq, Ollama, etc.)
        or Anthropic directly. Your key stays in this browser only.
      </p>

      {configured && displayKey && (
        <p className="text-xs text-text-muted">
          Active key: <span className="text-text-secondary">{displayKey}</span>
        </p>
      )}

      <div>
        <span className="block text-sm text-text-secondary mb-2">Provider</span>
        <div
          role="radiogroup"
          aria-label="Model provider"
          className="flex gap-1 p-1 rounded-xl bg-bg border border-border"
        >
          {(
            [
              { value: "openai" as const, label: "OpenAI-compatible" },
              { value: "anthropic" as const, label: "Anthropic" },
            ] as const
          ).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={draft.provider === value}
              onClick={() => setProvider(value)}
              className={cn(
                "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                draft.provider === value
                  ? "bg-surface-elevated text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-secondary",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-text-muted">
          {draft.provider === "openai"
            ? "Uses the Chat Completions API. Works with most hosted and local servers."
            : "Uses the Anthropic Messages API (Claude). Base URL is optional."}
        </p>
      </div>

      <div>
        <span className="block text-sm text-text-secondary mb-2">Quick setup</span>
        <div className="flex flex-wrap gap-1.5">
          {LLM_PRESETS.filter((p) =>
            draft.provider === "anthropic"
              ? p.provider === "anthropic"
              : p.provider === "openai",
          ).map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-bg border border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <Input
        type="password"
        label="API key"
        helper={
          draft.provider === "openai"
            ? "From your provider dashboard. For Ollama locally, any placeholder (e.g. ollama) is fine."
            : "From console.anthropic.com → API keys."
        }
        placeholder={llmConfig.apiKey ? "Enter new key to replace" : "sk-… or your provider key"}
        value={keyInput}
        onChange={(e) => setKeyInput(e.target.value)}
        autoComplete="off"
      />

      <Input
        label="Model"
        helper="Exact model ID your provider expects, e.g. gpt-4o-mini, deepseek-chat, claude-sonnet-4-20250514."
        placeholder="model-name"
        value={draft.model}
        onChange={(e) => setDraft((d) => ({ ...d, model: e.target.value }))}
      />

      {draft.provider === "openai" && (
        <Input
          label="API base URL"
          helper="Full chat completions endpoint. We append /chat/completions if you only paste the host or /v1."
          placeholder="https://api.openai.com/v1/chat/completions"
          value={draft.baseUrl}
          onChange={(e) => setDraft((d) => ({ ...d, baseUrl: e.target.value }))}
        />
      )}

      {draft.provider === "anthropic" && (
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          Advanced endpoint
        </button>
      )}

      {draft.provider === "anthropic" && showAdvanced && (
        <Input
          label="API base URL (optional)"
          helper="Leave default unless you use a proxy. Should end with /v1/messages or we normalize it."
          placeholder="https://api.anthropic.com/v1/messages"
          value={draft.baseUrl}
          onChange={(e) => setDraft((d) => ({ ...d, baseUrl: e.target.value }))}
        />
      )}

      <div className="pt-2 border-t border-border">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-text-secondary">Describe images for text-only models</p>
            <p className="mt-1 text-xs text-text-muted leading-relaxed">
              {modelSupportsVision(draft)
                ? "Your chat model supports vision — images are sent directly."
                : describeImagesForTextModels
                  ? visionAvailable
                    ? autoVisionModel
                      ? `Uses ${showVisionHelper ? "your vision helper" : `auto: ${autoVisionModel}`} to turn images into text your model can read.`
                      : "Enabled, but no vision model was detected for this endpoint. Configure a helper below."
                    : "Enabled — save your API key first."
                  : "Images are attached in the UI only; the model will not receive image content."}
            </p>
          </div>
          <Checkbox
            checked={describeImagesForTextModels}
            onChange={setDescribeImagesForTextModels}
            ariaLabel="Describe images for text-only models"
          />
        </div>

        {describeImagesForTextModels && !modelSupportsVision(draft) && (
          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={() => setShowVisionHelper((v) => !v)}
              className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              {showVisionHelper ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              Custom vision helper (optional)
            </button>
            {showVisionHelper && (
              <>
                <Input
                  type="password"
                  label="Vision helper API key"
                  helper="Leave blank to reuse your main API key."
                  placeholder="Same provider as main model, or a separate key"
                  value={visionKeyInput}
                  onChange={(e) => setVisionKeyInput(e.target.value)}
                  autoComplete="off"
                />
                <Input
                  label="Vision model"
                  helper="Must support images, e.g. gpt-4o-mini, claude-3-5-haiku-20241022, llava."
                  value={visionDraft.model}
                  onChange={(e) =>
                    setVisionDraft((d) => ({ ...d, model: e.target.value }))
                  }
                />
                {visionDraft.provider === "openai" && (
                  <Input
                    label="Vision API base URL"
                    helper="Usually the same host as your main model."
                    value={visionDraft.baseUrl}
                    onChange={(e) =>
                      setVisionDraft((d) => ({ ...d, baseUrl: e.target.value }))
                    }
                  />
                )}
                <button
                  type="button"
                  onClick={saveVisionHelper}
                  className="text-xs font-medium text-text-secondary hover:text-text-primary"
                >
                  Save vision helper
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={save}
        disabled={!canSave}
        className="px-5 py-2.5 rounded-xl bg-accent text-accent-fg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
      >
        Save model settings
      </button>

      {status && (
        <p className="text-xs text-text-secondary">{status}</p>
      )}
    </div>
  );
}
