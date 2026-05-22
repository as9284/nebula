import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
} from "@expo-google-fonts/geist";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { AppProviders } from "@/providers/app-providers";
import { useTheme } from "@/providers/theme-provider";

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { mode, colors } = useTheme();

  return (
    <>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(main)" />
        <Stack.Screen
          name="chats"
          options={{ presentation: "modal", animation: "slide_from_left" }}
        />
        <Stack.Screen
          name="settings"
          options={{ presentation: "modal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="orbit"
          options={{ presentation: "modal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="sandbox"
          options={{ presentation: "modal", animation: "slide_from_right" }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
  });

  useEffect(() => {
    if (loaded) void SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <AppProviders>
      <RootStack />
    </AppProviders>
  );
}
