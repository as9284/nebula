import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { generateId } from "@nebula/core/utils";
import { asyncStorage } from "@/lib/storage";
import { triggerCloudSync } from "@/lib/sync-trigger";

export interface ShortLinkEntry {
  id: string;
  originalUrl: string;
  shortUrl: string;
  createdAt: number;
}

interface HyperlaneState {
  history: ShortLinkEntry[];
  addEntry: (originalUrl: string, shortUrl: string) => ShortLinkEntry;
  removeEntry: (id: string) => void;
  hydrate: (history: ShortLinkEntry[]) => void;
}

export const useHyperlaneStore = create<HyperlaneState>()(
  persist(
    (set) => ({
      history: [],
      addEntry: (originalUrl, shortUrl) => {
        const entry: ShortLinkEntry = {
          id: generateId(),
          originalUrl,
          shortUrl,
          createdAt: Date.now(),
        };
        set((s) => ({
          history: [
            entry,
            ...s.history.filter((h) => h.originalUrl !== originalUrl),
          ].slice(0, 50),
        }));
        triggerCloudSync();
        return entry;
      },
      removeEntry: (id) => {
        set((s) => ({ history: s.history.filter((h) => h.id !== id) }));
        triggerCloudSync();
      },
      hydrate: (history) => {
        set({ history });
        triggerCloudSync();
      },
    }),
    { name: "nebula-hyperlane", storage: createJSONStorage(() => asyncStorage) },
  ),
);
