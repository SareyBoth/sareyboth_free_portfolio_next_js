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
    const item = await prisma.journeyEntry.findUnique({ where: { id } });
    if (!item) return handleApiError(new Error("Journey entry not found"));
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

    const existing = await prisma.journeyEntry.findUnique({ where: { id } });
    if (!existing) return handleApiError(new Error("Journey entry not found"));

    if (body.version !== undefined && body.version !== existing.version) {
      throw new ConflictError("Journey entry was modified by another session. Please reload.");
    }

    const updated = await prisma.journeyEntry.update({
      where: { id },
      data: {
        type: body.type !== undefined ? body.type : existing.type,
        title: body.title !== undefined ? body.title : existing.title,
        organization: body.organization !== undefined ? body.organization : existing.organization,
        location: body.location !== undefined ? body.location : existing.location,
        startDate: body.startDate !== undefined ? body.startDate : existing.startDate,
        endDate: body.endDate !== undefined ? body.endDate : existing.endDate,
        description: body.description !== undefined ? body.description : existing.description,
        highlights: body.highlights !== undefined ? body.highlights : existing.highlights,
        displayOrder: body.displayOrder !== undefined ? body.displayOrder : existing.displayOrder,
        version: { increment: 1 },
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "update",
      entityType: "journey_entry",
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

    await prisma.journeyEntry.delete({ where: { id } });
    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "delete",
      entityType: "journey_entry",
      entityId: id,
    });

    return apiSuccess({ message: "Journey entry deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
