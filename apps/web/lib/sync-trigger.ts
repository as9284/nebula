"use client";

import { scheduleCloudSync } from "@/lib/cloud-sync";

/** Fire-and-forget debounced cloud sync after local store mutations. */
export function triggerCloudSync(): void {
  scheduleCloudSync();
}
