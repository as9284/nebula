import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { useTheme } from "@/providers/theme-provider";
import {
  getSandboxPayload,
  clearSandboxPayload,
} from "@/lib/constellations/sandbox";

export default function SandboxScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const payload = getSandboxPayload();

  const close = () => {
    clearSandboxPayload();
    router.back();
  };

  const content = String(payload?.content ?? payload?.data ?? "");
  const type = String(payload?.type ?? "code");

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "600" }}>
          Sandbox ({type})
        </Text>
        <Pressable onPress={close}>
          <X size={22} color={colors.textMuted} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text
          style={{
            color: colors.textPrimary,
            fontFamily: "monospace",
            fontSize: 13,
            lineHeight: 20,
          }}
        >
          {content || "Empty sandbox"}
        </Text>
      </ScrollView>
    </View>
  );
}
