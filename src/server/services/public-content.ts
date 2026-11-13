import { prisma } from "../prisma-client";
import type {
  PortfolioConfig,
  HighlightItem,
  ArticleItem,
  SectionConfig,
  StrengthGroup,
  SocialLink,
  QuickFact,
  ValueItem,
  JourneyItem,
  AchievementItem,
  TestimonialItem,
  ServiceItem,
  InterestItem,
  GalleryItem,
  AppearanceConfig,
  SectionId,
} from "@/types/portfolio";
import { SUPPORTED_SCHEMA_VERSION } from "@/lib/content/schema";

export async function getPublicPortfolioConfig(): Promise<PortfolioConfig> {
  const [
    site,
    profile,
    presentation,
    labels,
    contactSettings,
    sections,
    socialLinks,
    quickFacts,
    values,
    strengthGroups,
    highlights,
    journey,
    achievements,
    testimonials,
    services,
    articles,
    interests,
    gallery,
  ] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "singleton" } }),
    prisma.profile.findUnique({ where: { id: "singleton" } }),
    prisma.presentationSettings.findUnique({ where: { id: "singleton" } }),
    prisma.labelsSettings.findUnique({ where: { id: "singleton" } }),
    prisma.contactSettings.findUnique({ where: { id: "singleton" } }),
    prisma.section.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.socialLink.findMany({
      where: { enabled: true },
      orderBy: { displayOrder: "asc" },
    }),
    prisma.quickFact.findMany({
      where: { enabled: true },
      orderBy: { displayOrder: "asc" },
    }),
    prisma.valueItem.findMany({
      where: { enabled: true },
      orderBy: { displayOrder: "asc" },
    }),
    prisma.strengthGroup.findMany({
      where: { enabled: true },
      orderBy: { displayOrder: "asc" },
      include: {
        items: {
          where: { enabled: true },
          orderBy: { displayOrder: "asc" },
        },
      },
    }),
    prisma.highlight.findMany({
      where: { published: true, archivedAt: null },
      orderBy: { displayOrder: "asc" },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    }),
    prisma.journeyEntry.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.achievement.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.testimonial.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.service.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.article.findMany({
      where: { published: true, archivedAt: null },
      orderBy: { displayOrder: "asc" },
      include: {
        tags: { include: { tag: true } },
      },
    }),
    prisma.interest.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.galleryItem.findMany({ orderBy: { displayOrder: "asc" } }),
  ]);

  // Appearance published snapshot or fallback
  const appearanceSnapshot = (presentation?.publishedSnapshot as Partial<AppearanceConfig>) ?? {};
  const appearance: AppearanceConfig = {
    defaultPreset: (appearanceSnapshot.defaultPreset ?? presentation?.defaultPreset ?? "minimal") as any,
    defaultMode: (appearanceSnapshot.defaultMode ?? presentation?.defaultMode ?? "system") as any,
    fontPreset: (appearanceSnapshot.fontPreset ?? presentation?.fontPreset ?? "sans") as any,
    density: (appearanceSnapshot.density ?? presentation?.density ?? "comfortable") as any,
    radius: (appearanceSnapshot.radius ?? presentation?.radius ?? "subtle") as any,
  };

  // Published highlights projected from publishedSnapshot or frozen columns
  const publishedHighlights: HighlightItem[] = highlights.map((h) => {
    if (h.publishedSnapshot && typeof h.publishedSnapshot === "object") {
      const snap = h.publishedSnapshot as Record<string, any>;
      return {
        slug: snap.slug ?? h.slug,
        title: snap.title ?? h.title,
        summary: snap.summary ?? h.summary,
        category: snap.category ?? (h.category?.name ?? "General"),
        published: true,
        featured: snap.featured ?? h.featured,
        date: snap.date ?? (h.date ?? undefined),
        roleOrContribution: snap.roleOrContribution ?? h.roleOrContribution,
        context: snap.context ?? h.context,
        outcomes: (snap.outcomes as string[]) ?? ((h.outcomes as string[]) ?? []),
        tags: (snap.tags as string[]) ?? h.tags.map((t) => t.tag.name),
        coverImage: (snap.coverImage ?? h.coverImage) ? ((snap.coverImage ?? h.coverImage) as any) : undefined,
        gallery: (snap.gallery ?? h.gallery) ? ((snap.gallery ?? h.gallery) as any) : undefined,
        externalLinks: (snap.externalLinks ?? h.externalLinks) ? ((snap.externalLinks ?? h.externalLinks) as any) : undefined,
        relatedSlugs: (snap.relatedSlugs ?? h.relatedSlugs) ? ((snap.relatedSlugs ?? h.relatedSlugs) as string[]) : undefined,
        body: snap.body ?? (h.body as any),
      };
    }

    return {
      slug: h.slug,
      title: h.title,
      summary: h.summary,
      category: h.category?.name ?? "General",
      published: true,
      featured: h.featured,
      date: h.date ?? undefined,
      roleOrContribution: h.roleOrContribution,
      context: h.context,
      outcomes: (h.outcomes as string[]) ?? [],
      tags: h.tags.map((t) => t.tag.name),
      coverImage: (h.coverImage as any) ?? undefined,
      gallery: (h.gallery as any) ?? undefined,
      externalLinks: (h.externalLinks as any) ?? undefined,
      relatedSlugs: (h.relatedSlugs as string[]) ?? undefined,
      body: h.body as any,
    };
  });

  // Published articles projected from publishedSnapshot or columns
  const publishedArticles: ArticleItem[] = articles.map((a) => {
    if (a.publishedSnapshot && typeof a.publishedSnapshot === "object") {
      const snap = a.publishedSnapshot as Record<string, any>;
      return {
        slug: snap.slug ?? a.slug,
        title: snap.title ?? a.title,
        summary: snap.summary ?? a.summary,
        published: true,
        date: snap.date ?? a.date,
        readingTime: snap.readingTime ?? (a.readingTime ?? undefined),
        tags: (snap.tags as string[]) ?? a.tags.map((t) => t.tag.name),
        coverImage: (snap.coverImage ?? a.coverImage) ? ((snap.coverImage ?? a.coverImage) as any) : undefined,
        body: snap.body ?? (a.body as any),
      };
    }

    return {
      slug: a.slug,
      title: a.title,
      summary: a.summary,
      published: true,
      date: a.date,
      readingTime: a.readingTime ?? undefined,
      tags: a.tags.map((t) => t.tag.name),
      coverImage: (a.coverImage as any) ?? undefined,
      body: a.body as any,
    };
  });

  return {
    schemaVersion: SUPPORTED_SCHEMA_VERSION,
    site: {
      title: site?.title ?? "SareyBoth — SareyBothPortfolio",
      description: site?.description ?? "Personal portfolio for SareyBoth",
      siteUrl: site?.siteUrl ?? "https://sareybothportfolio.example.com",
      locale: site?.locale ?? "en-US",
      socialImage: (site?.socialImage as any) ?? undefined,
      indexable: site?.indexable ?? false,
    },
    profile: {
      name: profile?.name ?? "SareyBoth",
      descriptor: profile?.descriptor ?? "Community Program Coordinator",
      introduction: profile?.introduction ?? "I organize neighborhood learning initiatives...",
      biography: (profile?.biography as string[]) ?? [],
      values: values.map((v) => ({ title: v.title, description: v.description })),
      quickFacts: quickFacts.map((q) => ({ label: q.label, value: q.value })),
      portrait: (profile?.portrait as any) ?? undefined,
      location: profile?.location ?? undefined,
      availability: profile?.availability ?? undefined,
      resumeUrl: profile?.resumeUrl ?? undefined,
      contactEmail: profile?.contactEmail ?? "sareyboth@example.com",
      primaryCta: (profile?.primaryCta as any) ?? undefined,
      secondaryCta: (profile?.secondaryCta as any) ?? undefined,
      socialLinks: socialLinks.map((s) => ({
        platform: s.platform,
        label: s.label,
        url: s.url,
      })),
    },
    appearance,
    sections: sections.map((s) => ({
      id: s.id as SectionId,
      title: s.title,
      navLabel: s.navLabel ?? undefined,
      subtitle: s.subtitle ?? undefined,
      enabled: s.enabled,
      order: s.displayOrder,
    })),
    strengths: strengthGroups.map((g) => ({
      id: g.id,
      category: g.category,
      description: g.description ?? undefined,
      items: g.items.map((i) => i.name),
    })),
    highlights: publishedHighlights,
    journey: journey.map((j) => ({
      id: j.id,
      type: j.type as any,
      title: j.title,
      organization: j.organization ?? undefined,
      location: j.location ?? undefined,
      startDate: j.startDate,
      endDate: j.endDate ?? undefined,
      description: j.description,
      highlights: (j.highlights as string[]) ?? undefined,
    })),
    achievements: achievements.map((ac) => ({
      id: ac.id,
      title: ac.title,
      issuer: ac.issuer ?? undefined,
      date: ac.date ?? undefined,
      description: ac.description ?? undefined,
      image: (ac.image as any) ?? undefined,
      verificationUrl: ac.verificationUrl ?? undefined,
    })),
    testimonials: testimonials.map((t) => ({
      id: t.id,
      quote: t.quote,
      name: t.name,
      relationship: t.relationship,
      avatar: (t.avatar as any) ?? undefined,
      isSample: t.isSample,
    })),
    services: services.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      deliverables: (s.deliverables as string[]) ?? undefined,
      ctaLabel: s.ctaLabel ?? undefined,
    })),
    interests: interests.map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category ?? undefined,
      description: i.description,
    })),
    gallery: gallery.map((g) => ({
      id: g.id,
      title: g.title,
      caption: g.caption,
      date: g.date ?? undefined,
      image: g.image as any,
    })),
    articles: publishedArticles,
    labels: {
      exploreHighlightsCta: labels?.exploreHighlightsCta ?? "Explore My Highlights",
      contactCta: labels?.contactCta ?? "Contact Me",
      downloadResumeCta: labels?.downloadResumeCta ?? "Download Resume (PDF)",
      allCategoriesFilter: labels?.allCategoriesFilter ?? "All",
      emptyHighlightsText: labels?.emptyHighlightsText ?? "No highlights match this category yet.",
      emptyArticlesText: labels?.emptyArticlesText ?? "No journal entries are published right now.",
      openEmailAppButton: contactSettings?.openEmailAppButtonLabel ?? "Open email app",
      emailAppHelperText:
        contactSettings?.emailAppHelperText ??
        "Clicking 'Open email app' opens your default mail client with a pre-filled draft.",
      directEmailFallbackLabel: contactSettings?.directEmailFallbackLabel ?? "Prefer to write directly? Email",
      sampleTestimonialsNotice: labels?.sampleTestimonialsNotice ?? "Sample testimonials for template demonstration.",
    },
  };
}

export async function getPublicHighlightBySlug(slug: string): Promise<HighlightItem | null> {
  const highlight = await prisma.highlight.findFirst({
    where: { slug, published: true, archivedAt: null },
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
  });

  if (!highlight) return null;

  if (highlight.publishedSnapshot && typeof highlight.publishedSnapshot === "object") {
    const snap = highlight.publishedSnapshot as Record<string, any>;
    return {
      slug: snap.slug ?? highlight.slug,
      title: snap.title ?? highlight.title,
      summary: snap.summary ?? highlight.summary,
      category: snap.category ?? (highlight.category?.name ?? "General"),
      published: true,
      featured: snap.featured ?? highlight.featured,
      date: snap.date ?? (highlight.date ?? undefined),
      roleOrContribution: snap.roleOrContribution ?? highlight.roleOrContribution,
      context: snap.context ?? highlight.context,
      outcomes: (snap.outcomes as string[]) ?? ((highlight.outcomes as string[]) ?? []),
      tags: (snap.tags as string[]) ?? highlight.tags.map((t) => t.tag.name),
      coverImage: (snap.coverImage ?? highlight.coverImage) ? ((snap.coverImage ?? highlight.coverImage) as any) : undefined,
      gallery: (snap.gallery ?? highlight.gallery) ? ((snap.gallery ?? highlight.gallery) as any) : undefined,
      externalLinks: (snap.externalLinks ?? highlight.externalLinks) ? ((snap.externalLinks ?? highlight.externalLinks) as any) : undefined,
      relatedSlugs: (snap.relatedSlugs ?? highlight.relatedSlugs) ? ((snap.relatedSlugs ?? highlight.relatedSlugs) as string[]) : undefined,
      body: snap.body ?? (highlight.body as any),
    };
  }

  return {
    slug: highlight.slug,
    title: highlight.title,
    summary: highlight.summary,
    category: highlight.category?.name ?? "General",
    published: true,
    featured: highlight.featured,
    date: highlight.date ?? undefined,
    roleOrContribution: highlight.roleOrContribution,
    context: highlight.context,
    outcomes: (highlight.outcomes as string[]) ?? [],
    tags: highlight.tags.map((t) => t.tag.name),
    coverImage: (highlight.coverImage as any) ?? undefined,
    gallery: (highlight.gallery as any) ?? undefined,
    externalLinks: (highlight.externalLinks as any) ?? undefined,
    relatedSlugs: (highlight.relatedSlugs as string[]) ?? undefined,
    body: highlight.body as any,
  };
}

export async function getPublicArticleBySlug(slug: string): Promise<ArticleItem | null> {
  const article = await prisma.article.findFirst({
    where: { slug, published: true, archivedAt: null },
    include: {
      tags: { include: { tag: true } },
    },
  });

  if (!article) return null;

  if (article.publishedSnapshot && typeof article.publishedSnapshot === "object") {
    const snap = article.publishedSnapshot as Record<string, any>;
    return {
      slug: snap.slug ?? article.slug,
      title: snap.title ?? article.title,
      summary: snap.summary ?? article.summary,
      published: true,
      date: snap.date ?? article.date,
      readingTime: snap.readingTime ?? (article.readingTime ?? undefined),
      tags: (snap.tags as string[]) ?? article.tags.map((t) => t.tag.name),
      coverImage: (snap.coverImage ?? article.coverImage) ? ((snap.coverImage ?? article.coverImage) as any) : undefined,
      body: snap.body ?? (article.body as any),
    };
  }

  return {
    slug: article.slug,
    title: article.title,
    summary: article.summary,
    published: true,
    date: article.date,
    readingTime: article.readingTime ?? undefined,
    tags: article.tags.map((t) => t.tag.name),
    coverImage: (article.coverImage as any) ?? undefined,
    body: article.body as any,
  };
}

export async function getDraftPortfolioConfig(): Promise<PortfolioConfig> {
  const [
    site,
    profile,
    presentation,
    labels,
    contactSettings,
    sections,
    socialLinks,
    quickFacts,
    values,
    strengthGroups,
    highlights,
    journey,
    achievements,
    testimonials,
    services,
    articles,
    interests,
    gallery,
  ] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "singleton" } }),
    prisma.profile.findUnique({ where: { id: "singleton" } }),
    prisma.presentationSettings.findUnique({ where: { id: "singleton" } }),
    prisma.labelsSettings.findUnique({ where: { id: "singleton" } }),
    prisma.contactSettings.findUnique({ where: { id: "singleton" } }),
    prisma.section.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.socialLink.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.quickFact.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.valueItem.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.strengthGroup.findMany({
      orderBy: { displayOrder: "asc" },
      include: { items: { orderBy: { displayOrder: "asc" } } },
    }),
    prisma.highlight.findMany({
      where: { archivedAt: null },
      orderBy: { displayOrder: "asc" },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    }),
    prisma.journeyEntry.findMany({
      orderBy: { displayOrder: "asc" },
    }),
    prisma.achievement.findMany({
      orderBy: { displayOrder: "asc" },
    }),
    prisma.testimonial.findMany({
      orderBy: { displayOrder: "asc" },
    }),
    prisma.service.findMany({
      orderBy: { displayOrder: "asc" },
    }),
    prisma.article.findMany({
      where: { archivedAt: null },
      orderBy: { displayOrder: "asc" },
      include: {
        tags: { include: { tag: true } },
      },
    }),
    prisma.interest.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.galleryItem.findMany({ orderBy: { displayOrder: "asc" } }),
  ]);

  const appearance: AppearanceConfig = {
    defaultPreset: (presentation?.defaultPreset ?? "minimal") as any,
    defaultMode: (presentation?.defaultMode ?? "system") as any,
    fontPreset: (presentation?.fontPreset ?? "sans") as any,
    density: (presentation?.density ?? "comfortable") as any,
    radius: (presentation?.radius ?? "subtle") as any,
  };

  const draftHighlights: HighlightItem[] = highlights.map((h) => ({
    slug: h.slug,
    title: h.title,
    summary: h.summary,
    category: h.category?.name ?? "General",
    published: h.published,
    featured: h.featured,
    date: h.date ?? undefined,
    roleOrContribution: h.roleOrContribution,
    context: h.context,
    outcomes: (h.outcomes as string[]) ?? [],
    tags: h.tags.map((t) => t.tag.name),
    coverImage: (h.coverImage as any) ?? undefined,
    gallery: (h.gallery as any) ?? undefined,
    externalLinks: (h.externalLinks as any) ?? undefined,
    relatedSlugs: (h.relatedSlugs as string[]) ?? undefined,
    body: h.body as any,
  }));

  const draftArticles: ArticleItem[] = articles.map((a) => ({
    slug: a.slug,
    title: a.title,
    summary: a.summary,
    published: a.published,
    date: a.date,
    readingTime: a.readingTime ?? undefined,
    tags: a.tags.map((t) => t.tag.name),
    coverImage: (a.coverImage as any) ?? undefined,
    body: a.body as any,
  }));

  return {
    schemaVersion: SUPPORTED_SCHEMA_VERSION,
    site: {
      title: site?.title ?? "SareyBoth — SareyBothPortfolio",
      description: site?.description ?? "Personal portfolio for SareyBoth",
      siteUrl: site?.siteUrl ?? "https://sareybothportfolio.example.com",
      locale: site?.locale ?? "en-US",
      socialImage: (site?.socialImage as any) ?? undefined,
      indexable: site?.indexable ?? false,
    },
    profile: {
      name: profile?.name ?? "SareyBoth",
      descriptor: profile?.descriptor ?? "Community Program Coordinator",
      introduction: profile?.introduction ?? "I organize neighborhood learning initiatives...",
      biography: (profile?.biography as string[]) ?? [],
      values: values.map((v) => ({ title: v.title, description: v.description })),
      quickFacts: quickFacts.map((q) => ({ label: q.label, value: q.value })),
      portrait: (profile?.portrait as any) ?? undefined,
      location: profile?.location ?? undefined,
      availability: profile?.availability ?? undefined,
      resumeUrl: profile?.resumeUrl ?? undefined,
      contactEmail: profile?.contactEmail ?? "sareyboth@example.com",
      primaryCta: (profile?.primaryCta as any) ?? undefined,
      secondaryCta: (profile?.secondaryCta as any) ?? undefined,
      socialLinks: socialLinks.map((s) => ({
        platform: s.platform,
        label: s.label,
        url: s.url,
      })),
    },
    appearance,
    sections: sections.map((s) => ({
      id: s.id as SectionId,
      title: s.title,
      navLabel: s.navLabel ?? undefined,
      subtitle: s.subtitle ?? undefined,
      enabled: s.enabled,
      order: s.displayOrder,
    })),
    strengths: strengthGroups.map((g) => ({
      id: g.id,
      category: g.category,
      description: g.description ?? undefined,
      items: g.items.map((i) => i.name),
    })),
    highlights: draftHighlights,
    journey: journey.map((j) => ({
      id: j.id,
      type: j.type as any,
      title: j.title,
      organization: j.organization ?? undefined,
      location: j.location ?? undefined,
      startDate: j.startDate,
      endDate: j.endDate ?? undefined,
      description: j.description,
      highlights: (j.highlights as string[]) ?? undefined,
    })),
    achievements: achievements.map((ac) => ({
      id: ac.id,
      title: ac.title,
      issuer: ac.issuer ?? undefined,
      date: ac.date ?? undefined,
      description: ac.description ?? undefined,
      image: (ac.image as any) ?? undefined,
      verificationUrl: ac.verificationUrl ?? undefined,
    })),
    testimonials: testimonials.map((t) => ({
      id: t.id,
      quote: t.quote,
      name: t.name,
      relationship: t.relationship,
      avatar: (t.avatar as any) ?? undefined,
      isSample: t.isSample,
    })),
    services: services.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      deliverables: (s.deliverables as string[]) ?? undefined,
      ctaLabel: s.ctaLabel ?? undefined,
    })),
    interests: interests.map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category ?? undefined,
      description: i.description,
    })),
    gallery: gallery.map((g) => ({
      id: g.id,
      title: g.title,
      caption: g.caption,
      date: g.date ?? undefined,
      image: g.image as any,
    })),
    articles: draftArticles,
    labels: {
      exploreHighlightsCta: labels?.exploreHighlightsCta ?? "Explore My Highlights",
      contactCta: labels?.contactCta ?? "Contact Me",
      downloadResumeCta: labels?.downloadResumeCta ?? "Download Resume (PDF)",
      allCategoriesFilter: labels?.allCategoriesFilter ?? "All",
      emptyHighlightsText: labels?.emptyHighlightsText ?? "No highlights match this category yet.",
      emptyArticlesText: labels?.emptyArticlesText ?? "No journal entries are published right now.",
      openEmailAppButton: contactSettings?.openEmailAppButtonLabel ?? "Open email app",
      emailAppHelperText:
        contactSettings?.emailAppHelperText ??
        "Clicking 'Open email app' opens your default mail client with a pre-filled draft.",
      directEmailFallbackLabel: contactSettings?.directEmailFallbackLabel ?? "Prefer to write directly? Email",
      sampleTestimonialsNotice: labels?.sampleTestimonialsNotice ?? "Sample testimonials for template demonstration.",
    },
  };
}

export async function getDraftHighlightByIdOrSlug(idOrSlug: string): Promise<HighlightItem | null> {
  const highlight = await prisma.highlight.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      archivedAt: null,
    },
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
  });

  if (!highlight) return null;

  return {
    slug: highlight.slug,
    title: highlight.title,
    summary: highlight.summary,
    category: highlight.category?.name ?? "General",
    published: highlight.published,
    featured: highlight.featured,
    date: highlight.date ?? undefined,
    roleOrContribution: highlight.roleOrContribution,
    context: highlight.context,
    outcomes: (highlight.outcomes as string[]) ?? [],
    tags: highlight.tags.map((t) => t.tag.name),
    coverImage: (highlight.coverImage as any) ?? undefined,
    gallery: (highlight.gallery as any) ?? undefined,
    externalLinks: (highlight.externalLinks as any) ?? undefined,
    relatedSlugs: (highlight.relatedSlugs as string[]) ?? undefined,
    body: highlight.body as any,
  };
}

export async function getDraftArticleByIdOrSlug(idOrSlug: string): Promise<ArticleItem | null> {
  const article = await prisma.article.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      archivedAt: null,
    },
    include: {
      tags: { include: { tag: true } },
    },
  });

  if (!article) return null;

  return {
    slug: article.slug,
    title: article.title,
    summary: article.summary,
    published: article.published,
    date: article.date,
    readingTime: article.readingTime ?? undefined,
    tags: article.tags.map((t) => t.tag.name),
    coverImage: (article.coverImage as any) ?? undefined,
    body: article.body as any,
  };
}

