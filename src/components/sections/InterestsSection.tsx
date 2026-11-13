import React from "react";
import type { PortfolioConfig, SectionConfig } from "@/types/portfolio";

export function InterestsSection({
  section,
  config,
}: {
  section: SectionConfig;
  config: PortfolioConfig;
}) {
  const { interests } = config;
  if (interests.length === 0) return null;

  return (
    <section
      id={section.id}
      aria-labelledby="interests-heading"
      className="section-anchor border-b border-[var(--border-subtle)]"
      style={{
        paddingTop: "var(--section-py)",
        paddingBottom: "var(--section-py)",
      }}
    >
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="max-w-2xl space-y-2">
          <h2
            id="interests-heading"
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
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          style={{ gap: "var(--grid-gap)" }}
        >
          {interests.map((interest) => (
            <div key={interest.id} className="surface-card space-y-2.5">
              {interest.category && (
                <span
                  className="inline-block px-2 py-0.5 text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent-soft-text)]"
                  style={{ borderRadius: "var(--radius-sm)" }}
                >
                  {interest.category}
                </span>
              )}
              <h3 className="font-heading text-base font-semibold text-[var(--text-primary)]">
                {interest.name}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {interest.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
