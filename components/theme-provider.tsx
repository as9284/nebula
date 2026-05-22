"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/stores/use-settings-store";

const THEME_COLORS = {
  dark: "#171714",
  light: "#f7f6f3",
} as const;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", theme === "light");
    root.style.colorScheme = theme === "light" ? "light" : "dark";

    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    if (meta) meta.content = THEME_COLORS[theme];
  }, [theme]);

  return <>{children}</>;
}
