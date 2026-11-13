import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPortfolioContent } from "@/lib/content/load";
import { formatPortfolioDate } from "@/lib/content/date";
import {
  buildNavigation,
  getConfiguredSocialLinks,
  getPublishedArticleBySlug,
  getPublishedArticles,
} from "@/lib/content/selectors";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ContentBlocksRenderer } from "@/components/ui/ContentBlocksRenderer";

import { getPublicPortfolioConfig } from "@/server/services/public-content";


// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;


async function loadConfig() {
  try {
    const config = await getPublicPortfolioConfig();
    const { resumeAssetExists } = getPortfolioContent();
    return { config, resumeAssetExists };
  } catch {
    return getPortfolioContent();
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { config } = await loadConfig();
  const article = getPublishedArticleBySlug(config, slug);

  if (!article) {
    notFound();
  }

  return buildPageMetadata(config, {
    title: article.title,
    description: article.summary,
    pathname: `/journal/${article.slug}`,
    ogType: "article",
  });
}

export default async function JournalArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { config, resumeAssetExists } = await loadConfig();
  const article = getPublishedArticleBySlug(config, slug);

  if (!article) {
    notFound();
  }

  const navItems = buildNavigation(config, {
    isSubpage: true,
    resumeAssetExists,
  });
  const socialLinks = getConfiguredSocialLinks(config);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader
        profileName={config.profile.name}
        navItems={navItems}
        showJournalRouteLink
      />

      <main id="main-content" className="flex-1 py-12 sm:py-16">
        <article className="mx-auto max-w-[820px] px-4 sm:px-6 lg:px-8 space-y-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-4 text-sm">
            <Link
              href="/journal"
              className="inline-flex items-center gap-1.5 font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <span aria-hidden="true">&larr;</span>
              <span>All journal entries</span>
            </Link>
          </nav>

          <header className="space-y-4 border-b border-[var(--border-subtle)] pb-8">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
              <time dateTime={article.date}>
                {formatPortfolioDate(article.date)}
              </time>
              {article.readingTime && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{article.readingTime}</span>
                </>
              )}
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
              {article.title}
            </h1>

            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              {article.summary}
            </p>

            {article.tags.length > 0 && (
              <ul className="flex flex-wrap gap-2 pt-1 text-xs text-[var(--text-muted)]">
                {article.tags.map((tag) => (
                  <li
                    key={tag}
                    className="px-2.5 py-1 bg-[var(--bg-subtle)] border border-[var(--border-subtle)]"
                    style={{ borderRadius: "var(--radius-sm)" }}
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </header>

          {article.coverImage && (
            <div
              className="overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
              style={{ borderRadius: "var(--radius-xl)" }}
            >
              <Image
                src={article.coverImage.src}
                alt={article.coverImage.alt}
                width={article.coverImage.width ?? 800}
                height={article.coverImage.height ?? 500}
                priority
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          <ContentBlocksRenderer blocks={article.body} />
        </article>
      </main>

      <SiteFooter
        profileName={config.profile.name}
        descriptor={config.profile.descriptor}
        navItems={navItems}
        socialLinks={socialLinks}
      />
    </div>
  );
}
