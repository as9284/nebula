import { View, Text, Pressable, Linking } from "react-native";
import type { ActionResult } from "@nebula/core/constellation-registry";
import { useTheme } from "@/providers/theme-provider";

export function ShortlinkCard({ result }: { result: ActionResult }) {
  const { colors } = useTheme();
  if (result.type === "short_url_error") {
    return (
      <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.dangerBg }}>
        <Text style={{ color: colors.danger, fontSize: 14 }}>
          {String(result.error ?? "Could not shorten URL")}
        </Text>
      </View>
    );
  }
  const short = String(result.short ?? "");
  const original = String(result.original ?? "");
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
      <Pressable onPress={() => void Linking.openURL(short)}>
        <Text style={{ color: colors.luna, fontSize: 14 }}>{short}</Text>
      </Pressable>
      <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }} numberOfLines={2}>
        {original}
      </Text>
    </View>
  );
}
