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
    const item = await prisma.testimonial.findUnique({ where: { id } });
    if (!item) return handleApiError(new Error("Testimonial not found"));
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

    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) return handleApiError(new Error("Testimonial not found"));

    if (body.version !== undefined && body.version !== existing.version) {
      throw new ConflictError("Testimonial was modified by another session. Please reload.");
    }

    const updated = await prisma.testimonial.update({
      where: { id },
      data: {
        quote: body.quote !== undefined ? body.quote : existing.quote,
        name: body.name !== undefined ? body.name : existing.name,
        relationship: body.relationship !== undefined ? body.relationship : existing.relationship,
        avatar: body.avatar !== undefined ? body.avatar : existing.avatar,
        isSample: body.isSample !== undefined ? Boolean(body.isSample) : existing.isSample,
        displayOrder: body.displayOrder !== undefined ? body.displayOrder : existing.displayOrder,
        version: { increment: 1 },
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "update",
      entityType: "testimonial",
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

    await prisma.testimonial.delete({ where: { id } });
    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "delete",
      entityType: "testimonial",
      entityId: id,
    });

    return apiSuccess({ message: "Testimonial deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
