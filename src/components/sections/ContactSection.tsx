import React from "react";
import type { PortfolioConfig, SectionConfig } from "@/types/portfolio";
import { getConfiguredSocialLinks } from "@/lib/content/selectors";
import { ContactForm } from "./ContactForm";

export function ContactSection({
  section,
  config,
  isPreview = false,
}: {
  section: SectionConfig;
  config: PortfolioConfig;
  isPreview?: boolean;
}) {
  const { profile, labels } = config;
  const socialLinks = getConfiguredSocialLinks(config);

  return (
    <section
      id={section.id}
      aria-labelledby="contact-heading"
      className="section-anchor"
      style={{
        paddingTop: "var(--section-py)",
        paddingBottom: "var(--section-py)",
      }}
    >
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <h2
                id="contact-heading"
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

            <div className="surface-card space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {labels.directEmailFallbackLabel}
                </p>
                <a
                  href={`mailto:${profile.contactEmail}`}
                  className="text-base font-semibold text-[var(--accent)] hover:underline underline-offset-4 break-all"
                >
                  {profile.contactEmail}
                </a>
              </div>

              {profile.location && (
                <div className="space-y-1 pt-2 border-t border-[var(--border-subtle)]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Location
                  </p>
                  <p className="text-sm text-[var(--text-primary)]">
                    {profile.location}
                  </p>
                </div>
              )}

              {socialLinks.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Profiles &amp; Links
                  </p>
                  <ul className="flex flex-wrap gap-3 text-sm">
                    {socialLinks.map((social) => (
                      <li key={`${social.platform}-${social.url}`}>
                        <a
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={social.label}
                          className="inline-flex items-center gap-1 font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline decoration-[var(--border-strong)] underline-offset-4"
                        >
                          <span>
                            {social.platform}
                            {isPreview ? " (External)" : ""}
                          </span>
                          <span aria-hidden="true">&nearr;</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7">
            <ContactForm
              recipientEmail={profile.contactEmail}
              openEmailAppButtonLabel={labels.openEmailAppButton}
              emailAppHelperText={labels.emailAppHelperText}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
