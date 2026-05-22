import { Modal, View, Text, Pressable } from "react-native";
import { useTheme } from "@/providers/theme-provider";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: colors.overlayBackdrop,
          justifyContent: "center",
          padding: 24,
        }}
        onPress={onCancel}
      >
        <Pressable
          style={{
            backgroundColor: colors.surfaceElevated,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 18,
              fontWeight: "600",
              marginBottom: 8,
            }}
          >
            {title}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20 }}>
            {description}
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
            <Pressable onPress={onCancel} style={{ padding: 10 }}>
              <Text style={{ color: colors.textSecondary }}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onConfirm();
                onCancel();
              }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor:
                  variant === "danger" ? colors.dangerBg : colors.accent,
              }}
            >
              <Text
                style={{
                  color: variant === "danger" ? colors.danger : colors.accentFg,
                  fontWeight: "600",
                }}
              >
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
