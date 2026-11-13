import type {
  ArticleItem,
  HighlightItem,
  JourneyItem,
  NavItem,
  PortfolioConfig,
  SectionConfig,
  SectionId,
  SocialLink,
  StrengthGroup,
} from "@/types/portfolio";
import { parsePortfolioDate } from "./date";
import { isSafeHttpUrl, SECTION_IDS } from "./schema";

export const SAMPLE_ORIGINS = new Set([
  "https://example.com",
  "https://www.example.com",
  "https://openfolio.example.com",
  "https://sareybothportfolio.example.com",
  "http://localhost:3000",
]);

export function getNormalizedOrigin(siteUrl: string): string {
  try {
    const parsed = new URL(siteUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "https://example.com";
    }
    return parsed.origin;
  } catch {
    return "https://example.com";
  }
}

export function buildCanonicalUrl(
  config: PortfolioConfig,
  pathname = "/"
): string {
  const origin = getNormalizedOrigin(config.site.siteUrl);
  const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (cleanPath === "/") {
    return origin;
  }
  return `${origin}${cleanPath}`;
}

export function isSiteIndexable(config: PortfolioConfig): boolean {
  const origin = getNormalizedOrigin(config.site.siteUrl);
  if (SAMPLE_ORIGINS.has(origin.toLowerCase())) {
    return false;
  }
  return config.site.indexable === true;
}

export function getNonEmptyStrengthGroups(
  config: PortfolioConfig
): StrengthGroup[] {
  return config.strengths
    .map((group) => ({
      ...group,
      items: group.items.map((item) => item.trim()).filter(Boolean),
    }))
    .filter((group) => group.items.length > 0);
}

export function getConfiguredSocialLinks(
  config: PortfolioConfig
): SocialLink[] {
  return config.profile.socialLinks.filter(
    (link) => link.url.trim().length > 0 && isSafeHttpUrl(link.url.trim())
  );
}

export function hasConfiguredResume(
  config: PortfolioConfig,
  resumeAssetExists = true
): boolean {
  const url = config.profile.resumeUrl?.trim();
  if (!url) return false;
  return resumeAssetExists;
}

export function isSectionEnabled(
  config: PortfolioConfig,
  sectionId: SectionId
): boolean {
  const section = config.sections.find((sec) => sec.id === sectionId);
  return Boolean(section && section.enabled);
}

function getRawPublishedHighlights(config: PortfolioConfig): HighlightItem[] {
  return config.highlights.filter((item) => item.published);
}

function getRawPublishedArticles(config: PortfolioConfig): ArticleItem[] {
  return [...config.articles]
    .filter((item) => item.published)
    .sort((a, b) => {
      const dateA = parsePortfolioDate(a.date)?.sortKey ?? 0;
      const dateB = parsePortfolioDate(b.date)?.sortKey ?? 0;
      if (dateA !== dateB) return dateB - dateA;
      return a.slug.localeCompare(b.slug);
    });
}

export function sectionHasContent(
  config: PortfolioConfig,
  sectionId: SectionId,
  options?: { resumeAssetExists?: boolean }
): boolean {
  const resumeExists = options?.resumeAssetExists ?? true;
  switch (sectionId) {
    case "home":
      return Boolean(
        config.profile.name.trim() && config.profile.introduction.trim()
      );
    case "about":
      return config.profile.biography.some((p) => p.trim().length > 0);
    case "strengths":
      return getNonEmptyStrengthGroups(config).length > 0;
    case "highlights":
      return getRawPublishedHighlights(config).length > 0;
    case "journey":
      return config.journey.length > 0;
    case "achievements":
      return config.achievements.length > 0;
    case "testimonials":
      return config.testimonials.length > 0;
    case "services":
      return config.services.length > 0;
    case "journal":
      return getRawPublishedArticles(config).length > 0;
    case "interests":
      return config.interests.length > 0;
    case "gallery":
      return config.gallery.length > 0;
    case "resume":
      return hasConfiguredResume(config, resumeExists);
    case "contact":
      return Boolean(config.profile.contactEmail.trim());
    default:
      return false;
  }
}

export function sortSectionsDeterministically(
  sections: SectionConfig[]
): SectionConfig[] {
  return [...sections].sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    return SECTION_IDS.indexOf(a.id) - SECTION_IDS.indexOf(b.id);
  });
}

export function getRenderedSections(
  config: PortfolioConfig,
  options?: { resumeAssetExists?: boolean }
): SectionConfig[] {
  const sorted = sortSectionsDeterministically(config.sections);
  return sorted.filter(
    (section) =>
      section.enabled && sectionHasContent(config, section.id, options)
  );
}

export function buildNavigation(
  config: PortfolioConfig,
  options?: { isSubpage?: boolean; resumeAssetExists?: boolean }
): NavItem[] {
  const isSubpage = options?.isSubpage ?? false;
  const renderedSections = getRenderedSections(config, {
    resumeAssetExists: options?.resumeAssetExists,
  });

  return renderedSections.map((sec) => {
    const label = sec.navLabel?.trim() || sec.title.trim();
    const anchor = `#${sec.id}`;
    const href = isSubpage ? `/${anchor}` : anchor;
    return {
      id: sec.id,
      label,
      href,
    };
  });
}

export function getPublishedHighlights(
  config: PortfolioConfig
): HighlightItem[] {
  if (!isSectionEnabled(config, "highlights")) {
    return [];
  }
  return getRawPublishedHighlights(config);
}

export function getPublishedHighlightBySlug(
  config: PortfolioConfig,
  slug: string
): HighlightItem | null {
  const published = getPublishedHighlights(config);
  return published.find((item) => item.slug === slug) ?? null;
}

export function getHighlightCategories(config: PortfolioConfig): string[] {
  const published = getPublishedHighlights(config);
  const categories = new Set<string>();
  for (const item of published) {
    const cat = item.category.trim();
    if (cat) {
      categories.add(cat);
    }
  }
  return Array.from(categories);
}

export function getRelatedHighlights(
  config: PortfolioConfig,
  currentHighlight: HighlightItem,
  limit = 2
): HighlightItem[] {
  const published = getPublishedHighlights(config).filter(
    (item) => item.slug !== currentHighlight.slug
  );
  if (published.length === 0) return [];

  const explicitSlugs = new Set(currentHighlight.relatedSlugs ?? []);
  const explicitMatches = published.filter((item) =>
    explicitSlugs.has(item.slug)
  );
  const categoryMatches = published.filter(
    (item) =>
      !explicitSlugs.has(item.slug) &&
      item.category === currentHighlight.category
  );
  const remaining = published.filter(
    (item) =>
      !explicitSlugs.has(item.slug) &&
      item.category !== currentHighlight.category
  );

  return [...explicitMatches, ...categoryMatches, ...remaining].slice(0, limit);
}

export function getPublishedArticles(config: PortfolioConfig): ArticleItem[] {
  if (!isSectionEnabled(config, "journal")) {
    return [];
  }
  return getRawPublishedArticles(config);
}

export function getPublishedArticleBySlug(
  config: PortfolioConfig,
  slug: string
): ArticleItem | null {
  const published = getPublishedArticles(config);
  return published.find((item) => item.slug === slug) ?? null;
}

export function getSortedJourneyItems(config: PortfolioConfig): JourneyItem[] {
  return [...config.journey].sort((a, b) => {
    const endA = parsePortfolioDate(a.endDate ?? a.startDate)?.sortKey ?? 0;
    const endB = parsePortfolioDate(b.endDate ?? b.startDate)?.sortKey ?? 0;
    if (endA !== endB) return endB - endA;
    const startA = parsePortfolioDate(a.startDate)?.sortKey ?? 0;
    const startB = parsePortfolioDate(b.startDate)?.sortKey ?? 0;
    return startB - startA;
  });
}

export function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "OF";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function renameSectionInConfig(
  config: PortfolioConfig,
  sectionId: SectionId,
  newTitle: string
): PortfolioConfig {
  return {
    ...config,
    sections: config.sections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            title: newTitle,
            navLabel: newTitle.trim() ? newTitle.trim() : section.navLabel,
          }
        : section
    ),
  };
}

export function reorderSectionInConfig(
  config: PortfolioConfig,
  sectionId: SectionId,
  direction: "up" | "down"
): PortfolioConfig {
  const sorted = sortSectionsDeterministically(config.sections);
  const currentIndex = sorted.findIndex((sec) => sec.id === sectionId);
  if (currentIndex === -1) return config;

  const targetIndex =
    direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= sorted.length) {
    return config;
  }

  const reordered = [...sorted];
  const [moved] = reordered.splice(currentIndex, 1);
  reordered.splice(targetIndex, 0, moved);

  const normalized = reordered.map((sec, idx) => ({
    ...sec,
    order: (idx + 1) * 10,
  }));

  return {
    ...config,
    sections: normalized,
  };
}
