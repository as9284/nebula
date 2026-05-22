import { View, Text } from "react-native";
import type { ActionResult } from "@nebula/core/constellation-registry";
import { useTheme } from "@/providers/theme-provider";
import { ShortlinkCard } from "./shortlink-card";
import { TaskCard } from "./task-card";
import { WeatherCard } from "./weather-card";

export function ActionResultCard({ result }: { result: ActionResult }) {
  const type = result.type;
  if (type === "short_url" || type === "short_url_error") {
    return <ShortlinkCard result={result} />;
  }
  if (
    type === "task_created" ||
    type === "orbit_done" ||
    type === "orbit_error"
  ) {
    return <TaskCard result={result} />;
  }
  if (type === "weather" || type === "weather_error") {
    return <WeatherCard result={result} />;
  }
  if (type === "sandbox_open" || type === "sandbox_opened") {
    const { colors } = useTheme();
    return (
      <View
        style={{
          padding: 12,
          borderRadius: 12,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
          Sandbox opened — open the panel from the dock
        </Text>
      </View>
    );
  }
  return null;
}
