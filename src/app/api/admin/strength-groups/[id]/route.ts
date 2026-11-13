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
    const group = await prisma.strengthGroup.findUnique({
      where: { id },
      include: { items: { orderBy: { displayOrder: "asc" } } },
    });
    if (!group) return handleApiError(new Error("Strength group not found"));
    return apiSuccess({ group });
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

    const existing = await prisma.strengthGroup.findUnique({ where: { id } });
    if (!existing) return handleApiError(new Error("Strength group not found"));

    if (body.version !== undefined && body.version !== existing.version) {
      throw new ConflictError("Strength group was modified by another session. Please reload.");
    }

    const updated = await prisma.strengthGroup.update({
      where: { id },
      data: {
        category: body.category !== undefined ? body.category : existing.category,
        description: body.description !== undefined ? body.description : existing.description,
        enabled: body.enabled !== undefined ? Boolean(body.enabled) : existing.enabled,
        displayOrder: body.displayOrder !== undefined ? body.displayOrder : existing.displayOrder,
        version: { increment: 1 },
      },
      include: { items: { orderBy: { displayOrder: "asc" } } },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "update",
      entityType: "strength_group",
      entityId: id,
      details: { category: updated.category, version: updated.version },
    });

    return apiSuccess({ group: updated });
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

    await prisma.strengthGroup.delete({ where: { id } });
    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "delete",
      entityType: "strength_group",
      entityId: id,
    });

    return apiSuccess({ message: "Strength group deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
