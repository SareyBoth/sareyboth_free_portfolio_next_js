import { NextRequest } from "next/server";
import { prisma } from "@/server/prisma-client";
import { requireSession } from "@/server/permissions";
import { logAuditEvent } from "@/server/audit";
import { apiSuccess, handleApiError, ConflictError } from "@/server/api-handler";


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession(req.headers);
    const { id } = await params;
    const item = await prisma.socialLink.findUnique({ where: { id } });
    if (!item) return handleApiError(new Error("Social link not found"));
    return apiSuccess({ item });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireSession(req.headers);
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.socialLink.findUnique({ where: { id } });
    if (!existing) return handleApiError(new Error("Social link not found"));

    if (body.version !== undefined && body.version !== existing.version) {
      throw new ConflictError("Social link was modified by another session. Please reload.");
    }

    const updated = await prisma.socialLink.update({
      where: { id },
      data: {
        platform: body.platform !== undefined ? body.platform : existing.platform,
        label: body.label !== undefined ? body.label : existing.label,
        url: body.url !== undefined ? body.url : existing.url,
        enabled: body.enabled !== undefined ? Boolean(body.enabled) : existing.enabled,
        displayOrder: body.displayOrder !== undefined ? body.displayOrder : existing.displayOrder,
        version: { increment: 1 },
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "update",
      entityType: "social_link",
      entityId: id,
      details: { platform: updated.platform, version: updated.version },
    });

    return apiSuccess({ item: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireSession(req.headers);
    const { id } = await params;

    await prisma.socialLink.delete({ where: { id } });
    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "delete",
      entityType: "social_link",
      entityId: id,
    });

    return apiSuccess({ message: "Social link deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
