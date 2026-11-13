import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/server/permissions";
import { DashboardShell } from "@/components/admin/DashboardShell";


// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;


export const metadata: Metadata = {
  title: "Dashboard — SareyBothPortfolio CMS",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const reqHeaders = await headers();
  const authContext = await getSession(reqHeaders);

  if (!authContext) {
    redirect("/login?returnTo=/dashboard");
  }

  return (
    <DashboardShell
      user={{
        id: authContext.user.id,
        name: authContext.user.name,
        email: authContext.user.email,
        role: authContext.user.role ?? undefined,
      }}
    >
      {children}
    </DashboardShell>
  );
}
