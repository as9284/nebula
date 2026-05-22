import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Trash2 } from "lucide-react-native";
import { useTheme } from "@/providers/theme-provider";
import { useLunaStore } from "@/stores/use-luna-store";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function ChatsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const conversations = useLunaStore((s) => s.conversations);
  const activeId = useLunaStore((s) => s.activeConversationId);
  const setActive = useLunaStore((s) => s.setActiveConversation);
  const deleteConversation = useLunaStore((s) => s.deleteConversation);
  const createConversation = useLunaStore((s) => s.createConversation);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "600" }}>
          Chats
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <X size={22} color={colors.textMuted} />
        </Pressable>
      </View>

      <Pressable
        onPress={() => {
          createConversation();
          router.back();
        }}
        style={{
          margin: 16,
          padding: 14,
          borderRadius: 12,
          backgroundColor: colors.surfaceElevated,
          alignItems: "center",
        }}
      >
        <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>New chat</Text>
      </Pressable>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {conversations.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => {
              setActive(c.id);
              router.back();
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 14,
              borderRadius: 12,
              backgroundColor:
                c.id === activeId ? colors.surfaceElevated : colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{ flex: 1, color: colors.textPrimary, fontSize: 15 }}
              numberOfLines={1}
            >
              {c.title}
            </Text>
            <Pressable
              onPress={() => setDeleteTarget({ id: c.id, title: c.title })}
              hitSlop={8}
            >
              <Trash2 size={18} color={colors.danger} />
            </Pressable>
          </Pressable>
        ))}
      </ScrollView>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete chat?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" will be removed permanently.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (deleteTarget) deleteConversation(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}
