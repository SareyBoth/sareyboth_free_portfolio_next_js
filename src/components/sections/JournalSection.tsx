import React from "react";
import Link from "next/link";
import type { PortfolioConfig, SectionConfig } from "@/types/portfolio";
import { formatPortfolioDate } from "@/lib/content/date";
import { getPublishedArticles } from "@/lib/content/selectors";

export function JournalSection({
  section,
  config,
  isPreview = false,
}: {
  section: SectionConfig;
  config: PortfolioConfig;
  isPreview?: boolean;
}) {
  const articles = getPublishedArticles(config);
  if (articles.length === 0) return null;

  return (
    <section
      id={section.id}
      aria-labelledby="journal-heading"
      className="section-anchor border-b border-[var(--border-subtle)]"
      style={{
        paddingTop: "var(--section-py)",
        paddingBottom: "var(--section-py)",
      }}
    >
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-2">
            <h2
              id="journal-heading"
              className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]"
            >
              {section.title}
            </h2>
            {section.subtitle && (
              <p className="text-base text-[var(--text-muted)]">
                {section.subtitle}
              </p>
            )}
          </div>

          <Link
            href="/journal"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)] hover:underline underline-offset-4 shrink-0"
          >
            <span>
              Browse all journal articles{isPreview ? " (Committed route)" : ""}
            </span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-3"
          style={{ gap: "var(--grid-gap)" }}
        >
          {articles.map((article) => (
            <article
              key={article.slug}
              className="surface-card flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
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

                <h3 className="font-heading text-lg font-semibold text-[var(--text-primary)] leading-snug">
                  <Link
                    href={`/journal/${article.slug}`}
                    className="hover:underline decoration-[var(--accent)] underline-offset-4"
                  >
                    {article.title}
                  </Link>
                </h3>

                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {article.summary}
                </p>
              </div>

              <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <Link
                  href={`/journal/${article.slug}`}
                  className="text-sm font-semibold text-[var(--accent)] hover:underline underline-offset-4"
                >
                  Read article &rarr;
                </Link>
                {isPreview && (
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Committed route
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
