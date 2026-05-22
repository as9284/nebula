import {
  gatherBackupDataFromSnapshot,
  nebulaBackupSchema,
  type NebulaBackup,
} from "@nebula/core";
import { useSettingsStore } from "@/stores/use-settings-store";
import { useLunaStore } from "@/stores/use-luna-store";
import { useOrbitStore } from "@/stores/use-orbit-store";
import { useSolarisStore } from "@/stores/use-solaris-store";
import { useHyperlaneStore } from "@/stores/use-hyperlane-store";
import type { Memory } from "@nebula/core/types/chat";

function getStoreSnapshot() {
  const settings = useSettingsStore.getState();
  const luna = useLunaStore.getState();
  const orbit = useOrbitStore.getState();
  const solaris = useSolarisStore.getState();
  const hyperlane = useHyperlaneStore.getState();

  return {
    settings: {
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

export function applyBackup(backup: NebulaBackup): void {
  const { data } = backup;
  const settings = useSettingsStore.getState();
  if (data.settings.searchProvider) {
    settings.setSearchProvider(data.settings.searchProvider);
  }
  settings.setLunaControls(data.settings.lunaControls);

  useLunaStore.getState().setConversations(
    data.luna.conversations as import("@nebula/core/types/chat").Conversation[],
  );
  useLunaStore.getState().setMemories(data.luna.memories as Memory[]);
  useLunaStore.getState().setActiveConversation(data.luna.activeConversationId);

  useOrbitStore.getState().hydrate({
    tasks: data.orbit.tasks as import("@nebula/core/types/orbit").Task[],
    notes: data.orbit.notes as import("@nebula/core/types/orbit").Note[],
    projects: data.orbit.projects as import("@nebula/core/types/orbit").Project[],
  });

  useSolarisStore.getState().hydrate({
    selectedLocation: data.solaris.selectedLocation as import("@nebula/core/weather-types").GeocodingResult | null,
    recentLocations: data.solaris.recentLocations as import("@nebula/core/weather-types").GeocodingResult[],
  });

  useHyperlaneStore.getState().hydrate(
    data.hyperlane.history as import("@/stores/use-hyperlane-store").ShortLinkEntry[],
  );
}

export async function parseBackupFile(json: string): Promise<NebulaBackup> {
  return nebulaBackupSchema.parse(JSON.parse(json) as unknown);
}
