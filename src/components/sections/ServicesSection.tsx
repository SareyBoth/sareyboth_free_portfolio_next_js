import React from "react";
import type { PortfolioConfig, SectionConfig } from "@/types/portfolio";

export function ServicesSection({
  section,
  config,
}: {
  section: SectionConfig;
  config: PortfolioConfig;
}) {
  const { services } = config;
  if (services.length === 0) return null;

  return (
    <section
      id={section.id}
      aria-labelledby="services-heading"
      className="section-anchor border-b border-[var(--border-subtle)]"
      style={{
        paddingTop: "var(--section-py)",
        paddingBottom: "var(--section-py)",
      }}
    >
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="max-w-2xl space-y-2">
          <h2
            id="services-heading"
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
          {services.map((service) => (
            <div
              key={service.id}
              className="surface-card flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <h3 className="font-heading text-xl font-semibold text-[var(--text-primary)]">
                  {service.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {service.description}
                </p>

                {service.deliverables && service.deliverables.length > 0 && (
                  <ul className="list-disc pl-5 space-y-1.5 pt-2 text-xs sm:text-sm text-[var(--text-secondary)]">
                    {service.deliverables.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pt-4 border-t border-[var(--border-subtle)]">
                <a
                  href="#contact"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)] hover:underline underline-offset-4"
                >
                  <span>{service.ctaLabel ?? "Get in touch"}</span>
                  <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
