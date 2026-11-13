import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/server/permissions";
import { Eye, ArrowLeft, Shield } from "lucide-react";


// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;


export const metadata: Metadata = {
  title: "Preview Mode — SareyBothPortfolio CMS",
  robots: { index: false, follow: false },
};

export default async function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const reqHeaders = await headers();
  const authContext = await getSession(reqHeaders);

  if (!authContext) {
    redirect("/login?returnTo=/preview");
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Persistent Draft Preview Banner */}
      <div className="sticky top-0 z-50 bg-amber-500 text-stone-950 px-4 py-2 text-xs font-semibold shadow-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 shrink-0" />
          <span>
            DRAFT PREVIEW MODE — Live Unpublished Changes. Viewing uncommitted working drafts. This view is private to staff.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="opacity-80 hidden sm:inline">
            Logged in as {authContext.user.email} ({authContext.user.role || "EDITOR"})
          </span>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-stone-950 text-white hover:bg-stone-800 transition-colors shrink-0 font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>

      <div className="flex-1">{children}</div>
    </div>
  );
}
