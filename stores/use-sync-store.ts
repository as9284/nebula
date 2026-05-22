"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SyncState {
  cloudSyncEnabled: boolean;
  lastPushedAt: string | null;
  lastPulledAt: string | null;
  lastError: string | null;
  isSyncing: boolean;
  pendingSync: boolean;
  dirty: boolean;
  conflictRemoteAt: string | null;
  setCloudSyncEnabled: (enabled: boolean) => void;
  setLastPushedAt: (iso: string | null) => void;
  setLastPulledAt: (iso: string | null) => void;
  setLastError: (error: string | null) => void;
  setIsSyncing: (syncing: boolean) => void;
  setPendingSync: (pending: boolean) => void;
  markDirty: () => void;
  clearDirty: () => void;
  setConflictRemoteAt: (iso: string | null) => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      cloudSyncEnabled: true,
      lastPushedAt: null,
      lastPulledAt: null,
      lastError: null,
      isSyncing: false,
      pendingSync: false,
      dirty: false,
      conflictRemoteAt: null,
      setCloudSyncEnabled: (cloudSyncEnabled) => set({ cloudSyncEnabled }),
      setLastPushedAt: (lastPushedAt) => set({ lastPushedAt }),
      setLastPulledAt: (lastPulledAt) => set({ lastPulledAt }),
      setLastError: (lastError) => set({ lastError }),
      setIsSyncing: (isSyncing) => set({ isSyncing }),
      setPendingSync: (pendingSync) => set({ pendingSync }),
      markDirty: () => set({ dirty: true }),
      clearDirty: () => set({ dirty: false }),
      setConflictRemoteAt: (conflictRemoteAt) => set({ conflictRemoteAt }),
    }),
    {
      name: "nebula-sync",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        cloudSyncEnabled: s.cloudSyncEnabled,
        lastPushedAt: s.lastPushedAt,
        lastPulledAt: s.lastPulledAt,
        dirty: s.dirty,
      }),
    },
  ),
);
