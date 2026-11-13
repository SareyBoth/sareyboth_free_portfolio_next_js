import React from "react";
import type { Metadata } from "next";
import { getPortfolioContent } from "@/lib/content/load";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { CustomizerWorkspace } from "@/components/customizer/CustomizerWorkspace";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export function generateMetadata(): Metadata {
  const { config } = getPortfolioContent();
  return buildPageMetadata(config, {
    title: "Theme Customizer",
    description:
      "Local browser preview and JSON configuration export tool for the SareyBothPortfolio template.",
    pathname: "/customize",
    forceNoIndex: true,
  });
}

export default function CustomizePage() {
  const { config, resumeAssetExists } = getPortfolioContent();

  return (
    <CustomizerWorkspace
      committedConfig={config}
      resumeAssetExists={resumeAssetExists}
    />
  );
}
