import { useCallback, useState } from "react";
import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/providers/theme-provider";
import { useChat } from "@/lib/use-chat";
import { useLunaStore } from "@/stores/use-luna-store";
import { MessageList } from "@/components/chat/message-list";
import { ChatComposer } from "@/components/chat/chat-composer";
import { Dock } from "@/components/chat/dock";
import { getSecretsAdapter } from "@nebula/core/secrets";
import { useEffect } from "react";

export default function ChatScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sendMessage, stop, sandboxOpen } = useChat();
  const createConversation = useLunaStore((s) => s.createConversation);
  const conversations = useLunaStore((s) => s.conversations);
  const activeId = useLunaStore((s) => s.activeConversationId);
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    void getSecretsAdapter()
      .getDeepseekKey()
      .then((k) => setHasKey(!!k.trim()));
  }, []);

  useEffect(() => {
    if (sandboxOpen) router.push("/sandbox");
  }, [sandboxOpen, router]);

  const activeConv = conversations.find((c) => c.id === activeId);
  const newChatDisabled =
    !!activeConv && activeConv.messages.length === 0;

  const handleNewChat = useCallback(() => {
    createConversation();
  }, [createConversation]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: 20,
            fontWeight: "600",
            fontFamily: "Geist_600SemiBold",
          }}
        >
          Luna
        </Text>
        {hasKey === false && (
          <Text style={{ color: colors.warning, fontSize: 12, marginTop: 4 }}>
            Add your DeepSeek API key in Settings to chat.
          </Text>
        )}
      </View>

      <MessageList />
      <ChatComposer
        onSend={(t) => void sendMessage(t)}
        onStop={stop}
        disabled={hasKey === false}
      />
      <Dock onNewChat={handleNewChat} newChatDisabled={newChatDisabled} />
    </View>
  );
}
