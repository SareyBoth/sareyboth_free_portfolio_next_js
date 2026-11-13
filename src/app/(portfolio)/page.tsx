import React from "react";
import type { Metadata } from "next";
import { getPortfolioContent } from "@/lib/content/load";
import { getPublicPortfolioConfig } from "@/server/services/public-content";
import {
  buildNavigation,
  getConfiguredSocialLinks,
  isSectionEnabled,
} from "@/lib/content/selectors";
import { buildPageMetadata, buildPersonJsonLd } from "@/lib/seo/metadata";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SectionRenderer } from "@/components/sections/SectionRenderer";


// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;


async function loadConfig() {
  try {
    const config = await getPublicPortfolioConfig();
    const { resumeAssetExists } = getPortfolioContent();
    return { config, resumeAssetExists };
  } catch {
    return getPortfolioContent();
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { config } = await loadConfig();
  return buildPageMetadata(config, { pathname: "/" });
}

export default async function HomePage() {
  const { config, resumeAssetExists } = await loadConfig();
  const navItems = buildNavigation(config, {
    isSubpage: false,
    resumeAssetExists,
  });
  const socialLinks = getConfiguredSocialLinks(config);
  const personJsonLd = buildPersonJsonLd(config);

  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personJsonLd),
        }}
      />

      <SiteHeader
        profileName={config.profile.name}
        navItems={navItems}
        showJournalRouteLink={isSectionEnabled(config, "journal")}
      />

      <main id="main-content" className="flex-1">
        <SectionRenderer
          config={config}
          resumeAssetExists={resumeAssetExists}
        />
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
