"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { HighlightItem } from "@/types/portfolio";
import { formatPortfolioDate } from "@/lib/content/date";

export function HighlightsFilterGrid({
  highlights,
  categories,
  allFilterLabel,
  emptyStateText,
  isPreview = false,
}: {
  highlights: HighlightItem[];
  categories: string[];
  allFilterLabel: string;
  emptyStateText: string;
  isPreview?: boolean;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("__ALL__");

  const filteredHighlights = useMemo(() => {
    if (selectedCategory === "__ALL__") {
      return highlights;
    }
    return highlights.filter((item) => item.category === selectedCategory);
  }, [highlights, selectedCategory]);

  return (
    <div className="space-y-6">
      {categories.length > 1 && (
        <div
          role="group"
          aria-label="Filter highlights by category"
          className="flex flex-wrap items-center gap-2"
        >
          <button
            type="button"
            aria-pressed={selectedCategory === "__ALL__"}
            onClick={() => setSelectedCategory("__ALL__")}
            className={`px-3.5 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
              selectedCategory === "__ALL__"
                ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            }`}
            style={{ borderRadius: "var(--radius-md)" }}
          >
            {allFilterLabel}
          </button>

          {categories.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedCategory(category)}
                className={`px-3.5 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                    : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                }`}
                style={{ borderRadius: "var(--radius-md)" }}
              >
                {category}
              </button>
            );
          })}
        </div>
      )}

      <p className="sr-only" role="status" aria-live="polite">
        Showing {filteredHighlights.length} of {highlights.length} highlights.
      </p>

      {filteredHighlights.length === 0 ? (
        <div className="surface-card text-center py-12 space-y-3">
          <p className="text-base text-[var(--text-muted)]">{emptyStateText}</p>
          {selectedCategory !== "__ALL__" && (
            <button
              type="button"
              onClick={() => setSelectedCategory("__ALL__")}
              className="px-4 py-2 text-sm font-medium bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] cursor-pointer"
              style={{ borderRadius: "var(--radius-md)" }}
            >
              Show {allFilterLabel}
            </button>
          )}
        </div>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          style={{ gap: "var(--grid-gap)" }}
        >
          {filteredHighlights.map((item) => (
            <article
              key={item.slug}
              className="surface-card flex flex-col justify-between overflow-hidden transition-colors hover:border-[var(--border-strong)]"
            >
              <div className="space-y-4">
                {item.coverImage && (
                  <div
                    className="-mx-2 -mt-2 mb-4 overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-subtle)] aspect-[16/10]"
                    style={{ borderRadius: "var(--radius-md)" }}
                  >
                    <Image
                      src={item.coverImage.src}
                      alt={item.coverImage.alt}
                      width={item.coverImage.width ?? 800}
                      height={item.coverImage.height ?? 500}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span
                    className="px-2.5 py-0.5 font-medium bg-[var(--accent-soft)] text-[var(--accent-soft-text)]"
                    style={{ borderRadius: "var(--radius-sm)" }}
                  >
                    {item.category}
                  </span>
                  {item.date && (
                    <time
                      dateTime={item.date}
                      className="text-[var(--text-muted)]"
                    >
                      {formatPortfolioDate(item.date)}
                    </time>
                  )}
                </div>

                <h3 className="font-heading text-xl font-semibold text-[var(--text-primary)] leading-snug">
                  <Link
                    href={`/highlights/${item.slug}`}
                    className="hover:underline decoration-[var(--accent)] underline-offset-4"
                  >
                    {item.title}
                  </Link>
                </h3>

                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {item.summary}
                </p>
              </div>

              <div className="pt-5 mt-5 border-t border-[var(--border-subtle)] space-y-3">
                {item.tags.length > 0 && (
                  <ul
                    aria-label="Tags"
                    className="flex flex-wrap gap-1.5 text-xs text-[var(--text-muted)]"
                  >
                    {item.tags.map((tag) => (
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

                <div className="flex items-center justify-between pt-1">
                  <Link
                    href={`/highlights/${item.slug}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)] hover:underline underline-offset-4"
                  >
                    <span>Read full story</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                  {isPreview && (
                    <span className="text-[11px] text-[var(--text-muted)]">
                      Opens committed page
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
