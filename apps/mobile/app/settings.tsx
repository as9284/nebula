import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Switch,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useTheme } from "@/providers/theme-provider";
import { useSettingsStore } from "@/stores/use-settings-store";
import { useSyncStore } from "@/stores/use-sync-store";
import { useAuth } from "@/providers/auth-provider";
import { getSecretsAdapter } from "@nebula/core";
import { createSupabaseClient } from "@/lib/supabase";
import {
  authRedirectUri,
  createSessionFromUrl,
  useAuthDeepLink,
} from "@/lib/auth-linking";
import { applyBackup, gatherBackupData, parseBackupFile } from "@/lib/backup";
import {
  applyRemoteAndResolveConflict,
  pushLocalAndResolveConflict,
} from "@/lib/cloud-sync";
import type { NebulaBackup } from "@nebula/core/backup-schema";

export default function SettingsScreen() {
  const { colors, mode, setTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, loading, configured, signOut } = useAuth();
  const searchProvider = useSettingsStore((s) => s.searchProvider);
  const setSearchProvider = useSettingsStore((s) => s.setSearchProvider);
  const cloudSyncEnabled = useSyncStore((s) => s.cloudSyncEnabled);
  const setCloudSyncEnabled = useSyncStore((s) => s.setCloudSyncEnabled);
  const conflictRemoteAt = useSyncStore((s) => s.conflictRemoteAt);

  const [deepseekKey, setDeepseekKey] = useState("");
  const [tavilyKey, setTavilyKey] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  const loadKeys = useCallback(async () => {
    const s = getSecretsAdapter();
    setDeepseekKey(await s.getDeepseekKey());
    setTavilyKey(await s.getTavilyKey());
  }, []);

  useEffect(() => {
    void loadKeys();
  }, [loadKeys]);

  useAuthDeepLink((url) => {
    void createSessionFromUrl(url)
      .then((ok) => {
        if (ok) setStatus("Signed in successfully.");
      })
      .catch((e) => setStatus((e as Error).message));
  });

  const saveKeys = async () => {
    const s = getSecretsAdapter();
    await s.setDeepseekKey(deepseekKey.trim());
    await s.setTavilyKey(tavilyKey.trim());
    setStatus("API keys saved securely.");
  };

  const sendMagicLink = async () => {
    const trimmed = email.trim();
    if (!trimmed || !configured) return;
    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { emailRedirectTo: authRedirectUri },
      });
      if (error) throw error;
      setStatus("Check your email and open the link on this device.");
    } catch (e) {
      setStatus((e as Error).message);
    }
  };

  const exportBackup = async (includeKeys: boolean) => {
    const data: NebulaBackup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      app: "nebula",
      data: gatherBackupData(includeKeys),
    };
    const file = new File(Paths.cache, "nebula-backup.json");
    await file.write(JSON.stringify(data, null, 2));
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri);
    }
  };

  const importBackup = async () => {
    const pick = await DocumentPicker.getDocumentAsync({
      type: "application/json",
    });
    if (pick.canceled || !pick.assets[0]) return;
    const json = await new File(pick.assets[0].uri).text();
    const backup = await parseBackupFile(json);
    applyBackup(backup);
    setStatus("Backup restored.");
  };

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
          Settings
        </Text>
        <Pressable onPress={() => router.back()}>
          <X size={22} color={colors.textMuted} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 24 }}>
        <Section title="API keys" colors={colors}>
          <Field
            label="DeepSeek API key"
            value={deepseekKey}
            onChangeText={setDeepseekKey}
            colors={colors}
            secure
          />
          <Field
            label="Tavily API key (optional)"
            value={tavilyKey}
            onChangeText={setTavilyKey}
            colors={colors}
            secure
          />
          <Pressable
            onPress={() => void saveKeys()}
            style={{
              backgroundColor: colors.accent,
              padding: 12,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.accentFg, fontWeight: "600" }}>
              Save keys (SecureStore)
            </Text>
          </Pressable>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>
            Keys are stored in Android Keystore via expo-secure-store. Never synced
            to cloud.
          </Text>
        </Section>

        <Section title="Search" colors={colors}>
          <Row
            label="Use Tavily"
            colors={colors}
            right={
              <Switch
                value={searchProvider === "tavily"}
                onValueChange={(v) =>
                  setSearchProvider(v ? "tavily" : "builtin")
                }
              />
            }
          />
        </Section>

        <Section title="Appearance" colors={colors}>
          <Row
            label="Light theme"
            colors={colors}
            right={
              <Switch
                value={mode === "light"}
                onValueChange={(v) => setTheme(v ? "light" : "dark")}
              />
            }
          />
        </Section>

        <Section title="Backup" colors={colors}>
          <Pressable onPress={() => void exportBackup(false)} style={btnStyle(colors)}>
            <Text style={{ color: colors.textPrimary }}>Export backup</Text>
          </Pressable>
          <Pressable onPress={() => void importBackup()} style={btnStyle(colors)}>
            <Text style={{ color: colors.textPrimary }}>Import backup</Text>
          </Pressable>
        </Section>

        {configured && (
          <Section title="Account" colors={colors}>
            {loading ? (
              <Text style={{ color: colors.textMuted }}>Checking session…</Text>
            ) : user ? (
              <>
                <Text style={{ color: colors.textSecondary }}>{user.email}</Text>
                <Row
                  label="Cloud sync"
                  colors={colors}
                  right={
                    <Switch
                      value={cloudSyncEnabled}
                      onValueChange={setCloudSyncEnabled}
                    />
                  }
                />
                {conflictRemoteAt && (
                  <View style={{ gap: 8 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                      Cloud data is newer. Choose:
                    </Text>
                    <Pressable
                      onPress={() =>
                        user && void applyRemoteAndResolveConflict(user.id)
                      }
                      style={btnStyle(colors)}
                    >
                      <Text style={{ color: colors.textPrimary }}>Use cloud copy</Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        user && void pushLocalAndResolveConflict(user.id)
                      }
                      style={btnStyle(colors)}
                    >
                      <Text style={{ color: colors.textPrimary }}>
                        Keep local & upload
                      </Text>
                    </Pressable>
                  </View>
                )}
                <Pressable onPress={() => void signOut()}>
                  <Text style={{ color: colors.danger }}>Sign out</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Field
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  colors={colors}
                />
                <Pressable
                  onPress={() => void sendMagicLink()}
                  style={{
                    backgroundColor: colors.accent,
                    padding: 12,
                    borderRadius: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: colors.accentFg, fontWeight: "600" }}>
                    Send magic link
                  </Text>
                </Pressable>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                  Open the email link on this device. Add {authRedirectUri} to
                  Supabase redirect URLs.
                </Text>
              </>
            )}
          </Section>
        )}

        {status ? (
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 13,
              padding: 12,
              backgroundColor: colors.surface,
              borderRadius: 12,
            }}
          >
            {status}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <View style={{ gap: 12 }}>
      <Text
        style={{
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  colors,
  secure,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  colors: ReturnType<typeof useTheme>["colors"];
  secure?: boolean;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        autoCapitalize="none"
        placeholderTextColor={colors.textMuted}
        style={{
          color: colors.textPrimary,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 12,
          fontSize: 15,
        }}
      />
    </View>
  );
}

function Row({
  label,
  right,
  colors,
}: {
  label: string;
  right: React.ReactNode;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Text style={{ color: colors.textSecondary }}>{label}</Text>
      {right}
    </View>
  );
}

function btnStyle(colors: ReturnType<typeof useTheme>["colors"]) {
  return {
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  };
}
