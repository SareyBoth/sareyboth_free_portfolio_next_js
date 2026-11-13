import fs from "node:fs";
import path from "node:path";
import { prisma } from "../src/server/prisma-client";
import { validatePortfolioConfig } from "../src/lib/content/schema";
import type { PortfolioConfig } from "../src/types/portfolio";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function importPortfolioJson(filePath?: string, force = false): Promise<{
  success: boolean;
  counts: Record<string, number>;
  message: string;
}> {
  const targetPath =
    filePath ?? path.resolve(process.cwd(), "src/content/portfolio.json");

  if (!fs.existsSync(targetPath)) {
    throw new Error(`Portfolio JSON file not found at: ${targetPath}`);
  }

  const raw = fs.readFileSync(targetPath, "utf-8");
  const parsedJson = JSON.parse(raw);
  const validation = validatePortfolioConfig(parsedJson);

  if (!validation.success) {
    const formatted = validation.issues
      .map((i) => `[${i.path}]: ${i.message}`)
      .join("; ");
    throw new Error(`Portfolio validation failed: ${formatted}`);
  }

  const config: PortfolioConfig = validation.data;
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
    const activeAppearanceSnapshot = {
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
        defaultPreset: config.appearance.defaultPreset,
        defaultMode: config.appearance.defaultMode,
        fontPreset: config.appearance.fontPreset,
        density: config.appearance.density,
        radius: config.appearance.radius,
        publishedSnapshot: activeAppearanceSnapshot,
        publishedAt: new Date(),
        version: 1,
      },
      update: {
        defaultPreset: config.appearance.defaultPreset,
        defaultMode: config.appearance.defaultMode,
        fontPreset: config.appearance.fontPreset,
        density: config.appearance.density,
        radius: config.appearance.radius,
        publishedSnapshot: activeAppearanceSnapshot,
        publishedAt: new Date(),
        version: { increment: 1 },
      },
    });
    counts.presentation = 1;

    // 4. ContactSettings
    await tx.contactSettings.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        recipientEmail: config.profile.contactEmail,
        mode: "form",
        acknowledgementText: "Message received! Thank you for reaching out.",
        openEmailAppButtonLabel: config.labels.openEmailAppButton,
        emailAppHelperText: config.labels.emailAppHelperText,
        directEmailFallbackLabel: config.labels.directEmailFallbackLabel,
        version: 1,
      },
      update: {
        recipientEmail: config.profile.contactEmail,
        openEmailAppButtonLabel: config.labels.openEmailAppButton,
        emailAppHelperText: config.labels.emailAppHelperText,
        directEmailFallbackLabel: config.labels.directEmailFallbackLabel,
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
        copyrightNotice: `© ${config.profile.name}. Built with the SareyBothPortfolio template.`,
        version: 1,
      },
      update: {
        copyrightNotice: `© ${config.profile.name}. Built with the SareyBothPortfolio template.`,
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
    counts.sections = 0;
    for (const sec of config.sections) {
      await tx.section.upsert({
        where: { id: sec.id },
        create: {
          id: sec.id,
          title: sec.title,
          navLabel: sec.navLabel ?? null,
          subtitle: sec.subtitle ?? null,
          enabled: sec.enabled,
          displayOrder: sec.order,
          version: 1,
        },
        update: {
          title: sec.title,
          navLabel: sec.navLabel ?? null,
          subtitle: sec.subtitle ?? null,
          enabled: sec.enabled,
          displayOrder: sec.order,
          version: { increment: 1 },
        },
      });
      counts.sections++;
    }

    // 8. Social Links
    await tx.socialLink.deleteMany();
    counts.socialLinks = 0;
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

    // 11. Strength Groups & Items
    counts.strengthGroups = 0;
    counts.strengthItems = 0;
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
        counts.strengthItems++;
      }
    }

    // 12. Highlight Categories
    const categoryNames = Array.from(
      new Set(config.highlights.map((h) => h.category.trim()).filter(Boolean))
    );
    counts.highlightCategories = 0;
    const categoryMap = new Map<string, string>(); // name -> id

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
      counts.highlightCategories++;
    }

    // 13. Tags (from Highlights & Articles)
    const allTags = new Set<string>();
    config.highlights.forEach((h) => h.tags.forEach((t) => allTags.add(t.trim())));
    config.articles.forEach((a) => a.tags.forEach((t) => allTags.add(t.trim())));

    counts.tags = 0;
    const tagMap = new Map<string, string>(); // name -> id
    for (const tagName of allTags) {
      if (!tagName) continue;
      const tagSlug = slugify(tagName);
      const tagRecord = await tx.tag.upsert({
        where: { slug: tagSlug },
        create: {
          name: tagName,
          slug: tagSlug,
          version: 1,
        },
        update: {
          name: tagName,
          version: { increment: 1 },
        },
      });
      tagMap.set(tagName, tagRecord.id);
      counts.tags++;
    }

    // 14. Highlights
    counts.highlights = 0;
    for (let hIdx = 0; hIdx < config.highlights.length; hIdx++) {
      const item = config.highlights[hIdx];
      const categoryId = categoryMap.get(item.category.trim()) ?? null;

      const publishedSnapshot = item.published
        ? {
            slug: item.slug,
            title: item.title,
            summary: item.summary,
            category: item.category,
            roleOrContribution: item.roleOrContribution,
            context: item.context,
            outcomes: item.outcomes,
            date: item.date ?? null,
            featured: item.featured ?? false,
            tags: item.tags,
            coverImage: item.coverImage ?? null,
            gallery: item.gallery ?? [],
            externalLinks: item.externalLinks ?? [],
            relatedSlugs: item.relatedSlugs ?? [],
            body: item.body,
          }
        : null;

      const highlightRecord = await tx.highlight.upsert({
        where: { slug: item.slug },
        create: {
          slug: item.slug,
          title: item.title,
          summary: item.summary,
          categoryId,
          roleOrContribution: item.roleOrContribution,
          context: item.context,
          outcomes: item.outcomes,
          date: item.date ?? null,
          featured: item.featured ?? false,
          displayOrder: (hIdx + 1) * 10,
          coverImage: item.coverImage ? JSON.parse(JSON.stringify(item.coverImage)) : undefined,
          gallery: item.gallery ? JSON.parse(JSON.stringify(item.gallery)) : undefined,
          externalLinks: item.externalLinks ? JSON.parse(JSON.stringify(item.externalLinks)) : undefined,
          relatedSlugs: item.relatedSlugs ?? [],
          body: JSON.parse(JSON.stringify(item.body)),
          published: item.published,
          publishedAt: item.published ? new Date() : null,
          publishedSnapshot: publishedSnapshot ? JSON.parse(JSON.stringify(publishedSnapshot)) : undefined,
          version: 1,
        },
        update: {
          title: item.title,
          summary: item.summary,
          categoryId,
          roleOrContribution: item.roleOrContribution,
          context: item.context,
          outcomes: item.outcomes,
          date: item.date ?? null,
          featured: item.featured ?? false,
          displayOrder: (hIdx + 1) * 10,
          coverImage: item.coverImage ? JSON.parse(JSON.stringify(item.coverImage)) : undefined,
          gallery: item.gallery ? JSON.parse(JSON.stringify(item.gallery)) : undefined,
          externalLinks: item.externalLinks ? JSON.parse(JSON.stringify(item.externalLinks)) : undefined,
          relatedSlugs: item.relatedSlugs ?? [],
          body: JSON.parse(JSON.stringify(item.body)),
          published: item.published,
          publishedAt: item.published ? new Date() : null,
          publishedSnapshot: publishedSnapshot ? JSON.parse(JSON.stringify(publishedSnapshot)) : undefined,
          version: { increment: 1 },
        },
      });

      // Tags relation
      await tx.highlightTag.deleteMany({ where: { highlightId: highlightRecord.id } });
      for (const t of item.tags) {
        const tagId = tagMap.get(t.trim());
        if (tagId) {
          await tx.highlightTag.create({
            data: { highlightId: highlightRecord.id, tagId },
          });
        }
      }
      counts.highlights++;
    }

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
    counts.articles = 0;
    for (let arIdx = 0; arIdx < config.articles.length; arIdx++) {
      const item = config.articles[arIdx];

      const publishedSnapshot = item.published
        ? {
            slug: item.slug,
            title: item.title,
            summary: item.summary,
            date: item.date,
            readingTime: item.readingTime ?? null,
            tags: item.tags,
            coverImage: item.coverImage ?? null,
            body: item.body,
          }
        : null;

      const articleRecord = await tx.article.upsert({
        where: { slug: item.slug },
        create: {
          slug: item.slug,
          title: item.title,
          summary: item.summary,
          date: item.date,
          readingTime: item.readingTime ?? null,
          coverImage: item.coverImage ? JSON.parse(JSON.stringify(item.coverImage)) : undefined,
          body: JSON.parse(JSON.stringify(item.body)),
          published: item.published,
          publishedAt: item.published ? new Date() : null,
          publishedSnapshot: publishedSnapshot ? JSON.parse(JSON.stringify(publishedSnapshot)) : undefined,
          displayOrder: (arIdx + 1) * 10,
          version: 1,
        },
        update: {
          title: item.title,
          summary: item.summary,
          date: item.date,
          readingTime: item.readingTime ?? null,
          coverImage: item.coverImage ? JSON.parse(JSON.stringify(item.coverImage)) : undefined,
          body: JSON.parse(JSON.stringify(item.body)),
          published: item.published,
          publishedAt: item.published ? new Date() : null,
          publishedSnapshot: publishedSnapshot ? JSON.parse(JSON.stringify(publishedSnapshot)) : undefined,
          displayOrder: (arIdx + 1) * 10,
          version: { increment: 1 },
        },
      });

      // Tags relation
      await tx.articleTag.deleteMany({ where: { articleId: articleRecord.id } });
      for (const t of item.tags) {
        const tagId = tagMap.get(t.trim());
        if (tagId) {
          await tx.articleTag.create({
            data: { articleId: articleRecord.id, tagId },
          });
        }
      }
      counts.articles++;
    }

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

    // 22. Audit Log
    await tx.auditLog.create({
      data: {
        action: "import",
        entityType: "portfolio_json",
        details: {
          source: targetPath,
          counts,
          timestamp: new Date().toISOString(),
        },
      },
    });
  });

  return {
    success: true,
    counts,
    message: "Portfolio content successfully imported into PostgreSQL.",
  };
}

if (process.argv[1] && process.argv[1].endsWith("import-portfolio.ts")) {
  importPortfolioJson()
    .then((res) => {
      console.log(res.message);
      console.table(res.counts);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Import failed:", err);
      process.exit(1);
    });
}
