import { View, Pressable, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MessageSquare, Orbit, Settings, Plus } from "lucide-react-native";
import { useTheme } from "@/providers/theme-provider";

interface DockProps {
  onNewChat: () => void;
  newChatDisabled?: boolean;
}

export function Dock({ onNewChat, newChatDisabled }: DockProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const item = (label: string, Icon: typeof Plus, onPress: () => void) => (
    <Pressable
      onPress={onPress}
      style={{ alignItems: "center", flex: 1, paddingVertical: 6 }}
    >
      <Icon size={22} color={colors.textSecondary} />
      <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 4 }}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View
      style={{
        flexDirection: "row",
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.surface,
        paddingBottom: Math.max(insets.bottom, 4),
        paddingTop: 6,
      }}
    >
      {item("Chats", MessageSquare, () => router.push("/chats"))}
      {item("New", Plus, () => !newChatDisabled && onNewChat())}
      {item("Orbit", Orbit, () => router.push("/orbit"))}
      {item("Settings", Settings, () => router.push("/settings"))}
    </View>
  );
}
