import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import { nebulaColors, type ThemeMode } from "@nebula/theme";
import { useSettingsStore } from "@/stores/use-settings-store";
import type { ThemeColors } from "@/lib/theme";

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const system = useColorScheme();
  const mode: ThemeMode = theme;

  const colors = useMemo(() => nebulaColors[mode], [mode]);

  const value = useMemo(
    () => ({ mode, colors, setTheme }),
    [mode, colors, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
