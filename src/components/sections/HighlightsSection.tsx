import React from "react";
import type { PortfolioConfig, SectionConfig } from "@/types/portfolio";
import {
  getHighlightCategories,
  getPublishedHighlights,
} from "@/lib/content/selectors";
import { HighlightsFilterGrid } from "./HighlightsFilterGrid";

export function HighlightsSection({
  section,
  config,
  isPreview = false,
}: {
  section: SectionConfig;
  config: PortfolioConfig;
  isPreview?: boolean;
}) {
  const highlights = getPublishedHighlights(config);
  const categories = getHighlightCategories(config);
  if (highlights.length === 0) return null;

  return (
    <section
      id={section.id}
      aria-labelledby="highlights-heading"
      className="section-anchor border-b border-[var(--border-subtle)]"
      style={{
        paddingTop: "var(--section-py)",
        paddingBottom: "var(--section-py)",
      }}
    >
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="max-w-2xl space-y-2">
          <h2
            id="highlights-heading"
            className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]"
          >
            {section.title}
          </h2>
          {section.subtitle && (
            <p className="text-base text-[var(--text-muted)]">
              {section.subtitle}
            </p>
          )}
          {isPreview && (
            <p className="text-xs text-[var(--text-muted)] bg-[var(--bg-subtle)] px-3 py-1.5 inline-block border border-[var(--border-subtle)] rounded-md">
              Preview note: Detail links open the committed public highlight pages outside this homepage preview.
            </p>
          )}
        </div>

        <HighlightsFilterGrid
          highlights={highlights}
          categories={categories}
          allFilterLabel={config.labels.allCategoriesFilter}
          emptyStateText={config.labels.emptyHighlightsText}
          isPreview={isPreview}
        />
      </div>
    </section>
  );
}
