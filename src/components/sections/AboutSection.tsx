import React from "react";
import type { PortfolioConfig, SectionConfig } from "@/types/portfolio";

export function AboutSection({
  section,
  config,
}: {
  section: SectionConfig;
  config: PortfolioConfig;
}) {
  const { profile } = config;
  const paragraphs = profile.biography.filter((p) => p.trim().length > 0);
  const values = profile.values ?? [];
  const quickFacts = profile.quickFacts ?? [];

  return (
    <section
      id={section.id}
      aria-labelledby="about-heading"
      className="section-anchor border-b border-[var(--border-subtle)]"
      style={{
        paddingTop: "var(--section-py)",
        paddingBottom: "var(--section-py)",
      }}
    >
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="max-w-2xl space-y-2">
          <h2
            id="about-heading"
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

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-5 text-base leading-relaxed text-[var(--text-secondary)]">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="leading-7">
                {paragraph}
              </p>
            ))}
          </div>

          {quickFacts.length > 0 && (
            <div className="lg:col-span-5">
              <div className="surface-card space-y-4">
                <h3 className="font-heading text-base font-semibold text-[var(--text-primary)]">
                  At a Glance
                </h3>
                <dl className="divide-y divide-[var(--border-subtle)] text-sm">
                  {quickFacts.map((fact, idx) => (
                    <div
                      key={`${fact.label}-${idx}`}
                      className="py-2.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:justify-between gap-1"
                    >
                      <dt className="font-medium text-[var(--text-muted)]">
                        {fact.label}
                      </dt>
                      <dd className="text-[var(--text-primary)] sm:text-right font-medium">
                        {fact.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          )}
        </div>

        {values.length > 0 && (
          <div className="space-y-4 pt-2">
            <h3 className="font-heading text-lg font-semibold text-[var(--text-primary)]">
              Guiding Principles
            </h3>
            <div
              className="grid grid-cols-1 md:grid-cols-3"
              style={{ gap: "var(--grid-gap)" }}
            >
              {values.map((val, idx) => (
                <div key={`${val.title}-${idx}`} className="surface-card space-y-2">
                  <h4 className="font-heading text-base font-semibold text-[var(--text-primary)]">
                    {val.title}
                  </h4>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {val.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
