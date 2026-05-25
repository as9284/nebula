import type { Metadata } from "next";

/** Canonical production URL (also used for Supabase auth redirects). */
export function getServerSiteUrl(): string | null {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel.replace(/\/$/, "")}`;
  }
  return null;
}

export function getMetadataBase(): URL | undefined {
  const site = getServerSiteUrl();
  return site ? new URL(`${site}/`) : undefined;
}

export const SITE_NAME = "Nebula";

export const SITE_DESCRIPTION =
  "Local-first AI chat — tasks, weather, links, and more in one place.";

export const SITE_KEYWORDS = [
  "Nebula",
  "AI chat",
  "local-first",
  "assistant",
  "productivity",
  "tasks",
  "weather",
  "private AI",
];

export const siteOpenGraphImages = [
  {
    url: "/opengraph-image",
    width: 1200,
    height: 630,
    alt: `${SITE_NAME} — local-first AI chat`,
    type: "image/png" as const,
  },
];

export function buildSiteMetadata(): Metadata {
  const metadataBase = getMetadataBase();

  return {
    metadataBase,
    title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
    description: SITE_DESCRIPTION,
    keywords: SITE_KEYWORDS,
    applicationName: SITE_NAME,
    authors: [{ name: "Anthony Saliba", url: "https://github.com/as9284" }],
    creator: "Anthony Saliba",
    publisher: SITE_NAME,
    category: "productivity",
    manifest: "/manifest.json",
    alternates: metadataBase
      ? { canonical: "/" }
      : undefined,
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: SITE_NAME,
    },
    formatDetection: { telephone: false },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: SITE_NAME,
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
      url: metadataBase?.href,
      images: siteOpenGraphImages,
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
      creator: "@as9284",
      images: ["/twitter-image"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}
