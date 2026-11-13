import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDraftArticleByIdOrSlug, getDraftPortfolioConfig } from "@/server/services/public-content";
import { formatPortfolioDate } from "@/lib/content/date";
import {
  buildNavigation,
  getConfiguredSocialLinks,
  isSectionEnabled,
} from "@/lib/content/selectors";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ContentBlocksRenderer } from "@/components/ui/ContentBlocksRenderer";


// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;


export default async function DraftArticlePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [config, article] = await Promise.all([
    getDraftPortfolioConfig(),
    getDraftArticleByIdOrSlug(id),
  ]);

  if (!article) {
    notFound();
  }

  const navItems = buildNavigation(config, {
    isSubpage: true,
  });
  const socialLinks = getConfiguredSocialLinks(config);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader
        profileName={config.profile.name}
        navItems={navItems}
        showJournalRouteLink={isSectionEnabled(config, "journal")}
        isPreview={true}
      />

      <main id="main-content" className="flex-1 py-12 sm:py-16">
        <article className="mx-auto max-w-[800px] px-4 sm:px-6 lg:px-8 space-y-10">
          <nav aria-label="Breadcrumb">
            <Link
              href="/preview/#journal"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] transition-colors"
            >
              <span aria-hidden="true">&larr;</span>
              <span>Back to journal</span>
            </Link>
          </nav>

          <header className="space-y-4 border-b border-[var(--border)] pb-8">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <time className="font-medium text-[var(--muted)]">
                {formatPortfolioDate(article.date)}
              </time>
              {article.readingTime && (
                <>
                  <span className="text-[var(--muted)] opacity-40">•</span>
                  <span className="text-[var(--muted)]">{article.readingTime}</span>
                </>
              )}
              {!article.published && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Unpublished Draft
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text)]">
              {article.title}
            </h1>

            <p className="text-lg text-[var(--muted)] leading-relaxed">
              {article.summary}
            </p>

            {article.tags.length > 0 && (
              <ul className="flex flex-wrap gap-2 pt-2 text-xs text-[var(--muted)]">
                {article.tags.map((tag) => (
                  <li
                    key={tag}
                    className="px-2.5 py-1 bg-[var(--muted)]/10 rounded-md border border-[var(--border)]"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </header>

          {article.coverImage && (
            <div className="overflow-hidden border border-[var(--border)] rounded-2xl bg-[var(--muted)]/5">
              <div className="aspect-video relative">
                <img
                  src={article.coverImage.src}
                  alt={article.coverImage.alt}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Narrative Body Blocks */}
          {article.body.length > 0 && (
            <section className="space-y-6 pt-4">
              <ContentBlocksRenderer blocks={article.body} />
            </section>
          )}
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
