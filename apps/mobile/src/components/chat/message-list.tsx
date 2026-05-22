import { View, Text, ScrollView, Pressable } from "react-native";
import Markdown from "react-native-markdown-display";
import { useTheme } from "@/providers/theme-provider";
import { useLunaStore } from "@/stores/use-luna-store";
import { ActionResultCard } from "@/components/cards/action-result";
import type { ActionResult } from "@nebula/core/constellation-registry";

export function MessageList() {
  const { colors } = useTheme();
  const conv = useLunaStore((s) =>
    s.conversations.find((c) => c.id === s.activeConversationId),
  );
  const actionResults = useLunaStore((s) => s.actionResults);
  const stream = useLunaStore((s) => {
    const id = s.activeConversationId;
    return id ? s.streamingByConversationId[id] : undefined;
  });

  if (!conv || conv.messages.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
        <Text
          style={{
            color: colors.textMuted,
            textAlign: "center",
            fontSize: 15,
            lineHeight: 22,
          }}
        >
          Ask Luna anything — tasks, weather, links, or chat.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 16 }}
    >
      {conv.messages.map((msg) => {
        const isUser = msg.role === "user";
        const results = actionResults[msg.id] ?? [];
        const phase =
          stream?.assistantMessageId === msg.id ? stream.phase : null;

        return (
          <View
            key={msg.id}
            style={{
              alignSelf: isUser ? "flex-end" : "flex-start",
              maxWidth: "92%",
            }}
          >
            <View
              style={{
                backgroundColor: isUser ? colors.surfaceElevated : colors.surface,
                borderRadius: 16,
                padding: 12,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              {phase && !msg.content ? (
                <Text style={{ color: colors.textMuted, fontStyle: "italic" }}>
                  {phase === "searching"
                    ? "Searching the web…"
                    : phase === "thinking"
                      ? "Thinking…"
                      : "…"}
                </Text>
              ) : isUser ? (
                <Text style={{ color: colors.textPrimary, fontSize: 15 }}>
                  {msg.content}
                </Text>
              ) : (
                <Markdown
                  style={{
                    body: { color: colors.textPrimary, fontSize: 15 },
                    link: { color: colors.luna },
                    code_inline: {
                      backgroundColor: colors.surfaceHover,
                      borderRadius: 4,
                    },
                  }}
                >
                  {msg.content || " "}
                </Markdown>
              )}
            </View>
            {results.map((r: ActionResult, i: number) => (
              <View key={i} style={{ marginTop: 8 }}>
                <ActionResultCard result={r} />
              </View>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}
