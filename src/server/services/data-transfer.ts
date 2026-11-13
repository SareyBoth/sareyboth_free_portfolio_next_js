import { prisma } from "../prisma-client";
import { validatePortfolioConfig } from "@/lib/content/schema";
import { getDraftPortfolioConfig } from "./public-content";
import type { PortfolioConfig } from "@/types/portfolio";
import { logAuditEvent } from "../audit";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function exportPortfolioData(): Promise<PortfolioConfig> {
  return await getDraftPortfolioConfig();
}

export function validateImportData(raw: unknown): {
  valid: boolean;
  data?: PortfolioConfig;
  summary?: Record<string, number>;
  error?: string;
} {
  const result = validatePortfolioConfig(raw);
  if (!result.success) {
    const details = result.issues.map((i) => `[${i.path}]: ${i.message}`).join("; ");
    return { valid: false, error: details };
  }

  const config = result.data;
  return {
    valid: true,
    data: config,
    summary: {
      sections: config.sections.length,
      socialLinks: config.profile.socialLinks?.length ?? 0,
      quickFacts: config.profile.quickFacts?.length ?? 0,
      values: config.profile.values?.length ?? 0,
      strengths: config.strengths.reduce((acc, g) => acc + g.items.length, 0),
      highlights: config.highlights.length,
      journey: config.journey.length,
      achievements: config.achievements.length,
      testimonials: config.testimonials.length,
      services: config.services.length,
      articles: config.articles.length,
      interests: config.interests.length,
      gallery: config.gallery.length,
    },
  };
}

export async function executeImportData(
  config: PortfolioConfig,
  actorId?: string,
  actorEmail?: string
): Promise<{ counts: Record<string, number> }> {
  const counts: Record<string, number> = {};

  await prisma.$transaction(async (tx) => {
    // 1. SiteSettings
    await tx.siteSettings.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        title: config.site.title,
        description: config.site.description,
        siteUrl: config.site.siteUrl,
        locale: config.site.locale,
        indexable: config.site.indexable ?? false,
        socialImage: config.site.socialImage ? JSON.parse(JSON.stringify(config.site.socialImage)) : undefined,
        version: 1,
      },
      update: {
        title: config.site.title,
        description: config.site.description,
        siteUrl: config.site.siteUrl,
        locale: config.site.locale,
        indexable: config.site.indexable ?? false,
        socialImage: config.site.socialImage ? JSON.parse(JSON.stringify(config.site.socialImage)) : undefined,
        version: { increment: 1 },
      },
    });
    counts.siteSettings = 1;

    // 2. Profile
    await tx.profile.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        name: config.profile.name,
        descriptor: config.profile.descriptor,
        introduction: config.profile.introduction,
        biography: config.profile.biography,
        location: config.profile.location ?? null,
        availability: config.profile.availability ?? null,
        resumeUrl: config.profile.resumeUrl ?? null,
        contactEmail: config.profile.contactEmail,
        portrait: config.profile.portrait ? JSON.parse(JSON.stringify(config.profile.portrait)) : undefined,
        primaryCta: config.profile.primaryCta ? JSON.parse(JSON.stringify(config.profile.primaryCta)) : undefined,
        secondaryCta: config.profile.secondaryCta ? JSON.parse(JSON.stringify(config.profile.secondaryCta)) : undefined,
        version: 1,
      },
      update: {
        name: config.profile.name,
        descriptor: config.profile.descriptor,
        introduction: config.profile.introduction,
        biography: config.profile.biography,
        location: config.profile.location ?? null,
        availability: config.profile.availability ?? null,
        resumeUrl: config.profile.resumeUrl ?? null,
        contactEmail: config.profile.contactEmail,
        portrait: config.profile.portrait ? JSON.parse(JSON.stringify(config.profile.portrait)) : undefined,
        primaryCta: config.profile.primaryCta ? JSON.parse(JSON.stringify(config.profile.primaryCta)) : undefined,
        secondaryCta: config.profile.secondaryCta ? JSON.parse(JSON.stringify(config.profile.secondaryCta)) : undefined,
        version: { increment: 1 },
      },
    });
    counts.profile = 1;

    // 3. PresentationSettings
    const appearanceSnapshot = {
      defaultPreset: config.appearance.defaultPreset,
      defaultMode: config.appearance.defaultMode,
      fontPreset: config.appearance.fontPreset,
      density: config.appearance.density,
      radius: config.appearance.radius,
    };
    await tx.presentationSettings.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        ...appearanceSnapshot,
        publishedSnapshot: appearanceSnapshot,
        publishedAt: new Date(),
        version: 1,
      },
      update: {
        ...appearanceSnapshot,
        publishedSnapshot: appearanceSnapshot,
        publishedAt: new Date(),
        version: { increment: 1 },
      },
    });
    counts.presentationSettings = 1;

    // 4. ContactSettings
    await tx.contactSettings.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        recipientEmail: config.profile.contactEmail,
        mode: "form",
        openEmailAppButtonLabel: config.labels.openEmailAppButton ?? "Open email app",
        emailAppHelperText: config.labels.emailAppHelperText,
        directEmailFallbackLabel: config.labels.directEmailFallbackLabel ?? "Prefer to write directly? Email",
        version: 1,
      },
      update: {
        recipientEmail: config.profile.contactEmail,
        openEmailAppButtonLabel: config.labels.openEmailAppButton ?? "Open email app",
        emailAppHelperText: config.labels.emailAppHelperText,
        directEmailFallbackLabel: config.labels.directEmailFallbackLabel ?? "Prefer to write directly? Email",
        version: { increment: 1 },
      },
    });
    counts.contactSettings = 1;

    // 5. FooterSettings
    await tx.footerSettings.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        showSectionsNav: true,
        showSocialLinks: true,
        copyrightNotice: `© ${config.profile.name}. Built with SareyBothPortfolio.`,
        version: 1,
      },
      update: {
        copyrightNotice: `© ${config.profile.name}. Built with SareyBothPortfolio.`,
        version: { increment: 1 },
      },
    });
    counts.footerSettings = 1;

    // 6. LabelsSettings
    await tx.labelsSettings.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        exploreHighlightsCta: config.labels.exploreHighlightsCta,
        contactCta: config.labels.contactCta,
        downloadResumeCta: config.labels.downloadResumeCta,
        allCategoriesFilter: config.labels.allCategoriesFilter,
        emptyHighlightsText: config.labels.emptyHighlightsText,
        emptyArticlesText: config.labels.emptyArticlesText,
        sampleTestimonialsNotice: config.labels.sampleTestimonialsNotice,
        version: 1,
      },
      update: {
        exploreHighlightsCta: config.labels.exploreHighlightsCta,
        contactCta: config.labels.contactCta,
        downloadResumeCta: config.labels.downloadResumeCta,
        allCategoriesFilter: config.labels.allCategoriesFilter,
        emptyHighlightsText: config.labels.emptyHighlightsText,
        emptyArticlesText: config.labels.emptyArticlesText,
        sampleTestimonialsNotice: config.labels.sampleTestimonialsNotice,
        version: { increment: 1 },
      },
    });
    counts.labelsSettings = 1;

    // 7. Sections
    let secCount = 0;
    for (const [idx, sec] of config.sections.entries()) {
      await tx.section.upsert({
        where: { id: sec.id },
        create: {
          id: sec.id,
          title: sec.title,
          navLabel: sec.navLabel ?? null,
          subtitle: sec.subtitle ?? null,
          enabled: sec.enabled,
          displayOrder: sec.order ?? idx,
          version: 1,
        },
        update: {
          title: sec.title,
          navLabel: sec.navLabel ?? null,
          subtitle: sec.subtitle ?? null,
          enabled: sec.enabled,
          displayOrder: sec.order ?? idx,
          version: { increment: 1 },
        },
      });
      secCount++;
    }
    counts.sections = secCount;

    // 8. Social Links
    await tx.socialLink.deleteMany();
    counts.socialLinks = 0;
    if (config.profile.socialLinks) {
      for (let i = 0; i < config.profile.socialLinks.length; i++) {
        const link = config.profile.socialLinks[i];
        await tx.socialLink.create({
          data: {
            platform: link.platform,
            label: link.label,
            url: link.url,
            displayOrder: (i + 1) * 10,
            enabled: true,
            version: 1,
          },
        });
        counts.socialLinks++;
      }
    }

    // 9. Quick Facts
    await tx.quickFact.deleteMany();
    counts.quickFacts = 0;
    if (config.profile.quickFacts) {
      for (let i = 0; i < config.profile.quickFacts.length; i++) {
        const fact = config.profile.quickFacts[i];
        await tx.quickFact.create({
          data: {
            label: fact.label,
            value: fact.value,
            displayOrder: (i + 1) * 10,
            enabled: true,
            version: 1,
          },
        });
        counts.quickFacts++;
      }
    }

    // 10. Values
    await tx.valueItem.deleteMany();
    counts.values = 0;
    if (config.profile.values) {
      for (let i = 0; i < config.profile.values.length; i++) {
        const val = config.profile.values[i];
        await tx.valueItem.create({
          data: {
            title: val.title,
            description: val.description,
            displayOrder: (i + 1) * 10,
            enabled: true,
            version: 1,
          },
        });
        counts.values++;
      }
    }

    // 11. Strengths
    counts.strengthGroups = 0;
    for (let gIdx = 0; gIdx < config.strengths.length; gIdx++) {
      const group = config.strengths[gIdx];
      await tx.strengthGroup.upsert({
        where: { id: group.id },
        create: {
          id: group.id,
          category: group.category,
          description: group.description ?? null,
          displayOrder: (gIdx + 1) * 10,
          enabled: true,
          version: 1,
        },
        update: {
          category: group.category,
          description: group.description ?? null,
          displayOrder: (gIdx + 1) * 10,
          enabled: true,
          version: { increment: 1 },
        },
      });
      counts.strengthGroups++;

      await tx.strengthItem.deleteMany({ where: { groupId: group.id } });
      for (let iIdx = 0; iIdx < group.items.length; iIdx++) {
        await tx.strengthItem.create({
          data: {
            groupId: group.id,
            name: group.items[iIdx],
            displayOrder: (iIdx + 1) * 10,
            enabled: true,
            version: 1,
          },
        });
      }
    }

    // 12. Highlight Categories
    const categoryNames = Array.from(
      new Set(config.highlights.map((h) => h.category.trim()).filter(Boolean))
    );
    const categoryMap = new Map<string, string>();
    for (let cIdx = 0; cIdx < categoryNames.length; cIdx++) {
      const catName = categoryNames[cIdx];
      const catSlug = slugify(catName);
      const catRecord = await tx.highlightCategory.upsert({
        where: { slug: catSlug },
        create: {
          name: catName,
          slug: catSlug,
          displayOrder: (cIdx + 1) * 10,
          version: 1,
        },
        update: {
          name: catName,
          displayOrder: (cIdx + 1) * 10,
          version: { increment: 1 },
        },
      });
      categoryMap.set(catName, catRecord.id);
    }

    // 13. Tags
    const allTags = new Set<string>();
    config.highlights.forEach((h) => h.tags.forEach((t) => allTags.add(t.trim())));
    config.articles.forEach((a) => a.tags.forEach((t) => allTags.add(t.trim())));
    const tagMap = new Map<string, string>();
    for (const tagName of allTags) {
      if (!tagName) continue;
      const tSlug = slugify(tagName);
      const tagRecord = await tx.tag.upsert({
        where: { slug: tSlug },
        create: { name: tagName, slug: tSlug, version: 1 },
        update: { name: tagName, version: { increment: 1 } },
      });
      tagMap.set(tagName, tagRecord.id);
    }

    // 14. Highlights
    let hCount = 0;
    for (const [idx, h] of config.highlights.entries()) {
      const categoryId = categoryMap.get(h.category.trim()) ?? null;
      const snap = {
        slug: h.slug,
        title: h.title,
        summary: h.summary,
        category: h.category,
        featured: h.featured ?? false,
        date: h.date,
        roleOrContribution: h.roleOrContribution,
        context: h.context,
        outcomes: h.outcomes,
        tags: h.tags,
        coverImage: h.coverImage,
        gallery: h.gallery,
        externalLinks: h.externalLinks,
        relatedSlugs: h.relatedSlugs,
        body: h.body,
      };

      const record = await tx.highlight.upsert({
        where: { slug: h.slug },
        create: {
          slug: h.slug,
          title: h.title,
          summary: h.summary,
          categoryId,
          roleOrContribution: h.roleOrContribution,
          context: h.context,
          outcomes: h.outcomes,
          date: h.date ?? null,
          featured: h.featured ?? false,
          displayOrder: idx,
          coverImage: h.coverImage ? JSON.parse(JSON.stringify(h.coverImage)) : undefined,
          gallery: h.gallery ? JSON.parse(JSON.stringify(h.gallery)) : undefined,
          externalLinks: h.externalLinks ? JSON.parse(JSON.stringify(h.externalLinks)) : undefined,
          relatedSlugs: h.relatedSlugs ?? [],
          body: JSON.parse(JSON.stringify(h.body)),
          published: h.published,
          publishedAt: h.published ? new Date() : null,
          publishedSnapshot: h.published ? JSON.parse(JSON.stringify(snap)) : undefined,
          version: 1,
        },
        update: {
          title: h.title,
          summary: h.summary,
          categoryId,
          roleOrContribution: h.roleOrContribution,
          context: h.context,
          outcomes: h.outcomes,
          date: h.date ?? null,
          featured: h.featured ?? false,
          displayOrder: idx,
          coverImage: h.coverImage ? JSON.parse(JSON.stringify(h.coverImage)) : undefined,
          gallery: h.gallery ? JSON.parse(JSON.stringify(h.gallery)) : undefined,
          externalLinks: h.externalLinks ? JSON.parse(JSON.stringify(h.externalLinks)) : undefined,
          relatedSlugs: h.relatedSlugs ?? [],
          body: JSON.parse(JSON.stringify(h.body)),
          published: h.published,
          publishedAt: h.published ? new Date() : null,
          publishedSnapshot: h.published ? JSON.parse(JSON.stringify(snap)) : undefined,
          version: { increment: 1 },
        },
      });

      await tx.highlightTag.deleteMany({ where: { highlightId: record.id } });
      for (const t of h.tags) {
        const tagId = tagMap.get(t.trim());
        if (tagId) {
          await tx.highlightTag.create({
            data: { highlightId: record.id, tagId },
          }).catch(() => {});
        }
      }
      hCount++;
    }
    counts.highlights = hCount;

    // 15. Journey
    counts.journey = 0;
    for (let jIdx = 0; jIdx < config.journey.length; jIdx++) {
      const item = config.journey[jIdx];
      await tx.journeyEntry.upsert({
        where: { id: item.id },
        create: {
          id: item.id,
          type: item.type,
          title: item.title,
          organization: item.organization ?? null,
          location: item.location ?? null,
          startDate: item.startDate,
          endDate: item.endDate ?? null,
          isCurrent: item.endDate === "Present",
          description: item.description,
          highlights: item.highlights ? item.highlights : undefined,
          displayOrder: (jIdx + 1) * 10,
          version: 1,
        },
        update: {
          type: item.type,
          title: item.title,
          organization: item.organization ?? null,
          location: item.location ?? null,
          startDate: item.startDate,
          endDate: item.endDate ?? null,
          isCurrent: item.endDate === "Present",
          description: item.description,
          highlights: item.highlights ? item.highlights : undefined,
          displayOrder: (jIdx + 1) * 10,
          version: { increment: 1 },
        },
      });
      counts.journey++;
    }

    // 16. Achievements
    counts.achievements = 0;
    for (let aIdx = 0; aIdx < config.achievements.length; aIdx++) {
      const item = config.achievements[aIdx];
      await tx.achievement.upsert({
        where: { id: item.id },
        create: {
          id: item.id,
          title: item.title,
          issuer: item.issuer ?? null,
          date: item.date ?? null,
          description: item.description ?? null,
          image: item.image ? JSON.parse(JSON.stringify(item.image)) : undefined,
          verificationUrl: item.verificationUrl ?? null,
          displayOrder: (aIdx + 1) * 10,
          version: 1,
        },
        update: {
          title: item.title,
          issuer: item.issuer ?? null,
          date: item.date ?? null,
          description: item.description ?? null,
          image: item.image ? JSON.parse(JSON.stringify(item.image)) : undefined,
          verificationUrl: item.verificationUrl ?? null,
          displayOrder: (aIdx + 1) * 10,
          version: { increment: 1 },
        },
      });
      counts.achievements++;
    }

    // 17. Testimonials
    counts.testimonials = 0;
    for (let tIdx = 0; tIdx < config.testimonials.length; tIdx++) {
      const item = config.testimonials[tIdx];
      await tx.testimonial.upsert({
        where: { id: item.id },
        create: {
          id: item.id,
          quote: item.quote,
          name: item.name,
          relationship: item.relationship,
          avatar: item.avatar ? JSON.parse(JSON.stringify(item.avatar)) : undefined,
          isSample: item.isSample ?? false,
          displayOrder: (tIdx + 1) * 10,
          version: 1,
        },
        update: {
          quote: item.quote,
          name: item.name,
          relationship: item.relationship,
          avatar: item.avatar ? JSON.parse(JSON.stringify(item.avatar)) : undefined,
          isSample: item.isSample ?? false,
          displayOrder: (tIdx + 1) * 10,
          version: { increment: 1 },
        },
      });
      counts.testimonials++;
    }

    // 18. Services
    counts.services = 0;
    for (let sIdx = 0; sIdx < config.services.length; sIdx++) {
      const item = config.services[sIdx];
      await tx.service.upsert({
        where: { id: item.id },
        create: {
          id: item.id,
          title: item.title,
          description: item.description,
          deliverables: item.deliverables ? item.deliverables : undefined,
          ctaLabel: item.ctaLabel ?? null,
          displayOrder: (sIdx + 1) * 10,
          version: 1,
        },
        update: {
          title: item.title,
          description: item.description,
          deliverables: item.deliverables ? item.deliverables : undefined,
          ctaLabel: item.ctaLabel ?? null,
          displayOrder: (sIdx + 1) * 10,
          version: { increment: 1 },
        },
      });
      counts.services++;
    }

    // 19. Articles
    let aCount = 0;
    for (const [idx, art] of config.articles.entries()) {
      const snap = {
        slug: art.slug,
        title: art.title,
        summary: art.summary,
        date: art.date,
        readingTime: art.readingTime,
        tags: art.tags,
        coverImage: art.coverImage,
        body: art.body,
      };

      const record = await tx.article.upsert({
        where: { slug: art.slug },
        create: {
          slug: art.slug,
          title: art.title,
          summary: art.summary,
          date: art.date,
          readingTime: art.readingTime ?? null,
          coverImage: art.coverImage ? JSON.parse(JSON.stringify(art.coverImage)) : undefined,
          body: JSON.parse(JSON.stringify(art.body)),
          published: art.published,
          publishedAt: art.published ? new Date() : null,
          publishedSnapshot: art.published ? JSON.parse(JSON.stringify(snap)) : undefined,
          displayOrder: idx,
          version: 1,
        },
        update: {
          title: art.title,
          summary: art.summary,
          date: art.date,
          readingTime: art.readingTime ?? null,
          coverImage: art.coverImage ? JSON.parse(JSON.stringify(art.coverImage)) : undefined,
          body: JSON.parse(JSON.stringify(art.body)),
          published: art.published,
          publishedAt: art.published ? new Date() : null,
          publishedSnapshot: art.published ? JSON.parse(JSON.stringify(snap)) : undefined,
          displayOrder: idx,
          version: { increment: 1 },
        },
      });

      await tx.articleTag.deleteMany({ where: { articleId: record.id } });
      for (const t of art.tags) {
        const tagId = tagMap.get(t.trim());
        if (tagId) {
          await tx.articleTag.create({
            data: { articleId: record.id, tagId },
          }).catch(() => {});
        }
      }
      aCount++;
    }
    counts.articles = aCount;

    // 20. Interests
    counts.interests = 0;
    for (let inIdx = 0; inIdx < config.interests.length; inIdx++) {
      const item = config.interests[inIdx];
      await tx.interest.upsert({
        where: { id: item.id },
        create: {
          id: item.id,
          name: item.name,
          category: item.category ?? null,
          description: item.description,
          displayOrder: (inIdx + 1) * 10,
          version: 1,
        },
        update: {
          name: item.name,
          category: item.category ?? null,
          description: item.description,
          displayOrder: (inIdx + 1) * 10,
          version: { increment: 1 },
        },
      });
      counts.interests++;
    }

    // 21. Gallery
    counts.gallery = 0;
    for (let gIdx = 0; gIdx < config.gallery.length; gIdx++) {
      const item = config.gallery[gIdx];
      await tx.galleryItem.upsert({
        where: { id: item.id },
        create: {
          id: item.id,
          title: item.title,
          caption: item.caption,
          date: item.date ?? null,
          image: JSON.parse(JSON.stringify(item.image)),
          displayOrder: (gIdx + 1) * 10,
          version: 1,
        },
        update: {
          title: item.title,
          caption: item.caption,
          date: item.date ?? null,
          image: JSON.parse(JSON.stringify(item.image)),
          displayOrder: (gIdx + 1) * 10,
          version: { increment: 1 },
        },
      });
      counts.gallery++;
    }
  });

  await logAuditEvent({
    actorId,
    actorEmail,
    action: "import",
    entityType: "portfolio_config",
    details: { counts },
  });

  return { counts };
}
