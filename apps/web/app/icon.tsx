import { ImageResponse } from "next/og";
import { createAppIconImage } from "@/lib/brand-app-icon";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(createAppIconImage(), { ...size });
}
