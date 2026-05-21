"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { LunaControls } from "@/lib/luna-prompt";

interface SettingsState {
  deepseekKey: string;
  tavilyKey: string;
  webSearchEnabled: boolean;
  lunaControls: LunaControls;
  setDeepseekKey: (key: string) => void;
  setTavilyKey: (key: string) => void;
  setWebSearchEnabled: (enabled: boolean) => void;
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
      webSearchEnabled: false,
      lunaControls: defaultControls,
      setDeepseekKey: (deepseekKey) => set({ deepseekKey }),
      setTavilyKey: (tavilyKey) => set({ tavilyKey }),
      setWebSearchEnabled: (webSearchEnabled) => set({ webSearchEnabled }),
      setLunaControls: (partial) =>
        set((s) => ({
          lunaControls: { ...s.lunaControls, ...partial },
        })),
    }),
    { name: "nebula-settings", storage: createJSONStorage(() => localStorage) },
  ),
);
