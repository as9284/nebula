"use client";

import { useCallback, useEffect, useState } from "react";
import {
  formatOpenCodeGoModelLabel,
  OPENCODE_GO_AUTH_URL,
  OPENCODE_GO_DEFAULT_MODEL,
  parseOpenCodeGoModelsResponse,
  resolveOpenCodeGoLlmConfig,
  type OpenCodeGoModel,
} from "@nebula/core/opencode-go";
import { isLlmConfigured, normalizeLlmConfig } from "@nebula/core/llm-config";
import { maskApiKey } from "@/lib/api-keys";
import { useSettingsStore } from "@/stores/use-settings-store";
import { Checkbox } from "@/components/ui/checkbox";
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

export function ModelProviderSettings() {
  const llmConfig = useSettingsStore((s) => s.llmConfig);
  const setLlmConfig = useSettingsStore((s) => s.setLlmConfig);
  const describeImagesForTextModels = useSettingsStore(
    (s) => s.describeImagesForTextModels,
  );
  const setDescribeImagesForTextModels = useSettingsStore(
    (s) => s.setDescribeImagesForTextModels,
  );

  const [keyInput, setKeyInput] = useState("");
  const [selectedModel, setSelectedModel] = useState(
    () => llmConfig.model || OPENCODE_GO_DEFAULT_MODEL,
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

  const save = () => {
    const apiKey = keyInput.trim() || llmConfig.apiKey;
    const next = resolveOpenCodeGoLlmConfig(apiKey, selectedModel);
    if (!isLlmConfigured(next)) return;
    setLlmConfig(next);
    setKeyInput("");
    setStatus("OpenCode Go settings saved locally.");
    setTimeout(() => setStatus(""), 3000);
  };

  const canSave = isLlmConfigured(
    resolveOpenCodeGoLlmConfig(effectiveKey, selectedModel),
  );

  const configured = isLlmConfigured(normalizeLlmConfig(llmConfig));
  const displayKey = llmConfig.apiKey ? maskApiKey(llmConfig.apiKey) : null;

  const modelOptions = models.map((m) => ({
    value: m.id,
    label: formatOpenCodeGoModelLabel(m.id),
  }));

  const draftConfig = resolveOpenCodeGoLlmConfig(effectiveKey, selectedModel);

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
            {modelOptions.length} models available from OpenCode Go.
          </p>
        )}
      </div>

      <div className="pt-2 border-t border-border">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-text-secondary">
              Describe images for text-only models
            </p>
            <p className="mt-1 text-xs text-text-muted leading-relaxed">
              {modelSupportsVision(draftConfig)
                ? "Your selected model supports vision — images are sent directly."
                : describeImagesForTextModels
                  ? "OpenCode Go coding models do not support image input; this option has no effect."
                  : "Images are attached in the UI only; the model will not receive image content."}
            </p>
          </div>
          <Checkbox
            checked={describeImagesForTextModels}
            onChange={setDescribeImagesForTextModels}
            disabled={!modelSupportsVision(draftConfig)}
            ariaLabel="Describe images for text-only models"
          />
        </div>
      </div>

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
