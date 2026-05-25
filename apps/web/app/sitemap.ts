import type { MetadataRoute } from "next";
import { getServerSiteUrl } from "@/lib/site-metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = getServerSiteUrl() ?? "http://localhost:3000";
  const base = site.replace(/\/$/, "");

  return [
    {
      url: `${base}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
