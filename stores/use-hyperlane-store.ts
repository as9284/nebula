"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { generateId } from "@/lib/utils";

export interface ShortLinkEntry {
  id: string;
  originalUrl: string;
  shortUrl: string;
  createdAt: number;
}

interface HyperlaneState {
  history: ShortLinkEntry[];
  addEntry: (originalUrl: string, shortUrl: string) => ShortLinkEntry;
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
        return entry;
      },
      hydrate: (history) => set({ history }),
    }),
    { name: "nebula-hyperlane", storage: createJSONStorage(() => localStorage) },
  ),
);
