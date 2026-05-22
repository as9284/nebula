import { useEffect, type ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { initMobileSecrets } from "@/lib/secrets";
import { ThemeProvider } from "./theme-provider";
import { AuthProvider } from "./auth-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    initMobileSecrets();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
