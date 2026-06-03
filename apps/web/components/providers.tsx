"use client";

import { AuthProvider } from "@/components/auth/auth-provider";
import { ImageLightboxProvider } from "@/components/ui/image-lightbox";
import { OpenCodeGoCatalogLoader } from "@/components/opencode-go-catalog-loader";
import { ThemeProvider } from "@/components/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <OpenCodeGoCatalogLoader />
      <ImageLightboxProvider>
        <AuthProvider>{children}</AuthProvider>
      </ImageLightboxProvider>
    </ThemeProvider>
  );
}
