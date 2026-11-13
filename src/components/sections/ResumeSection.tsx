import React from "react";
import type { PortfolioConfig, SectionConfig } from "@/types/portfolio";
import { hasConfiguredResume } from "@/lib/content/selectors";

export function ResumeSection({
  section,
  config,
  resumeAssetExists = true,
}: {
  section: SectionConfig;
  config: PortfolioConfig;
  resumeAssetExists?: boolean;
}) {
  const showResume = hasConfiguredResume(config, resumeAssetExists);
  const resumeUrl = config.profile.resumeUrl?.trim();

  if (!showResume || !resumeUrl) {
    return null;
  }

  return (
    <section
      id={section.id}
      aria-labelledby="resume-heading"
      className="section-anchor border-b border-[var(--border-subtle)]"
      style={{
        paddingTop: "var(--section-py)",
        paddingBottom: "var(--section-py)",
      }}
    >
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 lg:px-8">
        <div className="surface-card flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5 max-w-xl">
            <h2
              id="resume-heading"
              className="font-heading text-2xl font-bold tracking-tight text-[var(--text-primary)]"
            >
              {section.title}
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-secondary)]">
              {section.subtitle ??
                "View or download a formatted PDF copy of my background, experience, and education."}
            </p>
          </div>

          <div className="shrink-0">
            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] transition-colors"
              style={{ borderRadius: "var(--radius-md)" }}
            >
              {config.labels.downloadResumeCta}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
