"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatOpenCodeGoModelLabel,
  OPENCODE_GO_AUTH_URL,
  OPENCODE_GO_DEFAULT_MODEL,
  OPENCODE_GO_DEFAULT_VISION_MODEL,
  parseOpenCodeGoModelsResponse,
  resolveOpenCodeGoLlmConfig,
  type OpenCodeGoModel,
} from "@nebula/core/opencode-go";
import { isLlmConfigured, normalizeLlmConfig } from "@nebula/core/llm-config";
import { maskApiKey } from "@/lib/api-keys";
import { useSettingsStore } from "@/stores/use-settings-store";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { modelSupportsVision } from "@nebula/core/vision-support";

async function loadModels(apiKey: string): Promise<OpenCodeGoModel[]> {
  const res = await fetch("/api/opencode-go/models", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: apiKey.trim() || undefined }),
  });
  const json: unknown = await res.json();
  if (!res.ok) {
    const err =
      json && typeof json === "object" && "error" in json
        ? String((json as { error: string }).error)
        : "Could not load models";
    throw new Error(err);
  }
  return parseOpenCodeGoModelsResponse(json);
}

function pickDefaultVisionModel(
  visionModels: OpenCodeGoModel[],
  current: string | undefined,
): string {
  if (current && visionModels.some((m) => m.id === current)) return current;
  const preferred = visionModels.find(
    (m) => m.id === OPENCODE_GO_DEFAULT_VISION_MODEL,
  );
  return preferred?.id ?? visionModels[0]?.id ?? OPENCODE_GO_DEFAULT_VISION_MODEL;
}

export function ModelProviderSettings() {
  const llmConfig = useSettingsStore((s) => s.llmConfig);
  const setLlmConfig = useSettingsStore((s) => s.setLlmConfig);
  const visionHelperConfig = useSettingsStore((s) => s.visionHelperConfig);
  const setVisionHelperConfig = useSettingsStore((s) => s.setVisionHelperConfig);

  const [keyInput, setKeyInput] = useState("");
  const [selectedModel, setSelectedModel] = useState(
    () => llmConfig.model || OPENCODE_GO_DEFAULT_MODEL,
  );
  const [selectedVisionModel, setSelectedVisionModel] = useState(
    () =>
      visionHelperConfig?.model ||
      OPENCODE_GO_DEFAULT_VISION_MODEL,
  );
  const [models, setModels] = useState<OpenCodeGoModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState("");
  const [status, setStatus] = useState("");

  const effectiveKey = keyInput.trim() || llmConfig.apiKey;

  const refreshModels = useCallback(async (apiKey: string) => {
    setModelsLoading(true);
    setModelsError("");
    try {
      const list = await loadModels(apiKey);
      setModels(list);
      if (list.length > 0) {
        setSelectedModel((current) => {
          if (list.some((m) => m.id === current)) return current;
          const preferred = list.find((m) => m.id === OPENCODE_GO_DEFAULT_MODEL);
          return preferred?.id ?? list[0]!.id;
        });
      }
    } catch (e) {
      setModels([]);
      setModelsError(e instanceof Error ? e.message : String(e));
    } finally {
      setModelsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshModels(llmConfig.apiKey);
  }, [refreshModels]);

  const visionModels = useMemo(
    () =>
      models.filter(
        (m) =>
          m.supportsVision ??
          modelSupportsVision(resolveOpenCodeGoLlmConfig(effectiveKey, m.id)),
      ),
    [models, effectiveKey],
  );

  const effectiveVisionModel = useMemo(
    () => pickDefaultVisionModel(visionModels, selectedVisionModel),
    [visionModels, selectedVisionModel],
  );

  const save = () => {
    const apiKey = keyInput.trim() || llmConfig.apiKey;
    const next = resolveOpenCodeGoLlmConfig(apiKey, selectedModel);
    if (!isLlmConfigured(next)) return;
    setLlmConfig(next);

    if (modelSupportsVision(next)) {
      setVisionHelperConfig(null);
    } else if (effectiveVisionModel) {
      setVisionHelperConfig(
        resolveOpenCodeGoLlmConfig(apiKey, effectiveVisionModel),
      );
    }

    setKeyInput("");
    setStatus("OpenCode Go settings saved locally.");
    setTimeout(() => setStatus(""), 3000);
  };

  const canSave = isLlmConfigured(
    resolveOpenCodeGoLlmConfig(effectiveKey, selectedModel),
  );

  const configured = isLlmConfigured(normalizeLlmConfig(llmConfig));
  const displayKey = llmConfig.apiKey ? maskApiKey(llmConfig.apiKey) : null;

  const modelOptions = models.map((m) => {
    const config = resolveOpenCodeGoLlmConfig(effectiveKey, m.id);
    return {
      value: m.id,
      label: formatOpenCodeGoModelLabel(m.id),
      vision: m.supportsVision ?? modelSupportsVision(config),
    };
  });

  const visionModelOptions = visionModels.map((m) => ({
    value: m.id,
    label: formatOpenCodeGoModelLabel(m.id),
    vision: true,
  }));

  const draftConfig = resolveOpenCodeGoLlmConfig(effectiveKey, selectedModel);
  const primarySupportsVision = modelSupportsVision(draftConfig);
  const needsVisionFallback = !primarySupportsVision;

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-muted leading-relaxed">
        Nebula uses{" "}
        <a
          href="https://opencode.ai/docs/go/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-secondary underline hover:text-text-primary"
        >
          OpenCode Go
        </a>{" "}
        for chat. Get an API key at{" "}
        <a
          href={OPENCODE_GO_AUTH_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-secondary underline hover:text-text-primary"
        >
          opencode.ai/auth
        </a>
        , paste it below, and pick a model. Your key stays in this browser only.
      </p>

      {configured && displayKey && (
        <p className="text-xs text-text-muted">
          Active key: <span className="text-text-secondary">{displayKey}</span>
          {llmConfig.model && (
            <>
              {" "}
              · Model:{" "}
              <span className="text-text-secondary">
                {formatOpenCodeGoModelLabel(llmConfig.model)}
              </span>
            </>
          )}
          {visionHelperConfig?.model && !modelSupportsVision(llmConfig) && (
            <>
              {" "}
              · Vision fallback:{" "}
              <span className="text-text-secondary">
                {formatOpenCodeGoModelLabel(visionHelperConfig.model)}
              </span>
            </>
          )}
        </p>
      )}

      <Input
        type="password"
        label="OpenCode Go API key"
        helper="From opencode.ai/auth after subscribing to OpenCode Go."
        placeholder={llmConfig.apiKey ? "Enter new key to replace" : "Paste your API key"}
        value={keyInput}
        onChange={(e) => setKeyInput(e.target.value)}
        autoComplete="off"
      />

      <div>
        <span className="block text-sm text-text-secondary mb-2">Model</span>
        <Select
          value={selectedModel}
          options={modelOptions}
          onChange={setSelectedModel}
          disabled={modelsLoading || modelOptions.length === 0}
          placeholder={
            modelsLoading
              ? "Loading models…"
              : modelsError
                ? "Could not load models"
                : "Select a model"
          }
          ariaLabel="OpenCode Go model"
        />
        {modelsError && (
          <p className="mt-2 text-xs text-red-400/90">{modelsError}</p>
        )}
        {!modelsError && !modelsLoading && modelOptions.length > 0 && (
          <p className="mt-2 text-xs text-text-muted">
            {modelOptions.length} models available from OpenCode Go. Models with
            the eye icon support image input.
          </p>
        )}
      </div>

      {needsVisionFallback && (
        <div className="pt-2 border-t border-border">
          <span className="block text-sm text-text-secondary mb-2">
            Vision fallback model
          </span>
          <Select
            value={effectiveVisionModel}
            options={visionModelOptions}
            onChange={setSelectedVisionModel}
            disabled={
              modelsLoading ||
              visionModelOptions.length === 0 ||
              Boolean(modelsError)
            }
            placeholder={
              modelsLoading
                ? "Loading models…"
                : visionModelOptions.length === 0
                  ? "No vision models available"
                  : "Select a vision model"
            }
            ariaLabel="OpenCode Go vision fallback model"
          />
          <p className="mt-2 text-xs text-text-muted leading-relaxed">
            {visionModelOptions.length > 0
              ? "When you attach images, Nebula describes them with this vision model before sending text to your chat model."
              : "No vision-capable models were returned for your account. Images will not reach your chat model until you pick a vision-capable primary model."}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={save}
        disabled={!canSave}
        className="px-5 py-2.5 rounded-xl bg-accent text-accent-fg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
      >
        Save model settings
      </button>

      {status && <p className="text-xs text-text-secondary">{status}</p>}
    </div>
  );
}
