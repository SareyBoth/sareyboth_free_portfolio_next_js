import { NextRequest } from "next/server";
import { prisma } from "@/server/prisma-client";
import { requireSession } from "@/server/permissions";
import { logAuditEvent } from "@/server/audit";
import { apiSuccess, handleApiError, ConflictError } from "@/server/api-handler";


export async function GET(req: NextRequest) {
  try {
    await requireSession(req.headers);
    const footer = await prisma.footerSettings.findUnique({
      where: { id: "singleton" },
    });
    return apiSuccess({ footer });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user } = await requireSession(req.headers);
    const body = await req.json();

    const existing = await prisma.footerSettings.findUnique({
      where: { id: "singleton" },
    });

    if (existing && body.version !== undefined && body.version !== existing.version) {
      throw new ConflictError("Footer settings were modified by another session. Please reload.");
    }

    const updated = await prisma.footerSettings.upsert({
      where: { id: "singleton" },
      update: {
        copyrightNotice: body.copyrightNotice ?? null,
        showSectionsNav: Boolean(body.showSectionsNav),
        showSocialLinks: Boolean(body.showSocialLinks),
        customText: body.customText ?? null,
        version: { increment: 1 },
      },
      create: {
        id: "singleton",
        copyrightNotice: body.copyrightNotice ?? null,
        showSectionsNav: Boolean(body.showSectionsNav),
        showSocialLinks: Boolean(body.showSocialLinks),
        customText: body.customText ?? null,
        version: 1,
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "update",
      entityType: "footer_settings",
      entityId: "singleton",
      details: { showSectionsNav: updated.showSectionsNav },
    });

    return apiSuccess({ footer: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
