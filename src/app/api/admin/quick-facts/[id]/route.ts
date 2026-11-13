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
    const item = await prisma.quickFact.findUnique({ where: { id } });
    if (!item) return handleApiError(new Error("Quick fact not found"));
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

    const existing = await prisma.quickFact.findUnique({ where: { id } });
    if (!existing) return handleApiError(new Error("Quick fact not found"));

    if (body.version !== undefined && body.version !== existing.version) {
      throw new ConflictError("Quick fact was modified by another session. Please reload.");
    }

    const updated = await prisma.quickFact.update({
      where: { id },
      data: {
        label: body.label !== undefined ? body.label : existing.label,
        value: body.value !== undefined ? body.value : existing.value,
        enabled: body.enabled !== undefined ? Boolean(body.enabled) : existing.enabled,
        displayOrder: body.displayOrder !== undefined ? body.displayOrder : existing.displayOrder,
        version: { increment: 1 },
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "update",
      entityType: "quick_fact",
      entityId: id,
      details: { label: updated.label, version: updated.version },
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

    await prisma.quickFact.delete({ where: { id } });
    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "delete",
      entityType: "quick_fact",
      entityId: id,
    });

    return apiSuccess({ message: "Quick fact deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
