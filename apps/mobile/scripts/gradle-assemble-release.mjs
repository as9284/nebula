import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { resolveAndroidSdk } from "./resolve-android-sdk.mjs";

const mobileRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const androidDir = path.join(mobileRoot, "android");
const sdk = resolveAndroidSdk();

const env = {
  ...process.env,
  NODE_ENV: process.env.NODE_ENV ?? "production",
  ANDROID_HOME: sdk,
  ANDROID_SDK_ROOT: sdk,
};

const gradlew = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
const child = spawn(gradlew, ["assembleRelease"], {
  cwd: androidDir,
  env,
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("exit", (code) => process.exit(code ?? 1));
