import type { LlmConfig } from "./llm-config";

/** Platform-specific secret storage (browser settings on web). */
export interface NebulaSecretsAdapter {
  getLlmConfig(): Promise<LlmConfig>;
  setLlmConfig(value: LlmConfig): Promise<void>;
  getTavilyKey(): Promise<string>;
  setTavilyKey(value: string): Promise<void>;
  clearKeys?(): Promise<void>;
}

let secretsAdapter: NebulaSecretsAdapter | null = null;

export function setSecretsAdapter(adapter: NebulaSecretsAdapter): void {
  secretsAdapter = adapter;
}

export function getSecretsAdapter(): NebulaSecretsAdapter {
  if (!secretsAdapter) {
    throw new Error("Nebula secrets adapter not configured");
  }
  return secretsAdapter;
}
