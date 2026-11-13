import React from "react";
import { getDraftPortfolioConfig } from "@/server/services/public-content";
import { getPortfolioContent } from "@/lib/content/load";
import {
  buildNavigation,
  getConfiguredSocialLinks,
  isSectionEnabled,
} from "@/lib/content/selectors";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SectionRenderer } from "@/components/sections/SectionRenderer";


// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;


export default async function DraftPreviewHomePage() {
  const config = await getDraftPortfolioConfig();
  const { resumeAssetExists } = getPortfolioContent();

  const navItems = buildNavigation(config, {
    isSubpage: false,
    resumeAssetExists,
  });
  const socialLinks = getConfiguredSocialLinks(config);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader
        profileName={config.profile.name}
        navItems={navItems}
        showJournalRouteLink={isSectionEnabled(config, "journal")}
        isPreview={true}
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
