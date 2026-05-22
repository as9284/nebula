import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SQLite from "expo-sqlite";

const SQLITE_DB = "nebula.db";

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(SQLITE_DB);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS kv_store (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
  }
  return db;
}

/** Zustand persist adapter backed by SQLite for large payloads (Luna, Orbit). */
export function createSqliteStorage(name: string) {
  const prefix = `${name}:`;
  return {
    getItem: async (key: string): Promise<string | null> => {
      const database = await getDb();
      const row = await database.getFirstAsync<{ value: string }>(
        "SELECT value FROM kv_store WHERE key = ?",
        `${prefix}${key}`,
      );
      return row?.value ?? null;
    },
    setItem: async (key: string, value: string): Promise<void> => {
      const database = await getDb();
      await database.runAsync(
        "INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)",
        `${prefix}${key}`,
        value,
      );
    },
    removeItem: async (key: string): Promise<void> => {
      const database = await getDb();
      await database.runAsync("DELETE FROM kv_store WHERE key = ?", `${prefix}${key}`);
    },
  };
}

export const asyncStorage = {
  getItem: (name: string) => AsyncStorage.getItem(name),
  setItem: (name: string, value: string) => AsyncStorage.setItem(name, value),
  removeItem: (name: string) => AsyncStorage.removeItem(name),
};
