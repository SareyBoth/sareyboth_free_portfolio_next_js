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
  getPublishedHighlightBySlug,
  getPublishedHighlights,
  getRelatedHighlights,
  isSectionEnabled,
} from "@/lib/content/selectors";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ContentBlocksRenderer } from "@/components/ui/ContentBlocksRenderer";

import { getPublicPortfolioConfig, getPublicHighlightBySlug as getDbHighlight } from "@/server/services/public-content";


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

export async function generateStaticParams() {
  const { config } = await loadConfig();
  const highlights = getPublishedHighlights(config);
  return highlights.map((h) => ({ slug: h.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { config } = await loadConfig();
  const highlight = getPublishedHighlightBySlug(config, slug);

  if (!highlight) {
    notFound();
  }

  return buildPageMetadata(config, {
    title: highlight.title,
    description: highlight.summary,
    pathname: `/highlights/${highlight.slug}`,
    ogType: "article",
  });
}

export default async function HighlightDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { config, resumeAssetExists } = await loadConfig();
  const highlight = getPublishedHighlightBySlug(config, slug);

  if (!highlight) {
    notFound();
  }

  const navItems = buildNavigation(config, {
    isSubpage: true,
    resumeAssetExists,
  });
  const socialLinks = getConfiguredSocialLinks(config);
  const related = getRelatedHighlights(config, highlight, 2);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader
        profileName={config.profile.name}
        navItems={navItems}
        showJournalRouteLink={isSectionEnabled(config, "journal")}
      />

      <main id="main-content" className="flex-1 py-12 sm:py-16">
        <article className="mx-auto max-w-[920px] px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb">
            <Link
              href="/#highlights"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <span aria-hidden="true">&larr;</span>
              <span>Back to all highlights</span>
            </Link>
          </nav>

          {/* Header */}
          <header className="space-y-4 border-b border-[var(--border-subtle)] pb-8">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span
                className="px-3 py-1 font-semibold bg-[var(--accent-soft)] text-[var(--accent-soft-text)]"
                style={{ borderRadius: "var(--radius-sm)" }}
              >
                {highlight.category}
              </span>
              {highlight.date && (
                <time
                  dateTime={highlight.date}
                  className="font-medium text-[var(--text-muted)]"
                >
                  {formatPortfolioDate(highlight.date)}
                </time>
              )}
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
              {highlight.title}
            </h1>

            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              {highlight.summary}
            </p>

            {highlight.tags.length > 0 && (
              <ul
                aria-label="Tags"
                className="flex flex-wrap gap-2 pt-2 text-xs text-[var(--text-muted)]"
              >
                {highlight.tags.map((tag) => (
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

          {/* Cover Image */}
          {highlight.coverImage && (
            <div
              className="overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
              style={{ borderRadius: "var(--radius-xl)" }}
            >
              <Image
                src={highlight.coverImage.src}
                alt={highlight.coverImage.alt}
                width={highlight.coverImage.width ?? 800}
                height={highlight.coverImage.height ?? 500}
                priority
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* Context & Role Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <section
              aria-labelledby="highlight-context-heading"
              className="surface-card space-y-2"
            >
              <h2
                id="highlight-context-heading"
                className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]"
              >
                Context &amp; Background
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
                {highlight.context}
              </p>
            </section>

            <section
              aria-labelledby="highlight-role-heading"
              className="surface-card space-y-2"
            >
              <h2
                id="highlight-role-heading"
                className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]"
              >
                Role &amp; Contribution
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
                {highlight.roleOrContribution}
              </p>
            </section>
          </div>

          {/* Story / Process Body Blocks */}
          <section aria-label="Story and process" className="pt-2">
            <ContentBlocksRenderer blocks={highlight.body} />
          </section>

          {/* Outcomes */}
          {highlight.outcomes.length > 0 && (
            <section
              aria-labelledby="highlight-outcomes-heading"
              className="surface-card space-y-3"
            >
              <h2
                id="highlight-outcomes-heading"
                className="font-heading text-xl font-semibold text-[var(--text-primary)]"
              >
                Outcomes &amp; Takeaways
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-[var(--text-secondary)]">
                {highlight.outcomes.map((outcome, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {outcome}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Optional Gallery */}
          {highlight.gallery && highlight.gallery.length > 0 && (
            <section
              aria-labelledby="highlight-gallery-heading"
              className="space-y-4 pt-2"
            >
              <h2
                id="highlight-gallery-heading"
                className="font-heading text-xl font-semibold text-[var(--text-primary)]"
              >
                Project Gallery
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {highlight.gallery.map((img, idx) => (
                  <figure
                    key={`${img.src}-${idx}`}
                    className="surface-card space-y-2.5"
                  >
                    <div
                      className="overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
                      style={{ borderRadius: "var(--radius-md)" }}
                    >
                      <Image
                        src={img.src}
                        alt={img.alt}
                        width={img.width ?? 800}
                        height={img.height ?? 500}
                        className="w-full h-auto object-cover"
                      />
                    </div>
                    {img.caption && (
                      <figcaption className="text-xs sm:text-sm text-[var(--text-muted)]">
                        {img.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </section>
          )}

          {/* Optional External Links */}
          {highlight.externalLinks && highlight.externalLinks.length > 0 && (
            <section
              aria-labelledby="highlight-links-heading"
              className="surface-card space-y-3"
            >
              <h2
                id="highlight-links-heading"
                className="font-heading text-lg font-semibold text-[var(--text-primary)]"
              >
                External Resources
              </h2>
              <ul className="flex flex-wrap gap-4">
                {highlight.externalLinks.map((ext) => (
                  <li key={ext.url}>
                    <a
                      href={ext.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)] hover:underline underline-offset-4"
                    >
                      <span>{ext.label}</span>
                      <span aria-hidden="true">&nearr;</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Related Highlights */}
          {related.length > 0 && (
            <section
              aria-labelledby="related-highlights-heading"
              className="pt-8 border-t border-[var(--border-subtle)] space-y-5"
            >
              <h2
                id="related-highlights-heading"
                className="font-heading text-2xl font-bold text-[var(--text-primary)]"
              >
                Related Highlights
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {related.map((item) => (
                  <div
                    key={item.slug}
                    className="surface-card flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <span
                        className="inline-block px-2.5 py-0.5 text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent-soft-text)]"
                        style={{ borderRadius: "var(--radius-sm)" }}
                      >
                        {item.category}
                      </span>
                      <h3 className="font-heading text-lg font-semibold text-[var(--text-primary)]">
                        <Link
                          href={`/highlights/${item.slug}`}
                          className="hover:underline underline-offset-4"
                        >
                          {item.title}
                        </Link>
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {item.summary}
                      </p>
                    </div>
                    <Link
                      href={`/highlights/${item.slug}`}
                      className="text-sm font-semibold text-[var(--accent)] hover:underline underline-offset-4"
                    >
                      Read highlight &rarr;
                    </Link>
                  </div>
                ))}
              </div>
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
