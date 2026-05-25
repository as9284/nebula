import { ImageResponse } from "next/og";
import { createAppIconImage } from "@/lib/brand-app-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(createAppIconImage(), { ...size });
}
