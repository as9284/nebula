import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const mobileRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Resolve Android SDK path: android-sdk.path → ANDROID_HOME → default. */
export function resolveAndroidSdk() {
  const pathFile = path.join(mobileRoot, "android-sdk.path");
  if (fs.existsSync(pathFile)) {
    const line = fs.readFileSync(pathFile, "utf8").trim().split(/\r?\n/)[0]?.trim();
    if (line) return line;
  }
  if (process.env.ANDROID_HOME?.trim()) {
    return process.env.ANDROID_HOME.trim();
  }
  return "C:\\Android\\Sdk";
}
