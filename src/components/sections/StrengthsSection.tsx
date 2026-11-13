import React from "react";
import type { PortfolioConfig, SectionConfig } from "@/types/portfolio";
import { getNonEmptyStrengthGroups } from "@/lib/content/selectors";

export function StrengthsSection({
  section,
  config,
}: {
  section: SectionConfig;
  config: PortfolioConfig;
}) {
  const groups = getNonEmptyStrengthGroups(config);
  if (groups.length === 0) return null;

  return (
    <section
      id={section.id}
      aria-labelledby="strengths-heading"
      className="section-anchor border-b border-[var(--border-subtle)]"
      style={{
        paddingTop: "var(--section-py)",
        paddingBottom: "var(--section-py)",
      }}
    >
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="max-w-2xl space-y-2">
          <h2
            id="strengths-heading"
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
          className="grid grid-cols-1 md:grid-cols-2"
          style={{ gap: "var(--grid-gap)" }}
        >
          {groups.map((group) => (
            <div key={group.id} className="surface-card space-y-4">
              <div className="space-y-1">
                <h3 className="font-heading text-lg font-semibold text-[var(--text-primary)]">
                  {group.category}
                </h3>
                {group.description && (
                  <p className="text-sm text-[var(--text-muted)]">
                    {group.description}
                  </p>
                )}
              </div>

              <ul
                aria-label={group.category}
                className="flex flex-wrap gap-2 pt-1"
              >
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="px-3 py-1 text-xs sm:text-sm font-medium bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)]"
                    style={{ borderRadius: "var(--radius-sm)" }}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
