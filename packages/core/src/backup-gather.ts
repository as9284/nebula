import type { LlmConfig } from "./llm-config";
import type { NebulaBackup } from "./backup-schema";

export interface BackupStoreSnapshot {
  settings: {
    llmConfig?: LlmConfig;
    deepseekKey?: string;
    tavilyKey?: string;
    searchProvider?: "builtin" | "tavily";
    lunaControls: NebulaBackup["data"]["settings"]["lunaControls"];
  };
  luna: NebulaBackup["data"]["luna"];
  orbit: NebulaBackup["data"]["orbit"];
  solaris: NebulaBackup["data"]["solaris"];
  hyperlane: NebulaBackup["data"]["hyperlane"];
}

export function gatherBackupDataFromSnapshot(
  snapshot: BackupStoreSnapshot,
  includeApiKeys: boolean,
): NebulaBackup["data"] {
  return {
    settings: {
      ...(includeApiKeys
        ? {
            llmConfig: snapshot.settings.llmConfig,
            deepseekKey: snapshot.settings.deepseekKey,
            tavilyKey: snapshot.settings.tavilyKey,
          }
        : {}),
      searchProvider: snapshot.settings.searchProvider,
      lunaControls: snapshot.settings.lunaControls,
    },
    luna: snapshot.luna,
    orbit: snapshot.orbit,
    solaris: snapshot.solaris,
    hyperlane: snapshot.hyperlane,
  };
}
