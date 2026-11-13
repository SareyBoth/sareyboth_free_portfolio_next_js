import React from "react";
import Image from "next/image";
import type { PortfolioConfig, SectionConfig } from "@/types/portfolio";

export function TestimonialsSection({
  section,
  config,
}: {
  section: SectionConfig;
  config: PortfolioConfig;
}) {
  const { testimonials, labels } = config;
  if (testimonials.length === 0) return null;

  const hasSampleTestimonials = testimonials.some(
    (t) => t.isSample !== false
  );

  return (
    <section
      id={section.id}
      aria-labelledby="testimonials-heading"
      className="section-anchor border-b border-[var(--border-subtle)]"
      style={{
        paddingTop: "var(--section-py)",
        paddingBottom: "var(--section-py)",
      }}
    >
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="max-w-2xl space-y-2">
          <h2
            id="testimonials-heading"
            className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]"
          >
            {section.title}
          </h2>
          {section.subtitle && (
            <p className="text-base text-[var(--text-muted)]">
              {section.subtitle}
            </p>
          )}
          {hasSampleTestimonials && (
            <p
              className="text-xs font-medium px-3 py-1.5 inline-block bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-subtle)]"
              style={{ borderRadius: "var(--radius-sm)" }}
            >
              {labels.sampleTestimonialsNotice}
            </p>
          )}
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-3"
          style={{ gap: "var(--grid-gap)" }}
        >
          {testimonials.map((item) => (
            <figure
              key={item.id}
              className="surface-card flex flex-col justify-between space-y-5"
            >
              <blockquote className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed italic">
                &ldquo;{item.quote}&rdquo;
              </blockquote>

              <figcaption className="flex items-center gap-3 pt-4 border-t border-[var(--border-subtle)]">
                {item.avatar && (
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-subtle)] shrink-0">
                    <Image
                      src={item.avatar.src}
                      alt={item.avatar.alt}
                      width={item.avatar.width ?? 80}
                      height={item.avatar.height ?? 80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {item.relationship}
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
