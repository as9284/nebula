import { useState, useMemo } from "react";
import { View, Text, Pressable, ScrollView, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Trash2 } from "lucide-react-native";
import { useTheme } from "@/providers/theme-provider";
import { useOrbitStore } from "@/stores/use-orbit-store";
import { useHyperlaneStore } from "@/stores/use-hyperlane-store";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Tab = "tasks" | "notes" | "projects" | "links";

export default function OrbitScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("tasks");
  const [query, setQuery] = useState("");
  const tasks = useOrbitStore((s) => s.tasks.filter((t) => !t.archived));
  const notes = useOrbitStore((s) => s.notes);
  const projects = useOrbitStore((s) => s.projects);
  const links = useHyperlaneStore((s) => s.history);
  const deleteTask = useOrbitStore((s) => s.deleteTask);
  const deleteNote = useOrbitStore((s) => s.deleteNote);
  const deleteProject = useOrbitStore((s) => s.deleteProject);
  const removeLink = useHyperlaneStore((s) => s.removeEntry);
  const [deleteTarget, setDeleteTarget] = useState<{
    kind: Tab;
    id: string;
    label: string;
  } | null>(null);

  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    const match = (text: string) => !q || text.toLowerCase().includes(q);
    return {
      tasks: tasks.filter((t) => match(t.title)),
      notes: notes.filter((n) => match(n.title) || match(n.content)),
      projects: projects.filter((p) => match(p.name)),
      links: links.filter(
        (l) => match(l.shortUrl) || match(l.originalUrl),
      ),
    };
  }, [tasks, notes, projects, links, q]);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    switch (deleteTarget.kind) {
      case "tasks":
        deleteTask(deleteTarget.id);
        break;
      case "notes":
        deleteNote(deleteTarget.id);
        break;
      case "projects":
        deleteProject(deleteTarget.id);
        break;
      case "links":
        removeLink(deleteTarget.id);
        break;
    }
    setDeleteTarget(null);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "tasks", label: "Tasks" },
    { key: "notes", label: "Notes" },
    { key: "projects", label: "Projects" },
    { key: "links", label: "Links" },
  ];

  const list =
    tab === "tasks"
      ? filtered.tasks.map((t) => ({
          id: t.id,
          title: t.title,
          sub: t.completed ? "Done" : t.priority,
        }))
      : tab === "notes"
        ? filtered.notes.map((n) => ({
            id: n.id,
            title: n.title,
            sub: n.content.slice(0, 80),
          }))
        : tab === "projects"
          ? filtered.projects.map((p) => ({
              id: p.id,
              title: p.name,
              sub: p.description ?? "",
            }))
          : filtered.links.map((l) => ({
              id: l.id,
              title: l.shortUrl,
              sub: l.originalUrl,
            }));

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
          Orbit
        </Text>
        <Pressable onPress={() => router.back()}>
          <X size={22} color={colors.textMuted} />
        </Pressable>
      </View>

      <TextInput
        placeholder="Search…"
        placeholderTextColor={colors.textMuted}
        value={query}
        onChangeText={setQuery}
        style={{
          margin: 16,
          padding: 12,
          borderRadius: 12,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          color: colors.textPrimary,
        }}
      />

      <View style={{ flexDirection: "row", paddingHorizontal: 16, gap: 8 }}>
        {tabs.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor:
                tab === t.key ? colors.surfaceElevated : "transparent",
            }}
          >
            <Text
              style={{
                color: tab === t.key ? colors.textPrimary : colors.textMuted,
                fontSize: 13,
                fontWeight: "500",
              }}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
        {list.length === 0 ? (
          <Text style={{ color: colors.textMuted, textAlign: "center", marginTop: 24 }}>
            No items yet. Ask Luna to create one.
          </Text>
        ) : (
          list.map((item) => (
            <View
              key={item.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 12,
                borderRadius: 12,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary }} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.sub ? (
                  <Text
                    style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}
                    numberOfLines={2}
                  >
                    {item.sub}
                  </Text>
                ) : null}
              </View>
              <Pressable
                onPress={() =>
                  setDeleteTarget({
                    kind: tab,
                    id: item.id,
                    label: item.title,
                  })
                }
              >
                <Trash2 size={18} color={colors.danger} />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      <ConfirmDialog
        open={!!deleteTarget}
        title={deleteTarget?.kind === "links" ? "Remove link?" : "Delete?"}
        description={
          deleteTarget
            ? `"${deleteTarget.label}" will be removed permanently.`
            : ""
        }
        confirmLabel={deleteTarget?.kind === "links" ? "Remove" : "Delete"}
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}
