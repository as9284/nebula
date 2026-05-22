import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { LunaControls } from "@nebula/core/luna-prompt";
import type { SearchProvider } from "@nebula/core/types/search";
import type { ThemeMode } from "@nebula/theme";
import { asyncStorage } from "@/lib/storage";

interface SettingsState {
  searchProvider: SearchProvider;
  theme: ThemeMode;
  lunaControls: LunaControls;
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
      searchProvider: "builtin",
      theme: "dark",
      lunaControls: defaultControls,
      setSearchProvider: (searchProvider) => set({ searchProvider }),
      setTheme: (theme) => set({ theme }),
      setLunaControls: (partial) =>
        set((s) => ({ lunaControls: { ...s.lunaControls, ...partial } })),
    }),
    {
      name: "nebula-settings",
      storage: createJSONStorage(() => asyncStorage),
      partialize: (s) => ({
        searchProvider: s.searchProvider,
        theme: s.theme,
        lunaControls: s.lunaControls,
      }),
    },
  ),
);
