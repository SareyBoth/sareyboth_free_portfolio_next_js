import { NextRequest } from "next/server";
import { prisma } from "@/server/prisma-client";
import { requireSession, requireRole } from "@/server/permissions";
import { logAuditEvent } from "@/server/audit";
import { apiSuccess, handleApiError, ConflictError } from "@/server/api-handler";


export async function GET(req: NextRequest) {
  try {
    await requireSession(req.headers);
    const presentation = await prisma.presentationSettings.findUnique({
      where: { id: "singleton" },
    });
    return apiSuccess({ presentation });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user } = await requireSession(req.headers);
    const body = await req.json();

    const existing = await prisma.presentationSettings.findUnique({
      where: { id: "singleton" },
    });

    if (existing && body.version !== undefined && body.version !== existing.version) {
      throw new ConflictError("Appearance settings were modified by another session. Please reload.");
    }

    const isPublishing = Boolean(body.publish);
    if (isPublishing) {
      // Publishing requires OWNER role
      await requireRole("OWNER", req.headers);
    }

    const currentValues = {
      defaultPreset: body.defaultPreset ?? existing?.defaultPreset ?? "minimal",
      defaultMode: body.defaultMode ?? existing?.defaultMode ?? "system",
      fontPreset: body.fontPreset ?? existing?.fontPreset ?? "sans",
      density: body.density ?? existing?.density ?? "comfortable",
      radius: body.radius ?? existing?.radius ?? "subtle",
    };

    const updateData: any = {
      ...currentValues,
      version: { increment: 1 },
    };

    if (isPublishing) {
      updateData.publishedSnapshot = currentValues;
      updateData.publishedAt = new Date();
    }

    const updated = await prisma.presentationSettings.upsert({
      where: { id: "singleton" },
      update: updateData,
      create: {
        id: "singleton",
        ...currentValues,
        publishedSnapshot: isPublishing ? currentValues : undefined,
        publishedAt: isPublishing ? new Date() : null,
        version: 1,
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: isPublishing ? "publish" : "update",
      entityType: "presentation_settings",
      entityId: "singleton",
      details: { ...currentValues, isPublishing },
    });

    return apiSuccess({ presentation: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
