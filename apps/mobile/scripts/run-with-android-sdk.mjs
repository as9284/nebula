import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { resolveAndroidSdk } from "./resolve-android-sdk.mjs";

const mobileRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const sdk = resolveAndroidSdk();

const env = {
  ...process.env,
  ANDROID_HOME: sdk,
  ANDROID_SDK_ROOT: sdk,
  PATH: [
    path.join(sdk, "platform-tools"),
    path.join(sdk, "emulator"),
    path.join(sdk, "tools"),
    path.join(sdk, "tools", "bin"),
    process.env.PATH ?? "",
  ].join(path.delimiter),
};

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error("Usage: node scripts/run-with-android-sdk.mjs <command> [args...]");
  process.exit(1);
}

const child = spawn(command, args, {
  cwd: mobileRoot,
  env,
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("exit", (code) => process.exit(code ?? 1));
