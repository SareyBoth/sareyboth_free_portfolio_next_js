import type { z } from "zod";
import type {
  achievementItemSchema,
  appearanceConfigSchema,
  articleItemSchema,
  COLOR_MODES,
  contentBlockSchema,
  ctaLinkSchema,
  DENSITY_PRESETS,
  externalLinkSchema,
  FONT_PRESETS,
  galleryItemSchema,
  highlightItemSchema,
  interestItemSchema,
  JOURNEY_TYPES,
  journeyItemSchema,
  labelsConfigSchema,
  mediaAssetSchema,
  portfolioConfigSchema,
  profileConfigSchema,
  quickFactSchema,
  RADIUS_PRESETS,
   SECTION_IDS,
  sectionConfigSchema,
  serviceItemSchema,
  siteConfigSchema,
  socialLinkSchema,
  strengthGroupSchema,
  testimonialItemSchema,
  valueItemSchema,
  VISUAL_PRESETS,
} from "@/lib/content/schema";

export type SectionId = (typeof SECTION_IDS)[number];
export type VisualPreset = (typeof VISUAL_PRESETS)[number];
export type ColorMode = (typeof COLOR_MODES)[number];
export type ResolvedColorMode = "light" | "dark";
export type FontPreset = (typeof FONT_PRESETS)[number];
export type DensityPreset = (typeof DENSITY_PRESETS)[number];
export type RadiusPreset = (typeof RADIUS_PRESETS)[number];
export type JourneyType = (typeof JOURNEY_TYPES)[number];

export type MediaAsset = z.infer<typeof mediaAssetSchema>;
export type ContentBlock = z.infer<typeof contentBlockSchema>;
export type CtaLink = z.infer<typeof ctaLinkSchema>;
export type SocialLink = z.infer<typeof socialLinkSchema>;
export type QuickFact = z.infer<typeof quickFactSchema>;
export type ValueItem = z.infer<typeof valueItemSchema>;
export type SiteConfig = z.infer<typeof siteConfigSchema>;
export type ProfileConfig = z.infer<typeof profileConfigSchema>;
export type AppearanceConfig = z.infer<typeof appearanceConfigSchema>;
export type SectionConfig = z.infer<typeof sectionConfigSchema>;
export type StrengthGroup = z.infer<typeof strengthGroupSchema>;
export type ExternalLink = z.infer<typeof externalLinkSchema>;
export type HighlightItem = z.infer<typeof highlightItemSchema>;
export type JourneyItem = z.infer<typeof journeyItemSchema>;
export type AchievementItem = z.infer<typeof achievementItemSchema>;
export type TestimonialItem = z.infer<typeof testimonialItemSchema>;
export type ServiceItem = z.infer<typeof serviceItemSchema>;
export type InterestItem = z.infer<typeof interestItemSchema>;
export type GalleryItem = z.infer<typeof galleryItemSchema>;
export type ArticleItem = z.infer<typeof articleItemSchema>;
export type LabelsConfig = z.infer<typeof labelsConfigSchema>;
export type PortfolioConfig = z.infer<typeof portfolioConfigSchema>;

export interface NavItem {
  id: SectionId;
  label: string;
  href: string;
}
