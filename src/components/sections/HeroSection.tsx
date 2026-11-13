import React from "react";
import Image from "next/image";
import type { PortfolioConfig, SectionConfig } from "@/types/portfolio";
import {
  getInitials,
  hasConfiguredResume,
  isSectionEnabled,
} from "@/lib/content/selectors";

export function HeroSection({
  section,
  config,
  resumeAssetExists = true,
  isPreview = false,
}: {
  section: SectionConfig;
  config: PortfolioConfig;
  resumeAssetExists?: boolean;
  isPreview?: boolean;
}) {
  const { profile, labels } = config;
  const initials = getInitials(profile.name);
  const showResume = hasConfiguredResume(config, resumeAssetExists);

  const defaultPrimaryHref = isSectionEnabled(config, "highlights")
    ? "#highlights"
    : "#contact";
  const primaryCta = profile.primaryCta ?? {
    label: labels.exploreHighlightsCta,
    href: defaultPrimaryHref,
  };
  const secondaryCta = profile.secondaryCta ?? {
    label: labels.contactCta,
    href: "#contact",
  };

  return (
    <section
      id={section.id}
      aria-labelledby="hero-heading"
      className="section-anchor border-b border-[var(--border-subtle)]"
      style={{
        paddingTop: "var(--section-py)",
        paddingBottom: "var(--section-py)",
      }}
    >
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <div className="flex flex-wrap items-center gap-2.5">
              {profile.location && (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                  style={{ borderRadius: "var(--radius-md)" }}
                >
                  <span
                    aria-hidden="true"
                    className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"
                  />
                  {profile.location}
                </span>
              )}
              {profile.availability && (
                <span
                  className="inline-flex items-center px-3 py-1 text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent-soft-text)]"
                  style={{ borderRadius: "var(--radius-md)" }}
                >
                  {profile.availability}
                </span>
              )}
            </div>

            <div className="space-y-3">
              <h1
                id="hero-heading"
                className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--text-primary)] break-words"
              >
                {profile.name}
              </h1>
              <p className="text-lg sm:text-xl font-medium text-[var(--accent)] leading-snug max-w-2xl">
                {profile.descriptor}
              </p>
            </div>

            <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl">
              {profile.introduction}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={primaryCta.href}
                className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] transition-colors"
                style={{ borderRadius: "var(--radius-md)" }}
              >
                {primaryCta.label}
              </a>

              <a
                href={secondaryCta.href}
                className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
                style={{ borderRadius: "var(--radius-md)" }}
              >
                {secondaryCta.label}
              </a>

              {showResume && profile.resumeUrl && (
                <a
                  href={profile.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline decoration-[var(--border-strong)] underline-offset-4 transition-colors"
                >
                  <span>{labels.downloadResumeCta}</span>
                  {isPreview && (
                    <span className="text-xs text-[var(--text-muted)]">
                      (Document)
                    </span>
                  )}
                </a>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 xl:col-span-4 flex justify-start lg:justify-end">
            {profile.portrait?.src ? (
              <div
                className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-square overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-subtle)] shadow-xs"
                style={{ borderRadius: "var(--radius-xl)" }}
              >
                <Image
                  src={profile.portrait.src}
                  alt={profile.portrait.alt}
                  width={profile.portrait.width ?? 640}
                  height={profile.portrait.height ?? 640}
                  priority
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div
                aria-label={`${profile.name} monogram`}
                className="flex w-36 h-36 sm:w-44 sm:h-44 items-center justify-center border border-[var(--border-subtle)] bg-[var(--accent-soft)] text-[var(--accent-soft-text)] font-heading text-4xl sm:text-5xl font-bold select-none"
                style={{ borderRadius: "var(--radius-xl)" }}
              >
                {initials}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
