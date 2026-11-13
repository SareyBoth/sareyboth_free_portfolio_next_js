import React from "react";
import type { Metadata } from "next";
import Link from "next/link";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: "Staff Authentication | SareyBothPortfolio",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 bg-[var(--bg-page)] text-[var(--text-primary)]">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-block font-heading text-2xl font-bold tracking-tight text-[var(--text-primary)] hover:opacity-80 transition-opacity"
          >
            SareyBothPortfolio
          </Link>
          <p className="text-xs uppercase tracking-widest font-semibold text-[var(--accent)]">
            Staff Portal
          </p>
        </div>

        <div className="surface-card p-6 sm:p-8 shadow-sm">
          {children}
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            &larr; Return to public portfolio
          </Link>
        </div>
      </div>
    </div>
  );
}
