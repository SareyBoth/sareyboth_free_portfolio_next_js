import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPortfolioContent } from "@/lib/content/load";
import { formatPortfolioDate } from "@/lib/content/date";
import {
  buildNavigation,
  getConfiguredSocialLinks,
  getPublishedArticles,
  isSectionEnabled,
} from "@/lib/content/selectors";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

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

export async function generateMetadata(): Promise<Metadata> {
  const { config } = await loadConfig();
  if (!isSectionEnabled(config, "journal")) {
    return {
      title: "Journal Not Found",
      robots: { index: false, follow: false },
    };
  }
  const journalSection = config.sections.find((s) => s.id === "journal");
  return buildPageMetadata(config, {
    title: journalSection?.title ?? "Journal",
    description:
      journalSection?.subtitle ??
      `Articles and notes by ${config.profile.name}.`,
    pathname: "/journal",
  });
}

export default async function JournalIndexPage() {
  const { config, resumeAssetExists } = await loadConfig();
  if (!isSectionEnabled(config, "journal")) {
    notFound();
  }

  const articles = getPublishedArticles(config);
  const journalSection = config.sections.find((s) => s.id === "journal");
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
        <div className="mx-auto max-w-[920px] px-4 sm:px-6 lg:px-8 space-y-10">
          <nav aria-label="Breadcrumb">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <span aria-hidden="true">&larr;</span>
              <span>Back to portfolio home</span>
            </Link>
          </nav>

          <header className="space-y-3 border-b border-[var(--border-subtle)] pb-8">
            <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
              {journalSection?.title ?? "Journal"}
            </h1>
            {journalSection?.subtitle && (
              <p className="text-lg text-[var(--text-muted)]">
                {journalSection.subtitle}
              </p>
            )}
          </header>

          {articles.length === 0 ? (
            <div className="surface-card py-12 text-center">
              <p className="text-base text-[var(--text-muted)]">
                {config.labels.emptyArticlesText}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {articles.map((article) => (
                <article
                  key={article.slug}
                  className="surface-card space-y-3 transition-colors hover:border-[var(--border-strong)]"
                >
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

                  <h2 className="font-heading text-xl sm:text-2xl font-semibold text-[var(--text-primary)]">
                    <Link
                      href={`/journal/${article.slug}`}
                      className="hover:underline decoration-[var(--accent)] underline-offset-4"
                    >
                      {article.title}
                    </Link>
                  </h2>

                  <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
                    {article.summary}
                  </p>

                  {article.tags.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5 pt-1 text-xs text-[var(--text-muted)]">
                      {article.tags.map((tag) => (
                        <li
                          key={tag}
                          className="px-2 py-0.5 bg-[var(--bg-subtle)]"
                          style={{ borderRadius: "var(--radius-sm)" }}
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="pt-2">
                    <Link
                      href={`/journal/${article.slug}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)] hover:underline underline-offset-4"
                    >
                      <span>Read full article</span>
                      <span aria-hidden="true">&rarr;</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
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
