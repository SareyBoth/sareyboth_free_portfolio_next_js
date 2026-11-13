import { NextRequest } from "next/server";
import { prisma } from "@/server/prisma-client";
import { requireSession, requireRole } from "@/server/permissions";
import { logAuditEvent } from "@/server/audit";
import { apiSuccess, handleApiError, ConflictError } from "@/server/api-handler";


export async function GET(req: NextRequest) {
  try {
    await requireSession(req.headers);
    const siteSettings = await prisma.siteSettings.findUnique({
      where: { id: "singleton" },
    });
    return apiSuccess({ siteSettings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user } = await requireRole("OWNER", req.headers);
    const body = await req.json();

    const existing = await prisma.siteSettings.findUnique({
      where: { id: "singleton" },
    });

    if (existing && body.version !== undefined && body.version !== existing.version) {
      throw new ConflictError("Site settings were modified by another session. Please reload.");
    }

    const updated = await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      update: {
        title: body.title,
        description: body.description,
        siteUrl: body.siteUrl,
        locale: body.locale,
        indexable: Boolean(body.indexable),
        socialImage: body.socialImage ?? null,
        faviconUrl: body.faviconUrl ?? null,
        version: { increment: 1 },
      },
      create: {
        id: "singleton",
        title: body.title ?? "SareyBoth — SareyBothPortfolio",
        description: body.description ?? "",
        siteUrl: body.siteUrl ?? "https://sareybothportfolio.example.com",
        locale: body.locale ?? "en-US",
        indexable: Boolean(body.indexable),
        socialImage: body.socialImage ?? null,
        faviconUrl: body.faviconUrl ?? null,
        version: 1,
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "update",
      entityType: "site_settings",
      entityId: "singleton",
      details: { title: updated.title, indexable: updated.indexable },
    });

    return apiSuccess({ siteSettings: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
