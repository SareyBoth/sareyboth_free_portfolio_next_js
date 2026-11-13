import React from "react";
import Image from "next/image";
import type { PortfolioConfig, SectionConfig } from "@/types/portfolio";
import { formatPortfolioDate } from "@/lib/content/date";

export function GallerySection({
  section,
  config,
}: {
  section: SectionConfig;
  config: PortfolioConfig;
}) {
  const { gallery } = config;
  if (gallery.length === 0) return null;

  return (
    <section
      id={section.id}
      aria-labelledby="gallery-heading"
      className="section-anchor border-b border-[var(--border-subtle)]"
      style={{
        paddingTop: "var(--section-py)",
        paddingBottom: "var(--section-py)",
      }}
    >
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="max-w-2xl space-y-2">
          <h2
            id="gallery-heading"
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

        <div
          className="grid grid-cols-1 sm:grid-cols-2"
          style={{ gap: "var(--grid-gap)" }}
        >
          {gallery.map((entry) => (
            <figure
              key={entry.id}
              className="surface-card overflow-hidden space-y-3"
            >
              <div
                className="overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-subtle)] aspect-[4/3]"
                style={{ borderRadius: "var(--radius-md)" }}
              >
                <Image
                  src={entry.image.src}
                  alt={entry.image.alt}
                  width={entry.image.width ?? 600}
                  height={entry.image.height ?? 450}
                  className="w-full h-full object-cover"
                />
              </div>

              <figcaption className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-heading text-base font-semibold text-[var(--text-primary)]">
                    {entry.title}
                  </span>
                  {entry.date && (
                    <time
                      dateTime={entry.date}
                      className="text-xs text-[var(--text-muted)]"
                    >
                      {formatPortfolioDate(entry.date)}
                    </time>
                  )}
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  {entry.caption}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
