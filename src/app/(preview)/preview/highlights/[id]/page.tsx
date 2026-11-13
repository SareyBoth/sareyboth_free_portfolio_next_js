import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDraftHighlightByIdOrSlug, getDraftPortfolioConfig } from "@/server/services/public-content";
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


export default async function DraftHighlightPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [config, highlight] = await Promise.all([
    getDraftPortfolioConfig(),
    getDraftHighlightByIdOrSlug(id),
  ]);

  if (!highlight) {
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
        <article className="mx-auto max-w-[920px] px-4 sm:px-6 lg:px-8 space-y-10">
          <nav aria-label="Breadcrumb">
            <Link
              href="/preview/#highlights"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] transition-colors"
            >
              <span aria-hidden="true">&larr;</span>
              <span>Back to all highlights</span>
            </Link>
          </nav>

          <header className="space-y-4 border-b border-[var(--border)] pb-8">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="px-3 py-1 font-semibold rounded-md bg-[var(--accent)]/10 text-[var(--accent)]">
                {highlight.category}
              </span>
              {highlight.date && (
                <time className="font-medium text-[var(--muted)]">
                  {formatPortfolioDate(highlight.date)}
                </time>
              )}
              {!highlight.published && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Unpublished Draft
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text)]">
              {highlight.title}
            </h1>

            <p className="text-lg text-[var(--muted)] leading-relaxed">
              {highlight.summary}
            </p>

            {highlight.tags.length > 0 && (
              <ul className="flex flex-wrap gap-2 pt-2 text-xs text-[var(--muted)]">
                {highlight.tags.map((tag) => (
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

          {highlight.coverImage && (
            <div className="overflow-hidden border border-[var(--border)] rounded-2xl bg-[var(--muted)]/5">
              <div className="aspect-video relative">
                <img
                  src={highlight.coverImage.src}
                  alt={highlight.coverImage.alt}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Key Facts / Metadata Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">
                Role / Contribution
              </h2>
              <p className="text-sm font-medium text-[var(--text)]">
                {highlight.roleOrContribution}
              </p>
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">
                Context & Setting
              </h2>
              <p className="text-sm font-medium text-[var(--text)]">
                {highlight.context}
              </p>
            </div>

            {highlight.outcomes.length > 0 && (
              <div className="sm:col-span-2 space-y-2 pt-4 border-t border-[var(--border)]">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Key Outcomes
                </h2>
                <ul className="space-y-1.5 text-sm text-[var(--text)]">
                  {highlight.outcomes.map((outcome, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[var(--accent)] font-bold">•</span>
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Narrative Body Blocks */}
          {highlight.body.length > 0 && (
            <section className="space-y-6 pt-6">
              <ContentBlocksRenderer blocks={highlight.body} />
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
