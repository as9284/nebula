import { Pressable, Text } from "react-native";
import { useTheme } from "@/providers/theme-provider";

export function StopButton({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: colors.dangerBg,
        borderWidth: 1,
        borderColor: colors.dangerBorder,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
      }}
    >
      <Text style={{ color: colors.danger, fontWeight: "600", fontSize: 14 }}>
        Stop
      </Text>
    </Pressable>
  );
}
