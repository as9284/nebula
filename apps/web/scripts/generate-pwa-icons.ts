import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ImageResponse } from "next/og";
import { createAppIconImage } from "../lib/brand-app-icon";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "icons");

const targets = [
  { file: "icon-32.png", size: 32, maskable: false },
  { file: "icon-192.png", size: 192, maskable: false },
  { file: "icon-512.png", size: 512, maskable: false },
  { file: "apple-touch-icon.png", size: 180, maskable: false },
  { file: "icon-maskable-512.png", size: 512, maskable: true },
] as const;

async function main() {
  mkdirSync(outDir, { recursive: true });

  for (const { file, size, maskable } of targets) {
    const response = new ImageResponse(
      createAppIconImage({ maskable }),
      { width: size, height: size },
    );
    const buffer = Buffer.from(await response.arrayBuffer());
    writeFileSync(join(outDir, file), buffer);
    console.log(`wrote icons/${file} (${size}x${size})`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
