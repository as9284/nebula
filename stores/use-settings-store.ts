"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { LunaControls } from "@/lib/luna-prompt";
import type { SearchProvider } from "@/types/search";

interface SettingsState {
  deepseekKey: string;
  tavilyKey: string;
  searchProvider: SearchProvider;
  lunaControls: LunaControls;
  setDeepseekKey: (key: string) => void;
  setTavilyKey: (key: string) => void;
  setSearchProvider: (provider: SearchProvider) => void;
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
      lunaControls: defaultControls,
      setDeepseekKey: (deepseekKey) => set({ deepseekKey }),
      setTavilyKey: (tavilyKey) => set({ tavilyKey }),
      setSearchProvider: (searchProvider) => set({ searchProvider }),
      setLunaControls: (partial) =>
        set((s) => ({
          lunaControls: { ...s.lunaControls, ...partial },
        })),
    }),
    {
      name: "nebula-settings",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persisted) => {
        const state = persisted as SettingsState & { webSearchEnabled?: boolean };
        const { webSearchEnabled: _, ...rest } = state;
        return {
          ...rest,
          searchProvider: state.searchProvider ?? "builtin",
        };
      },
    },
  ),
);
