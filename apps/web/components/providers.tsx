"use client";

import { AuthProvider } from "@/components/auth/auth-provider";
import { ImageLightboxProvider } from "@/components/ui/image-lightbox";
import { ThemeProvider } from "@/components/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ImageLightboxProvider>
        <AuthProvider>{children}</AuthProvider>
      </ImageLightboxProvider>
    </ThemeProvider>
  );
}
