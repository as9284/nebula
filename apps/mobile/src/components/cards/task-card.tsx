import { View, Text } from "react-native";
import type { ActionResult } from "@nebula/core/constellation-registry";
import { useTheme } from "@/providers/theme-provider";

export function TaskCard({ result }: { result: ActionResult }) {
  const { colors } = useTheme();
  const isError = result.type === "orbit_error";
  const title = String(result.title ?? result.message ?? "Task");
  return (
    <View
      style={{
        padding: 12,
        borderRadius: 12,
        backgroundColor: isError ? colors.dangerBg : colors.lunaBg,
        borderWidth: 1,
        borderColor: isError ? colors.dangerBorder : colors.lunaBorder,
      }}
    >
      <Text style={{ color: isError ? colors.danger : colors.textPrimary, fontSize: 14 }}>
        {title}
      </Text>
    </View>
  );
}
