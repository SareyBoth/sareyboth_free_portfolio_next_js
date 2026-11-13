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
    const item = await prisma.strengthItem.findUnique({
      where: { id },
      include: { group: true },
    });
    if (!item) return handleApiError(new Error("Strength item not found"));
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

    const existing = await prisma.strengthItem.findUnique({ where: { id } });
    if (!existing) return handleApiError(new Error("Strength item not found"));

    if (body.version !== undefined && body.version !== existing.version) {
      throw new ConflictError("Strength item was modified by another session. Please reload.");
    }

    const updated = await prisma.strengthItem.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : existing.name,
        description: body.description !== undefined ? body.description : existing.description,
        groupId: body.groupId !== undefined ? body.groupId : existing.groupId,
        enabled: body.enabled !== undefined ? Boolean(body.enabled) : existing.enabled,
        displayOrder: body.displayOrder !== undefined ? body.displayOrder : existing.displayOrder,
        version: { increment: 1 },
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "update",
      entityType: "strength_item",
      entityId: id,
      details: { name: updated.name, version: updated.version },
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

    await prisma.strengthItem.delete({ where: { id } });
    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "delete",
      entityType: "strength_item",
      entityId: id,
    });

    return apiSuccess({ message: "Strength item deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
