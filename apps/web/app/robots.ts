import type { MetadataRoute } from "next";
import { getServerSiteUrl } from "@/lib/site-metadata";

export default function robots(): MetadataRoute.Robots {
  const site = getServerSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/"],
    },
    sitemap: site ? `${site}/sitemap.xml` : undefined,
    host: site ?? undefined,
  };
}
