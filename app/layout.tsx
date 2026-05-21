import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#171714" },
    { media: "(prefers-color-scheme: light)", color: "#171714" },
  ],
};

export const metadata: Metadata = {
  title: { default: "Nebula · Luna", template: "%s · Nebula" },
  description: "Local-first AI chat powered by Luna — tasks, weather, links, and more in one chat.",
  keywords: ["AI", "chat", "assistant", "local-first", "tasks", "weather", "productivity"],
  authors: [{ name: "Anthony Saliba" }],
  creator: "Anthony Saliba",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nebula",
  },
  applicationName: "Nebula",
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Nebula · Luna",
    title: "Nebula · Luna",
    description: "Local-first AI chat powered by Luna — tasks, weather, links, and more in one chat.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nebula · Luna",
    description: "Local-first AI chat powered by Luna — tasks, weather, links, and more in one chat.",
    creator: "@as9284",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="nebula-app antialiased">{children}</body>
    </html>
  );
}
