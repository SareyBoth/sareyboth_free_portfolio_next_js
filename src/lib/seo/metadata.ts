import type { Metadata } from "next";
import type { PortfolioConfig } from "@/types/portfolio";
import {
  buildCanonicalUrl,
  getConfiguredSocialLinks,
  getNormalizedOrigin,
  isSiteIndexable,
} from "@/lib/content/selectors";

export function buildPageMetadata(
  config: PortfolioConfig,
  options: {
    title?: string;
    description?: string;
    pathname: string;
    forceNoIndex?: boolean;
    ogType?: "website" | "article";
  }
): Metadata {
  const origin = getNormalizedOrigin(config.site.siteUrl);
  const canonical = buildCanonicalUrl(config, options.pathname);
  const pageTitle = options.title
    ? `${options.title} | ${config.profile.name}`
    : config.site.title;
  const pageDescription = options.description ?? config.site.description;
  const allowIndex =
    options.forceNoIndex === true ? false : isSiteIndexable(config);

  const socialImg = config.site.socialImage;
  const images = socialImg
    ? [
        {
          url: socialImg.src.startsWith("/")
            ? `${origin}${socialImg.src}`
            : socialImg.src,
          alt: socialImg.alt,
          width: socialImg.width ?? 1200,
          height: socialImg.height ?? 630,
        },
      ]
    : undefined;

  return {
    metadataBase: new URL(origin),
    title: pageTitle,
    description: pageDescription,
    alternates: {
      canonical,
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: canonical,
      siteName: config.site.title,
      locale: config.site.locale,
      type: options.ogType ?? "website",
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: pageTitle,
      description: pageDescription,
      images: images?.map((img) => img.url),
    },
    robots: {
      index: allowIndex,
      follow: allowIndex,
    },
  };
}

export function buildPersonJsonLd(
  config: PortfolioConfig
): Record<string, unknown> {
  const origin = getNormalizedOrigin(config.site.siteUrl);
  const socialUrls = getConfiguredSocialLinks(config).map((s) => s.url);

  const person: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: config.profile.name,
    description: config.profile.descriptor,
    url: origin,
  };

  if (config.profile.location?.trim()) {
    person.homeLocation = {
      "@type": "Place",
      name: config.profile.location.trim(),
    };
  }

  if (config.profile.portrait?.src) {
    person.image = config.profile.portrait.src.startsWith("/")
      ? `${origin}${config.profile.portrait.src}`
      : config.profile.portrait.src;
  }

  if (socialUrls.length > 0) {
    person.sameAs = socialUrls;
  }

  return person;
}
