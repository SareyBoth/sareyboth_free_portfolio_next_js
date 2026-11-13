import React from "react";
import Link from "next/link";
import { getPortfolioContent } from "@/lib/content/load";
import {
  buildNavigation,
  getConfiguredSocialLinks,
  isSectionEnabled,
} from "@/lib/content/selectors";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export default function NotFoundPage() {
  const { config, resumeAssetExists } = getPortfolioContent();
  const navItems = buildNavigation(config, {
    isSubpage: true,
    resumeAssetExists,
  });
  const socialLinks = getConfiguredSocialLinks(config);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader
        profileName={config.profile.name}
        navItems={navItems}
        showJournalRouteLink={isSectionEnabled(config, "journal")}
      />

      <main
        id="main-content"
        className="flex-1 flex items-center justify-center px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="surface-card max-w-lg w-full text-center space-y-5">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
            404 — Page Not Found
          </p>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            We couldn&apos;t find that page
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
            The link you followed may refer to a highlight or section that is unpublished, disabled, or no longer at this address.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] transition-colors"
              style={{ borderRadius: "var(--radius-md)" }}
            >
              Return to Portfolio Home
            </Link>
            <Link
              href="/#highlights"
              className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
              style={{ borderRadius: "var(--radius-md)" }}
            >
              Browse Highlights
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter
        profileName={config.profile.name}
        descriptor={config.profile.descriptor}
        navItems={navItems}
        socialLinks={socialLinks}
      />
    </div>
  );
}
