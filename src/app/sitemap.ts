import type { MetadataRoute } from "next";
import { getPortfolioContent } from "@/lib/content/load";
import type { PortfolioConfig } from "@/types/portfolio";
import {
  buildCanonicalUrl,
  getPublishedArticles,
  getPublishedHighlights,
  isSectionEnabled,
} from "@/lib/content/selectors";

export function buildSitemapEntries(
  config: PortfolioConfig
): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    {
      url: buildCanonicalUrl(config, "/"),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];

  const publishedHighlights = getPublishedHighlights(config);
  for (const highlight of publishedHighlights) {
    entries.push({
      url: buildCanonicalUrl(config, `/highlights/${highlight.slug}`),
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  if (isSectionEnabled(config, "journal")) {
    const publishedArticles = getPublishedArticles(config);
    entries.push({
      url: buildCanonicalUrl(config, "/journal"),
      changeFrequency: "weekly",
      priority: 0.7,
    });
    for (const article of publishedArticles) {
      entries.push({
        url: buildCanonicalUrl(config, `/journal/${article.slug}`),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  return entries;
}

import { getPublicPortfolioConfig } from "@/server/services/public-content";


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const config = await getPublicPortfolioConfig();
    return buildSitemapEntries(config);
  } catch {
    const { config } = getPortfolioContent();
    return buildSitemapEntries(config);
  }
}
