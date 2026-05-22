import { gatherBackupData, applyBackup } from "@/lib/backup";
import type { NebulaBackup } from "@nebula/core/backup-schema";
import { createSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { useLunaStore } from "@/stores/use-luna-store";
import { useSyncStore } from "@/stores/use-sync-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEBOUNCE_MS = 2000;
const CLIENT_ID_KEY = "nebula-sync-client-id";

let suppressCloudSync = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function setSuppressCloudSync(value: boolean) {
  suppressCloudSync = value;
}

export function gatherSyncPayload() {
  return gatherBackupData(false);
}

async function getClientId(): Promise<string> {
  let id = await AsyncStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await AsyncStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

function isStreamingActive(): boolean {
  return (
    Object.keys(useLunaStore.getState().streamingByConversationId).length > 0
  );
}

async function getSessionUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

function canSync(): boolean {
  const { cloudSyncEnabled } = useSyncStore.getState();
  return isSupabaseConfigured() && cloudSyncEnabled;
}

export async function pushRemoteSnapshot(userId: string): Promise<void> {
  const supabase = createSupabaseClient();
  const backup = gatherSyncPayload();
  const clientId = await getClientId();

  const { data: existing } = await supabase
    .from("user_snapshots")
    .select("revision")
    .eq("user_id", userId)
    .maybeSingle();

  const revision = (existing?.revision ?? 0) + 1;
  const updatedAt = new Date().toISOString();

  const { error } = await supabase.from("user_snapshots").upsert({
    user_id: userId,
    backup,
    revision,
    updated_at: updatedAt,
    client_id: clientId,
  });

  if (error) throw error;

  const sync = useSyncStore.getState();
  sync.setLastPushedAt(updatedAt);
  sync.clearDirty();
  sync.setLastError(null);
  sync.setConflictRemoteAt(null);
}

export type PullResult = "applied" | "skipped" | "conflict" | "no_remote";

export async function pullRemoteSnapshot(userId: string): Promise<PullResult> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("user_snapshots")
    .select("backup, updated_at, revision")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return "no_remote";

  const remoteAt = data.updated_at as string;
  const sync = useSyncStore.getState();
  const lastPushed = sync.lastPushedAt;
  const dirty = sync.dirty;

  if (lastPushed && remoteAt <= lastPushed && !dirty) {
    sync.setLastPulledAt(remoteAt);
    return "skipped";
  }

  if (dirty && lastPushed && remoteAt > lastPushed) {
    sync.setConflictRemoteAt(remoteAt);
    return "conflict";
  }

  if (!dirty && lastPushed && remoteAt <= lastPushed) {
    sync.setLastPulledAt(remoteAt);
    return "skipped";
  }

  setSuppressCloudSync(true);
  try {
    const snapshot: NebulaBackup = {
      version: 1,
      exportedAt: remoteAt,
      app: "nebula",
      data: data.backup as NebulaBackup["data"],
    };
    applyBackup(snapshot);
    sync.setLastPulledAt(remoteAt);
    sync.setLastPushedAt(remoteAt);
    sync.clearDirty();
    sync.setConflictRemoteAt(null);
    sync.setLastError(null);
    return "applied";
  } finally {
    setSuppressCloudSync(false);
  }
}

export async function applyRemoteAndResolveConflict(userId: string): Promise<void> {
  setSuppressCloudSync(true);
  try {
    const result = await pullRemoteSnapshot(userId);
    if (result === "conflict") {
      const supabase = createSupabaseClient();
      const { data } = await supabase
        .from("user_snapshots")
        .select("backup, updated_at")
        .eq("user_id", userId)
        .single();
      if (data) {
        applyBackup({
          version: 1,
          exportedAt: data.updated_at as string,
          app: "nebula",
          data: data.backup as NebulaBackup["data"],
        });
        useSyncStore.getState().setLastPulledAt(data.updated_at as string);
        useSyncStore.getState().setLastPushedAt(data.updated_at as string);
        useSyncStore.getState().clearDirty();
        useSyncStore.getState().setConflictRemoteAt(null);
      }
    }
  } finally {
    setSuppressCloudSync(false);
  }
}

export async function pushLocalAndResolveConflict(userId: string): Promise<void> {
  useSyncStore.getState().setConflictRemoteAt(null);
  await pushRemoteSnapshot(userId);
}

export async function flushCloudSync(): Promise<void> {
  if (suppressCloudSync || !canSync()) return;

  const userId = await getSessionUserId();
  if (!userId) return;

  const sync = useSyncStore.getState();
  sync.setIsSyncing(true);
  sync.setPendingSync(false);

  try {
    await pushRemoteSnapshot(userId);
  } catch (e) {
    sync.setLastError((e as Error).message);
  } finally {
    sync.setIsSyncing(false);
  }
}

export function scheduleCloudSync(): void {
  if (suppressCloudSync || !canSync()) return;

  if (isStreamingActive()) {
    useSyncStore.getState().setPendingSync(true);
    return;
  }

  useSyncStore.getState().markDirty();

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void flushCloudSync();
  }, DEBOUNCE_MS);
}

export async function runInitialCloudPull(): Promise<PullResult | null> {
  if (!canSync()) return null;

  const userId = await getSessionUserId();
  if (!userId) return null;

  const sync = useSyncStore.getState();
  sync.setIsSyncing(true);

  try {
    const hasLocalData =
      useLunaStore.getState().conversations.length > 0 ||
      useLunaStore.getState().memories.length > 0;

    if (!sync.lastPushedAt && hasLocalData) {
      await pushRemoteSnapshot(userId);
      return "skipped";
    }

    return await pullRemoteSnapshot(userId);
  } catch (e) {
    sync.setLastError((e as Error).message);
    return null;
  } finally {
    sync.setIsSyncing(false);
  }
}
