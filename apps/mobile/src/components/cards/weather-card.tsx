import { View, Text } from "react-native";
import type { ActionResult } from "@nebula/core/constellation-registry";
import { useTheme } from "@/providers/theme-provider";

export function WeatherCard({ result }: { result: ActionResult }) {
  const { colors } = useTheme();
  if (result.type === "weather_error") {
    return (
      <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.dangerBg }}>
        <Text style={{ color: colors.danger }}>
          {String(result.error ?? result.message ?? "Weather error")}
        </Text>
      </View>
    );
  }
  const data = result.data as { current?: { temperature?: number }; daily?: unknown } | undefined;
  const temp = data?.current?.temperature;
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
      <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>
        {String(result.location ?? "Weather")}
      </Text>
      {temp != null && (
        <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
          {temp}°C
        </Text>
      )}
    </View>
  );
}
