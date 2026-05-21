import { get, set, del } from "idb-keyval";
import type { StateStorage } from "zustand/middleware";

export function createIdbStorage(name: string): StateStorage {
  return {
    getItem: async (key) => (await get(`${name}:${key}`)) ?? null,
    setItem: async (key, value) => {
      await set(`${name}:${key}`, value);
    },
    removeItem: async (key) => {
      await del(`${name}:${key}`);
    },
  };
}
