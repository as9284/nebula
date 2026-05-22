"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { LunaControls } from "@/lib/luna-prompt";
import type { SearchProvider } from "@/types/search";
import { triggerCloudSync } from "@/lib/sync-trigger";

export type ThemeMode = "dark" | "light";

interface SettingsState {
  deepseekKey: string;
  tavilyKey: string;
  searchProvider: SearchProvider;
  theme: ThemeMode;
  lunaControls: LunaControls;
  setDeepseekKey: (key: string) => void;
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
      deepseekKey: "",
      tavilyKey: "",
      searchProvider: "builtin",
      theme: "dark",
      lunaControls: defaultControls,
      setDeepseekKey: (deepseekKey) => set({ deepseekKey }),
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
      version: 3,
      migrate: (persisted) => {
        const state = persisted as SettingsState & { webSearchEnabled?: boolean };
        const { webSearchEnabled: _legacyWebSearch, ...rest } = state;
        void _legacyWebSearch;
        return {
          ...rest,
          searchProvider: state.searchProvider ?? "builtin",
          theme: state.theme ?? "dark",
        };
      },
    },
  ),
);
