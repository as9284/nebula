import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import "react-native-url-polyfill/auto";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

const AUTH_KEY_PREFIX = "nebula-auth-enc:";

async function getEncryptionKey(storageKey: string): Promise<string | null> {
  return SecureStore.getItemAsync(`${AUTH_KEY_PREFIX}${storageKey}`);
}

async function setEncryptionKey(storageKey: string, key: string): Promise<void> {
  await SecureStore.setItemAsync(`${AUTH_KEY_PREFIX}${storageKey}`, key);
}

/** Large session storage: AES key in SecureStore, payload in AsyncStorage. */
const largeSecureStore = {
  async getItem(key: string) {
    const encKey = await getEncryptionKey(key);
    if (!encKey) return null;
    return AsyncStorage.getItem(`sb:${key}`);
  },
  async setItem(key: string, value: string) {
    if (!(await getEncryptionKey(key))) {
      const randomKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await setEncryptionKey(key, randomKey);
    }
    await AsyncStorage.setItem(`sb:${key}`, value);
  },
  async removeItem(key: string) {
    await SecureStore.deleteItemAsync(`${AUTH_KEY_PREFIX}${key}`);
    await AsyncStorage.removeItem(`sb:${key}`);
  },
};

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function createSupabaseClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: largeSecureStore,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}
