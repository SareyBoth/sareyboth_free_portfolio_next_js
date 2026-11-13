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
    const item = await prisma.service.findUnique({ where: { id } });
    if (!item) return handleApiError(new Error("Service not found"));
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

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) return handleApiError(new Error("Service not found"));

    if (body.version !== undefined && body.version !== existing.version) {
      throw new ConflictError("Service was modified by another session. Please reload.");
    }

    const updated = await prisma.service.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title : existing.title,
        description: body.description !== undefined ? body.description : existing.description,
        deliverables: body.deliverables !== undefined ? body.deliverables : existing.deliverables,
        ctaLabel: body.ctaLabel !== undefined ? body.ctaLabel : existing.ctaLabel,
        ctaTarget: body.ctaTarget !== undefined ? body.ctaTarget : existing.ctaTarget,
        iconKey: body.iconKey !== undefined ? body.iconKey : existing.iconKey,
        displayOrder: body.displayOrder !== undefined ? body.displayOrder : existing.displayOrder,
        version: { increment: 1 },
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "update",
      entityType: "service",
      entityId: id,
      details: { title: updated.title, version: updated.version },
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

    await prisma.service.delete({ where: { id } });
    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "delete",
      entityType: "service",
      entityId: id,
    });

    return apiSuccess({ message: "Service deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
