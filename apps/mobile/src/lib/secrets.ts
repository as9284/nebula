import * as SecureStore from "expo-secure-store";
import {
  setSecretsAdapter,
  type NebulaSecretsAdapter,
} from "@nebula/core/secrets";

const KEYS = {
  deepseek: "nebula.deepseek",
  tavily: "nebula.tavily",
} as const;

const adapter: NebulaSecretsAdapter = {
  async getDeepseekKey() {
    return (await SecureStore.getItemAsync(KEYS.deepseek)) ?? "";
  },
  async setDeepseekKey(value: string) {
    if (value) await SecureStore.setItemAsync(KEYS.deepseek, value);
    else await SecureStore.deleteItemAsync(KEYS.deepseek);
  },
  async getTavilyKey() {
    return (await SecureStore.getItemAsync(KEYS.tavily)) ?? "";
  },
  async setTavilyKey(value: string) {
    if (value) await SecureStore.setItemAsync(KEYS.tavily, value);
    else await SecureStore.deleteItemAsync(KEYS.tavily);
  },
  async clearKeys() {
    await SecureStore.deleteItemAsync(KEYS.deepseek);
    await SecureStore.deleteItemAsync(KEYS.tavily);
  },
};

export function initMobileSecrets(): void {
  setSecretsAdapter(adapter);
}

export { adapter as mobileSecretsAdapter };
