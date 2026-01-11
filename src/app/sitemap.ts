import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://siso-sign.com";

  const { data: portfolios } = await supabase
    .from("portfolios")
    .select("id, updated_at")
    .eq("is_published", true);

  const portfolioUrls: MetadataRoute.Sitemap = (portfolios || []).map(
    (portfolio) => ({
      url: `${baseUrl}/work/${portfolio.id}`,
      lastModified: portfolio.updated_at || new Date().toISOString(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })
  );

  return [
    {
      url: baseUrl,
      lastModified: new Date().toISOString(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/work`,
      lastModified: new Date().toISOString(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...portfolioUrls,
  ];
}
