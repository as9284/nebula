"use client";

import {
  gatherBackupDataFromSnapshot,
  migrateLlmConfig,
  nebulaBackupSchema,
  type NebulaBackup,
} from "@nebula/core";
import { useSettingsStore } from "@/stores/use-settings-store";
import { useLunaStore } from "@/stores/use-luna-store";
import { useOrbitStore } from "@/stores/use-orbit-store";
import { useSolarisStore } from "@/stores/use-solaris-store";
import { useHyperlaneStore } from "@/stores/use-hyperlane-store";
import type { Memory } from "@/types/chat";

function getStoreSnapshot() {
  const settings = useSettingsStore.getState();
  const luna = useLunaStore.getState();
  const orbit = useOrbitStore.getState();
  const solaris = useSolarisStore.getState();
  const hyperlane = useHyperlaneStore.getState();

  return {
    settings: {
      llmConfig: settings.llmConfig,
      tavilyKey: settings.tavilyKey,
      searchProvider: settings.searchProvider,
      lunaControls: settings.lunaControls,
    },
    luna: {
      conversations: luna.conversations,
      memories: luna.memories,
      activeConversationId: luna.activeConversationId,
    },
    orbit: {
      tasks: orbit.tasks,
      notes: orbit.notes,
      projects: orbit.projects,
    },
    solaris: {
      selectedLocation: solaris.selectedLocation,
      recentLocations: solaris.recentLocations,
    },
    hyperlane: { history: hyperlane.history },
  };
}

export function gatherBackupData(includeApiKeys: boolean): NebulaBackup["data"] {
  return gatherBackupDataFromSnapshot(getStoreSnapshot(), includeApiKeys);
}

export function exportNebulaBackup(includeApiKeys: boolean): void {
  const backup: NebulaBackup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    app: "nebula",
    data: gatherBackupData(includeApiKeys),
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nebula-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportMemoriesOnly(): void {
  const memories = useLunaStore.getState().memories;
  const blob = new Blob([JSON.stringify({ memories }, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nebula-memories-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function applyBackup(backup: NebulaBackup): void {
  const { data } = backup;
  const settings = useSettingsStore.getState();
  if (data.settings.llmConfig || data.settings.deepseekKey !== undefined) {
    settings.setLlmConfig(
      migrateLlmConfig(data.settings.llmConfig, data.settings.deepseekKey),
    );
  }
  if (data.settings.tavilyKey !== undefined) {
    settings.setTavilyKey(data.settings.tavilyKey);
  }
  if (data.settings.searchProvider) {
    settings.setSearchProvider(data.settings.searchProvider);
  }
  settings.setLunaControls(data.settings.lunaControls);

  useLunaStore.getState().setConversations(
    data.luna.conversations as import("@/types/chat").Conversation[],
  );
  useLunaStore.getState().setMemories(data.luna.memories as Memory[]);
  useLunaStore.getState().setActiveConversation(data.luna.activeConversationId);

  useOrbitStore.getState().hydrate({
    tasks: data.orbit.tasks as import("@/types/orbit").Task[],
    notes: data.orbit.notes as import("@/types/orbit").Note[],
    projects: data.orbit.projects as import("@/types/orbit").Project[],
  });

  useSolarisStore.getState().hydrate({
    selectedLocation: data.solaris.selectedLocation as import("@/lib/weather-types").GeocodingResult | null,
    recentLocations: data.solaris.recentLocations as import("@/lib/weather-types").GeocodingResult[],
  });

  useHyperlaneStore.getState().hydrate(
    data.hyperlane.history as import("@/stores/use-hyperlane-store").ShortLinkEntry[],
  );
}

export async function importNebulaBackup(file: File): Promise<{
  summary: string;
}> {
  const text = await file.text();
  const parsed = JSON.parse(text) as unknown;
  const backup = nebulaBackupSchema.parse(parsed);

  const nConv = backup.data.luna.conversations.length;
  const nMem = backup.data.luna.memories.length;
  const nTasks = backup.data.orbit.tasks.length;

  applyBackup(backup);

  return {
    summary: `${nConv} conversations, ${nMem} memories, ${nTasks} tasks restored.`,
  };
}

export async function importMemoriesOnly(file: File): Promise<void> {
  const text = await file.text();
  const parsed = JSON.parse(text) as { memories?: Memory[] };
  if (!Array.isArray(parsed.memories)) {
    throw new Error("Invalid memories file");
  }
  useLunaStore.getState().setMemories(parsed.memories);
}
