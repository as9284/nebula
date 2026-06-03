"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  DEFAULT_LLM_CONFIG,
  migrateLlmConfig,
  type LlmConfig,
} from "@nebula/core/llm-config";
import type { LunaControls } from "@/lib/luna-prompt";
import type { SearchProvider } from "@/types/search";
import { triggerCloudSync } from "@/lib/sync-trigger";

export type ThemeMode = "dark" | "light";

interface SettingsState {
  llmConfig: LlmConfig;
  /** When the chat model cannot see images, describe them with a vision helper first. */
  describeImagesForTextModels: boolean;
  /** Optional dedicated vision model; leave empty to auto-pick on your endpoint. */
  visionHelperConfig: LlmConfig | null;
  tavilyKey: string;
  searchProvider: SearchProvider;
  theme: ThemeMode;
  lunaControls: LunaControls;
  setLlmConfig: (config: LlmConfig) => void;
  setDescribeImagesForTextModels: (enabled: boolean) => void;
  setVisionHelperConfig: (config: LlmConfig | null) => void;
  setTavilyKey: (key: string) => void;
  setSearchProvider: (provider: SearchProvider) => void;
  setTheme: (theme: ThemeMode) => void;
  setLunaControls: (partial: Partial<LunaControls>) => void;
}

const defaultControls: LunaControls = {
  decisionStyle: "balanced",
  personalityIntensity: "balanced",
  responseStyle: "balanced",
  creativity: "moderate",
  clarification: false,
  shopping: false,
  research: false,
  translation: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      llmConfig: { ...DEFAULT_LLM_CONFIG },
      describeImagesForTextModels: true,
      visionHelperConfig: null,
      tavilyKey: "",
      searchProvider: "builtin",
      theme: "dark",
      lunaControls: defaultControls,
      setLlmConfig: (llmConfig) => set({ llmConfig }),
      setDescribeImagesForTextModels: (describeImagesForTextModels) =>
        set({ describeImagesForTextModels }),
      setVisionHelperConfig: (visionHelperConfig) => set({ visionHelperConfig }),
      setTavilyKey: (tavilyKey) => set({ tavilyKey }),
      setSearchProvider: (searchProvider) => {
        set({ searchProvider });
        triggerCloudSync();
      },
      setTheme: (theme) => {
        set({ theme });
        triggerCloudSync();
      },
      setLunaControls: (partial) => {
        set((s) => ({
          lunaControls: { ...s.lunaControls, ...partial },
        }));
        triggerCloudSync();
      },
    }),
    {
      name: "nebula-settings",
      storage: createJSONStorage(() => localStorage),
      version: 6,
      migrate: (persisted) => {
        const state = persisted as SettingsState & {
          webSearchEnabled?: boolean;
          deepseekKey?: string;
          visionHelperConfig?: LlmConfig | null;
        };
        const {
          webSearchEnabled: _legacyWebSearch,
          deepseekKey,
          visionHelperConfig: _legacyVision,
          ...rest
        } = state;
        void _legacyWebSearch;
        void _legacyVision;

        const llmConfig = migrateLlmConfig(state.llmConfig, deepseekKey);

        return {
          ...rest,
          llmConfig,
          visionHelperConfig: null,
          describeImagesForTextModels:
            state.describeImagesForTextModels ?? true,
          searchProvider: state.searchProvider ?? "builtin",
          theme: state.theme ?? "dark",
        };
      },
    },
  ),
);
