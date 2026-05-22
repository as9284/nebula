"use client";

import { useSyncExternalStore } from "react";
import { useLunaStore } from "@/stores/use-luna-store";
import { useSettingsStore } from "@/stores/use-settings-store";

const PERSISTED_STORES = [useSettingsStore, useLunaStore] as const;

function allStoresHydrated() {
  return PERSISTED_STORES.every((store) => store.persist.hasHydrated());
}

function subscribeHydration(onStoreChange: () => void) {
  if (allStoresHydrated()) return () => {};

  const unsubs = PERSISTED_STORES.map((store) =>
    store.persist.onFinishHydration(() => {
      if (allStoresHydrated()) onStoreChange();
    }),
  );

  return () => unsubs.forEach((unsub) => unsub());
}

/** Wait until zustand persist has rehydrated from localStorage / IndexedDB. */
export function useStoresHydrated() {
  return useSyncExternalStore(
    subscribeHydration,
    allStoresHydrated,
    () => false,
  );
}
