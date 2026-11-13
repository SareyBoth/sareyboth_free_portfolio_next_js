import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { getPortfolioContent } from "@/lib/content/load";
import {
  buildThemeInitScript,
  getThemeDataAttributes,
  resolveColorMode,
} from "@/lib/appearance/theme";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { AppearanceProvider } from "@/components/layout/AppearanceProvider";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export function generateMetadata(): Metadata {
  const { config } = getPortfolioContent();
  return buildPageMetadata(config, { pathname: "/" });
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { config } = getPortfolioContent();
  const initialResolvedMode = resolveColorMode(
    config.appearance.defaultMode,
    false
  );
  const themeAttrs = getThemeDataAttributes(
    config.appearance,
    initialResolvedMode
  );
  const themeInitScript = buildThemeInitScript(config.appearance.defaultMode);

  return (
    <html
      lang={config.site.locale}
      {...themeAttrs}
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeInitScript,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:bg-[var(--accent)] focus:text-[var(--accent-contrast)] focus:rounded-md"
        >
          Skip to main content
        </a>
        <AppearanceProvider defaultMode={config.appearance.defaultMode}>
          {children}
        </AppearanceProvider>
      </body>
    </html>
  );
}
