import type { MetadataRoute } from "next";
import { contentDb } from "@/lib/database";
import { SITE_URL } from "@/lib/site";

const staticRoutes: MetadataRoute.Sitemap = [
  {
    url: SITE_URL,
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    url: `${SITE_URL}/about`,
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    url: `${SITE_URL}/work`,
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    url: `${SITE_URL}/service`,
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    url: `${SITE_URL}/contact`,
    changeFrequency: "monthly",
    priority: 0.8,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: portfolios } = await contentDb
    .from("portfolios")
    .select("id, updated_at")
    .eq("is_published", true);

  const portfolioUrls: MetadataRoute.Sitemap = (portfolios || []).map(
    (portfolio) => ({
      url: `${SITE_URL}/work/${portfolio.id}`,
      lastModified: portfolio.updated_at || undefined,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })
  );

  return [...staticRoutes, ...portfolioUrls];
}
