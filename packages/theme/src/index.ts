export type ThemeMode = "dark" | "light";

export interface NebulaColorTokens {
  bg: string;
  surface: string;
  surfaceHover: string;
  surfaceElevated: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentFg: string;
  luna: string;
  danger: string;
  dangerBg: string;
  dangerBorder: string;
  warning: string;
  overlayBackdrop: string;
  lunaBg: string;
  lunaBorder: string;
}

export const nebulaColors: Record<ThemeMode, NebulaColorTokens> = {
  dark: {
    bg: "#171714",
    surface: "#1f1f1c",
    surfaceHover: "#2a2a26",
    surfaceElevated: "#252522",
    border: "rgba(255, 255, 255, 0.06)",
    textPrimary: "#e8e6e3",
    textSecondary: "#9b9a97",
    textMuted: "#6f6e6b",
    accent: "#e8e6e3",
    accentFg: "#171714",
    luna: "#8a78e6",
    danger: "#f87171",
    dangerBg: "rgba(248, 113, 113, 0.1)",
    dangerBorder: "rgba(248, 113, 113, 0.25)",
    warning: "#fbbf24",
    overlayBackdrop: "rgba(0, 0, 0, 0.45)",
    lunaBg: "rgba(138, 120, 230, 0.14)",
    lunaBorder: "rgba(138, 120, 230, 0.28)",
  },
  light: {
    bg: "#f7f6f3",
    surface: "#ffffff",
    surfaceHover: "#f0efec",
    surfaceElevated: "#ffffff",
    border: "rgba(0, 0, 0, 0.08)",
    textPrimary: "#1a1a18",
    textSecondary: "#5c5c58",
    textMuted: "#8a8a85",
    accent: "#1a1a18",
    accentFg: "#f7f6f3",
    luna: "#6b5cc6",
    danger: "#dc2626",
    dangerBg: "rgba(220, 38, 38, 0.1)",
    dangerBorder: "rgba(220, 38, 38, 0.25)",
    warning: "#d97706",
    overlayBackdrop: "rgba(0, 0, 0, 0.35)",
    lunaBg: "rgba(107, 92, 198, 0.12)",
    lunaBorder: "rgba(107, 92, 198, 0.28)",
  },
};
