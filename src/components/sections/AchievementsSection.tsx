import React from "react";
import Image from "next/image";
import type { PortfolioConfig, SectionConfig } from "@/types/portfolio";
import { formatPortfolioDate } from "@/lib/content/date";

export function AchievementsSection({
  section,
  config,
  isPreview = false,
}: {
  section: SectionConfig;
  config: PortfolioConfig;
  isPreview?: boolean;
}) {
  const { achievements } = config;
  if (achievements.length === 0) return null;

  return (
    <section
      id={section.id}
      aria-labelledby="achievements-heading"
      className="section-anchor border-b border-[var(--border-subtle)]"
      style={{
        paddingTop: "var(--section-py)",
        paddingBottom: "var(--section-py)",
      }}
    >
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="max-w-2xl space-y-2">
          <h2
            id="achievements-heading"
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
          className="grid grid-cols-1 md:grid-cols-3"
          style={{ gap: "var(--grid-gap)" }}
        >
          {achievements.map((item) => (
            <div
              key={item.id}
              className="surface-card flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {item.image && (
                  <div className="w-12 h-12 overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
                    <Image
                      src={item.image.src}
                      alt={item.image.alt}
                      width={item.image.width ?? 120}
                      height={item.image.height ?? 120}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <h3 className="font-heading text-lg font-semibold text-[var(--text-primary)]">
                    {item.title}
                  </h3>
                  {(item.issuer || item.date) && (
                    <p className="text-xs font-medium text-[var(--text-muted)]">
                      {[
                        item.issuer,
                        item.date ? formatPortfolioDate(item.date) : undefined,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </div>

                {item.description && (
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              {item.verificationUrl && (
                <div className="pt-2">
                  <a
                    href={item.verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline underline-offset-4"
                  >
                    <span>
                      Verify credential{isPreview ? " (External)" : ""}
                    </span>
                    <span aria-hidden="true">&nearr;</span>
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
