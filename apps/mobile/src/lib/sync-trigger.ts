import { scheduleCloudSync } from "@/lib/cloud-sync";

export function triggerCloudSync(): void {
  scheduleCloudSync();
}
