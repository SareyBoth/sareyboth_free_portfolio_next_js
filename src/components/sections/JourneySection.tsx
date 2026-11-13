import React from "react";
import type {
  JourneyType,
  PortfolioConfig,
  SectionConfig,
} from "@/types/portfolio";
import { formatDateRange } from "@/lib/content/date";
import { getSortedJourneyItems } from "@/lib/content/selectors";

const JOURNEY_TYPE_LABELS: Record<JourneyType, string> = {
  employment: "Role",
  education: "Education",
  volunteering: "Volunteering",
  course: "Course & Training",
  milestone: "Milestone",
};

export function JourneySection({
  section,
  config,
}: {
  section: SectionConfig;
  config: PortfolioConfig;
}) {
  const items = getSortedJourneyItems(config);
  if (items.length === 0) return null;

  return (
    <section
      id={section.id}
      aria-labelledby="journey-heading"
      className="section-anchor border-b border-[var(--border-subtle)]"
      style={{
        paddingTop: "var(--section-py)",
        paddingBottom: "var(--section-py)",
      }}
    >
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="max-w-2xl space-y-2">
          <h2
            id="journey-heading"
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

        <ol className="relative border-l-2 border-[var(--border-subtle)] ml-3 sm:ml-4 space-y-6">
          {items.map((item) => (
            <li key={item.id} className="pl-6 sm:pl-8 relative">
              <span
                aria-hidden="true"
                className="absolute -left-[9px] top-5 w-4 h-4 rounded-full border-2 border-[var(--accent)] bg-[var(--bg-page)]"
              />
              <div className="surface-card space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span
                    className="px-2.5 py-0.5 font-medium bg-[var(--accent-soft)] text-[var(--accent-soft-text)]"
                    style={{ borderRadius: "var(--radius-sm)" }}
                  >
                    {JOURNEY_TYPE_LABELS[item.type]}
                  </span>
                  <span className="font-medium text-[var(--text-muted)]">
                    {formatDateRange(item.startDate, item.endDate)}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-heading text-lg font-semibold text-[var(--text-primary)]">
                    {item.title}
                  </h3>
                  {(item.organization || item.location) && (
                    <p className="text-sm font-medium text-[var(--text-secondary)]">
                      {[item.organization, item.location]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </div>

                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {item.description}
                </p>

                {item.highlights && item.highlights.length > 0 && (
                  <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--text-secondary)]">
                    {item.highlights.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
