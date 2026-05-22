import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { asyncStorage } from "@/lib/storage";

interface SyncState {
  cloudSyncEnabled: boolean;
  lastPushedAt: string | null;
  lastPulledAt: string | null;
  dirty: boolean;
  isSyncing: boolean;
  pendingSync: boolean;
  lastError: string | null;
  conflictRemoteAt: string | null;
  setCloudSyncEnabled: (v: boolean) => void;
  setLastPushedAt: (v: string | null) => void;
  setLastPulledAt: (v: string | null) => void;
  markDirty: () => void;
  clearDirty: () => void;
  setIsSyncing: (v: boolean) => void;
  setPendingSync: (v: boolean) => void;
  setLastError: (v: string | null) => void;
  setConflictRemoteAt: (v: string | null) => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      cloudSyncEnabled: false,
      lastPushedAt: null,
      lastPulledAt: null,
      dirty: false,
      isSyncing: false,
      pendingSync: false,
      lastError: null,
      conflictRemoteAt: null,
      setCloudSyncEnabled: (cloudSyncEnabled) => set({ cloudSyncEnabled }),
      setLastPushedAt: (lastPushedAt) => set({ lastPushedAt }),
      setLastPulledAt: (lastPulledAt) => set({ lastPulledAt }),
      markDirty: () => set({ dirty: true }),
      clearDirty: () => set({ dirty: false }),
      setIsSyncing: (isSyncing) => set({ isSyncing }),
      setPendingSync: (pendingSync) => set({ pendingSync }),
      setLastError: (lastError) => set({ lastError }),
      setConflictRemoteAt: (conflictRemoteAt) => set({ conflictRemoteAt }),
    }),
    {
      name: "nebula-sync",
      storage: createJSONStorage(() => asyncStorage),
      partialize: (s) => ({
        cloudSyncEnabled: s.cloudSyncEnabled,
        lastPushedAt: s.lastPushedAt,
        lastPulledAt: s.lastPulledAt,
        dirty: s.dirty,
      }),
    },
  ),
);
