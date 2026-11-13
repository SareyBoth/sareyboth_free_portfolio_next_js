import type { MetadataRoute } from "next";
import { getPortfolioContent } from "@/lib/content/load";
import { getPublicPortfolioConfig } from "@/server/services/public-content";
import {
  buildCanonicalUrl,
  isSiteIndexable,
} from "@/lib/content/selectors";


export default async function robots(): Promise<MetadataRoute.Robots> {
  let config;
  try {
    config = await getPublicPortfolioConfig();
  } catch {
    config = getPortfolioContent().config;
  }

  const indexable = isSiteIndexable(config);

  if (!indexable) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/customize",
        "/dashboard",
        "/dashboard/",
        "/preview",
        "/preview/",
        "/login",
        "/forgot-password",
        "/reset-password",
        "/api/",
      ],
    },
    sitemap: buildCanonicalUrl(config, "/sitemap.xml"),
  };
}
