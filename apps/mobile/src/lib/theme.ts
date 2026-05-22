import { nebulaColors, type ThemeMode } from "@nebula/theme";

export function getThemeColors(mode: ThemeMode) {
  return nebulaColors[mode];
}

export type ThemeColors = ReturnType<typeof getThemeColors>;
