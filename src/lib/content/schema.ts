import { z } from "zod";
import { isValidPortfolioDate } from "./date";

export const SUPPORTED_SCHEMA_VERSION = 1 as const;

export const SECTION_IDS = [
  "home",
  "about",
  "strengths",
  "highlights",
  "journey",
  "achievements",
  "testimonials",
  "services",
  "journal",
  "interests",
  "gallery",
  "resume",
  "contact",
] as const;

export const VISUAL_PRESETS = ["minimal", "warm", "modern"] as const;
export const COLOR_MODES = ["light", "dark", "system"] as const;
export const FONT_PRESETS = ["sans", "serif"] as const;
export const DENSITY_PRESETS = ["compact", "comfortable", "spacious"] as const;
export const RADIUS_PRESETS = ["sharp", "subtle", "rounded"] as const;
export const JOURNEY_TYPES = [
  "education",
  "employment",
  "volunteering",
  "course",
  "milestone",
] as const;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isSafeHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isSafeLocalPath(value: string): boolean {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return false;
  }
  if (value.includes("..") || value.includes("\\")) {
    return false;
  }
  return true;
}

export function isSafeActionHref(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "#") {
    return false;
  }
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:")
  ) {
    return false;
  }
  if (/^#[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return true;
  }
  if (isSafeLocalPath(trimmed)) {
    return true;
  }
  if (lower.startsWith("mailto:")) {
    const emailPart = trimmed.slice(7).split("?")[0];
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailPart);
  }
  return isSafeHttpUrl(trimmed);
}

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug cannot be empty.")
  .max(80, "Slug must be 80 characters or fewer.")
  .regex(
    SLUG_RE,
    "Slug must use lowercase letters, numbers, and single hyphens only."
  )
  .refine((val) => val !== "__placeholder__", {
    message: "Slug '__placeholder__' is reserved.",
  });

export const httpUrlSchema = z
  .string()
  .trim()
  .min(1, "URL is required.")
  .max(500, "URL must be 500 characters or fewer.")
  .refine(isSafeHttpUrl, {
    message: "Must be a valid http:// or https:// URL.",
  });

export const mediaPathSchema = z
  .string()
  .trim()
  .min(1, "Media path is required.")
  .max(500, "Media path must be 500 characters or fewer.")
  .refine((val) => isSafeLocalPath(val) || isSafeHttpUrl(val), {
    message:
      "Media path must be a safe local path starting with '/' or an http(s) URL.",
  });

export const actionHrefSchema = z
  .string()
  .trim()
  .min(1, "Link href is required.")
  .max(500, "Link href must be 500 characters or fewer.")
  .refine(isSafeActionHref, {
    message:
      "Link href must be a valid section anchor (#section), local route (/path), mailto:, or http(s) URL. Placeholder '#' and javascript: URLs are not allowed.",
  });

export const dateStringSchema = z
  .string()
  .trim()
  .refine((val) => isValidPortfolioDate(val, false), {
    message: "Date must be in YYYY, YYYY-MM, or YYYY-MM-DD format.",
  });

export const endDateStringSchema = z
  .string()
  .trim()
  .refine((val) => isValidPortfolioDate(val, true), {
    message:
      "End date must be 'Present' or in YYYY, YYYY-MM, or YYYY-MM-DD format.",
  });

export const mediaAssetSchema = z
  .object({
    src: mediaPathSchema,
    alt: z
      .string()
      .trim()
      .min(1, "Media alt text is required for accessibility.")
      .max(240, "Media alt text must be 240 characters or fewer."),
    width: z.number().int().positive().max(8000).optional(),
    height: z.number().int().positive().max(8000).optional(),
    caption: z.string().trim().max(300).optional(),
  })
  .strict();

export const contentBlockSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("paragraph"),
      text: z
        .string()
        .trim()
        .min(1, "Paragraph text cannot be empty.")
        .max(2500, "Paragraph text must be 2500 characters or fewer."),
    })
    .strict(),
  z
    .object({
      type: z.literal("heading"),
      level: z.union([z.literal(2), z.literal(3)]),
      text: z
        .string()
        .trim()
        .min(1, "Heading text cannot be empty.")
        .max(200, "Heading text must be 200 characters or fewer."),
    })
    .strict(),
  z
    .object({
      type: z.literal("list"),
      style: z.enum(["unordered", "ordered"]),
      items: z
        .array(
          z
            .string()
            .trim()
            .min(1, "List item cannot be empty.")
            .max(500, "List item must be 500 characters or fewer.")
        )
        .min(1, "List block must contain at least one item.")
        .max(30),
    })
    .strict(),
  z
    .object({
      type: z.literal("image"),
      src: mediaPathSchema,
      alt: z
        .string()
        .trim()
        .min(1, "Image block alt text is required.")
        .max(240),
      caption: z.string().trim().max(300).optional(),
      width: z.number().int().positive().max(8000).optional(),
      height: z.number().int().positive().max(8000).optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("quote"),
      text: z
        .string()
        .trim()
        .min(1, "Quote text cannot be empty.")
        .max(1000, "Quote text must be 1000 characters or fewer."),
      attribution: z.string().trim().max(160).optional(),
    })
    .strict(),
]);

export const ctaLinkSchema = z
  .object({
    label: z.string().trim().min(1, "CTA label is required.").max(60),
    href: actionHrefSchema,
  })
  .strict();

export const socialLinkSchema = z
  .object({
    platform: z.string().trim().min(1, "Social platform is required.").max(50),
    label: z.string().trim().min(1, "Social link label is required.").max(80),
    url: z
      .string()
      .trim()
      .max(500)
      .refine((val) => val === "" || isSafeHttpUrl(val), {
        message: "Social link URL must be empty or a valid http(s) URL.",
      }),
  })
  .strict();

export const quickFactSchema = z
  .object({
    label: z.string().trim().min(1).max(80),
    value: z.string().trim().min(1).max(160),
  })
  .strict();

export const valueItemSchema = z
  .object({
    title: z.string().trim().min(1).max(100),
    description: z.string().trim().min(1).max(360),
  })
  .strict();

export const siteConfigSchema = z
  .object({
    title: z.string().trim().min(1, "Site title is required.").max(120),
    description: z
      .string()
      .trim()
      .min(1, "Site description is required.")
      .max(300),
    siteUrl: httpUrlSchema,
    locale: z.string().trim().min(2).max(20),
    socialImage: mediaAssetSchema.optional(),
    indexable: z.boolean().optional(),
  })
  .strict();

export const profileConfigSchema = z
  .object({
    name: z.string().trim().min(1, "Profile name is required.").max(100),
    descriptor: z
      .string()
      .trim()
      .min(1, "Profile descriptor is required.")
      .max(180),
    introduction: z
      .string()
      .trim()
      .min(1, "Profile introduction is required.")
      .max(700),
    biography: z
      .array(z.string().trim().min(1).max(1200))
      .min(1, "At least one biography paragraph is required.")
      .max(10),
    values: z.array(valueItemSchema).max(8).optional(),
    quickFacts: z.array(quickFactSchema).max(10).optional(),
    portrait: mediaAssetSchema.optional(),
    location: z.string().trim().max(120).optional(),
    availability: z.string().trim().max(160).optional(),
    resumeUrl: z
      .string()
      .trim()
      .max(500)
      .refine(
        (val) => val === "" || isSafeLocalPath(val) || isSafeHttpUrl(val),
        {
          message:
            "resumeUrl must be empty, a safe local path starting with '/', or an http(s) URL.",
        }
      )
      .optional(),
    contactEmail: z
      .string()
      .trim()
      .email("A valid contactEmail is required.")
      .max(160),
    primaryCta: ctaLinkSchema.optional(),
    secondaryCta: ctaLinkSchema.optional(),
    socialLinks: z.array(socialLinkSchema).max(12),
  })
  .strict();

export const appearanceConfigSchema = z
  .object({
    defaultPreset: z.enum(VISUAL_PRESETS),
    defaultMode: z.enum(COLOR_MODES),
    fontPreset: z.enum(FONT_PRESETS),
    density: z.enum(DENSITY_PRESETS),
    radius: z.enum(RADIUS_PRESETS),
  })
  .strict();

export const sectionConfigSchema = z
  .object({
    id: z.enum(SECTION_IDS),
    title: z.string().trim().min(1, "Section title is required.").max(90),
    navLabel: z.string().trim().min(1).max(40).optional(),
    subtitle: z.string().trim().max(240).optional(),
    enabled: z.boolean(),
    order: z.number().int().min(0).max(1000),
  })
  .strict();

export const strengthGroupSchema = z
  .object({
    id: slugSchema,
    category: z.string().trim().min(1).max(80),
    description: z.string().trim().max(240).optional(),
    items: z.array(z.string().trim().min(1).max(80)).max(25),
  })
  .strict();

export const externalLinkSchema = z
  .object({
    label: z.string().trim().min(1).max(80),
    url: httpUrlSchema,
  })
  .strict();

export const highlightItemSchema = z
  .object({
    slug: slugSchema,
    title: z.string().trim().min(1).max(140),
    summary: z.string().trim().min(1).max(360),
    category: z.string().trim().min(1).max(60),
    published: z.boolean(),
    featured: z.boolean().optional(),
    date: dateStringSchema.optional(),
    roleOrContribution: z.string().trim().min(1).max(200),
    context: z.string().trim().min(1).max(600),
    outcomes: z.array(z.string().trim().min(1).max(280)).max(10),
    tags: z.array(z.string().trim().min(1).max(50)).max(15),
    coverImage: mediaAssetSchema.optional(),
    gallery: z.array(mediaAssetSchema).max(12).optional(),
    externalLinks: z.array(externalLinkSchema).max(6).optional(),
    relatedSlugs: z.array(slugSchema).max(6).optional(),
    body: z
      .array(contentBlockSchema)
      .min(1, "Highlight body must contain at least one content block."),
  })
  .strict();

export const journeyItemSchema = z
  .object({
    id: slugSchema,
    type: z.enum(JOURNEY_TYPES),
    title: z.string().trim().min(1).max(140),
    organization: z.string().trim().max(140).optional(),
    location: z.string().trim().max(120).optional(),
    startDate: dateStringSchema,
    endDate: endDateStringSchema.optional(),
    description: z.string().trim().min(1).max(600),
    highlights: z.array(z.string().trim().min(1).max(240)).max(8).optional(),
  })
  .strict();

export const achievementItemSchema = z
  .object({
    id: slugSchema,
    title: z.string().trim().min(1).max(140),
    issuer: z.string().trim().max(140).optional(),
    date: dateStringSchema.optional(),
    description: z.string().trim().max(400).optional(),
    image: mediaAssetSchema.optional(),
    verificationUrl: httpUrlSchema.optional(),
  })
  .strict();

export const testimonialItemSchema = z
  .object({
    id: slugSchema,
    quote: z.string().trim().min(1).max(600),
    name: z.string().trim().min(1).max(100),
    relationship: z.string().trim().min(1).max(140),
    avatar: mediaAssetSchema.optional(),
    isSample: z.boolean().optional(),
  })
  .strict();

export const serviceItemSchema = z
  .object({
    id: slugSchema,
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().min(1).max(400),
    deliverables: z.array(z.string().trim().min(1).max(160)).max(8).optional(),
    ctaLabel: z.string().trim().min(1).max(60).optional(),
  })
  .strict();

export const interestItemSchema = z
  .object({
    id: slugSchema,
    name: z.string().trim().min(1).max(80),
    category: z.string().trim().max(60).optional(),
    description: z.string().trim().min(1).max(280),
  })
  .strict();

export const galleryItemSchema = z
  .object({
    id: slugSchema,
    title: z.string().trim().min(1).max(120),
    caption: z.string().trim().min(1).max(300),
    date: dateStringSchema.optional(),
    image: mediaAssetSchema,
  })
  .strict();

export const articleItemSchema = z
  .object({
    slug: slugSchema,
    title: z.string().trim().min(1).max(160),
    summary: z.string().trim().min(1).max(360),
    published: z.boolean(),
    date: dateStringSchema,
    readingTime: z.string().trim().max(40).optional(),
    tags: z.array(z.string().trim().min(1).max(50)).max(12),
    coverImage: mediaAssetSchema.optional(),
    body: z
      .array(contentBlockSchema)
      .min(1, "Article body must contain at least one content block."),
  })
  .strict();

export const labelsConfigSchema = z
  .object({
    exploreHighlightsCta: z.string().trim().min(1).max(60),
    contactCta: z.string().trim().min(1).max(60),
    downloadResumeCta: z.string().trim().min(1).max(60),
    allCategoriesFilter: z.string().trim().min(1).max(40),
    emptyHighlightsText: z.string().trim().min(1).max(200),
    emptyArticlesText: z.string().trim().min(1).max(200),
    openEmailAppButton: z.string().trim().min(1).max(60),
    emailAppHelperText: z.string().trim().min(1).max(300),
    directEmailFallbackLabel: z.string().trim().min(1).max(80),
    sampleTestimonialsNotice: z.string().trim().min(1).max(240),
  })
  .strict();

export const portfolioConfigSchema = z
  .object({
    schemaVersion: z.literal(SUPPORTED_SCHEMA_VERSION),
    site: siteConfigSchema,
    profile: profileConfigSchema,
    appearance: appearanceConfigSchema,
    sections: z
      .array(sectionConfigSchema)
      .min(1, "At least one section must be configured."),
    strengths: z.array(strengthGroupSchema),
    highlights: z.array(highlightItemSchema),
    journey: z.array(journeyItemSchema),
    achievements: z.array(achievementItemSchema),
    testimonials: z.array(testimonialItemSchema),
    services: z.array(serviceItemSchema),
    interests: z.array(interestItemSchema),
    gallery: z.array(galleryItemSchema),
    articles: z.array(articleItemSchema),
    labels: labelsConfigSchema,
  })
  .strict()
  .superRefine((data, ctx) => {
    const seenSections = new Set<string>();
    data.sections.forEach((sec, index) => {
      if (seenSections.has(sec.id)) {
        ctx.addIssue({
          code: "custom",
          path: ["sections", index, "id"],
          message: `Duplicate section ID '${sec.id}'. Each section ID must be unique.`,
        });
      }
      seenSections.add(sec.id);
    });

    const checkUniqueKey = <T extends Record<string, unknown>>(
      items: T[],
      collectionName: string,
      keyField: keyof T & string
    ) => {
      const seen = new Set<string>();
      items.forEach((item, index) => {
        const keyVal = String(item[keyField] ?? "");
        if (seen.has(keyVal)) {
          ctx.addIssue({
            code: "custom",
            path: [collectionName, index, keyField],
            message: `Duplicate ${keyField} '${keyVal}' in ${collectionName}. Values must be unique.`,
          });
        }
        seen.add(keyVal);
      });
    };

    checkUniqueKey(data.highlights, "highlights", "slug");
    checkUniqueKey(data.articles, "articles", "slug");
    checkUniqueKey(data.strengths, "strengths", "id");
    checkUniqueKey(data.journey, "journey", "id");
    checkUniqueKey(data.achievements, "achievements", "id");
    checkUniqueKey(data.testimonials, "testimonials", "id");
    checkUniqueKey(data.services, "services", "id");
    checkUniqueKey(data.interests, "interests", "id");
    checkUniqueKey(data.gallery, "gallery", "id");
  });

export interface ValidationIssue {
  path: string;
  message: string;
}

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; issues: ValidationIssue[] };

export function validatePortfolioConfig(
  input: unknown
): ValidationResult<z.infer<typeof portfolioConfigSchema>> {
  const result = portfolioConfigSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const issues: ValidationIssue[] = result.error.issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join(".") : "(root)",
    message: issue.message,
  }));
  return { success: false, issues };
}
