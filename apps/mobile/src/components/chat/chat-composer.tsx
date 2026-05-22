import { useState } from "react";
import {
  View,
  TextInput,
  Pressable,
  Text,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/providers/theme-provider";
import { useLunaStore } from "@/stores/use-luna-store";
import { StopButton } from "./stop-button";

interface ChatComposerProps {
  onSend: (text: string) => void;
  onStop: () => void;
  disabled?: boolean;
}

export function ChatComposer({ onSend, onStop, disabled }: ChatComposerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const draft = useLunaStore((s) => s.draftMessage);
  const setDraft = useLunaStore((s) => s.setDraftMessage);
  const streaming = useLunaStore((s) => {
    const id = s.activeConversationId;
    return id ? !!s.streamingByConversationId[id] : false;
  });

  const send = () => {
    const text = draft.trim();
    if (!text || disabled) return;
    onSend(text);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.bottom}
    >
      <View
        style={{
          paddingHorizontal: 12,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            gap: 8,
            backgroundColor: colors.bg,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message Luna…"
            placeholderTextColor={colors.textMuted}
            multiline
            style={{
              flex: 1,
              color: colors.textPrimary,
              fontSize: 16,
              maxHeight: 120,
              fontFamily: "Geist_400Regular",
            }}
            editable={!disabled && !streaming}
          />
          {streaming ? (
            <StopButton onPress={onStop} />
          ) : (
            <Pressable
              onPress={send}
              disabled={disabled || !draft.trim()}
              style={{
                backgroundColor: draft.trim() ? colors.accent : colors.surfaceHover,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 12,
                opacity: draft.trim() ? 1 : 0.5,
              }}
            >
              <Text
                style={{
                  color: colors.accentFg,
                  fontWeight: "600",
                  fontSize: 14,
                }}
              >
                Send
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
