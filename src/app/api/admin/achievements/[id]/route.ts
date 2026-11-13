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
    const item = await prisma.achievement.findUnique({ where: { id } });
    if (!item) return handleApiError(new Error("Achievement not found"));
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

    const existing = await prisma.achievement.findUnique({ where: { id } });
    if (!existing) return handleApiError(new Error("Achievement not found"));

    if (body.version !== undefined && body.version !== existing.version) {
      throw new ConflictError("Achievement was modified by another session. Please reload.");
    }

    const updated = await prisma.achievement.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title : existing.title,
        issuer: body.issuer !== undefined ? body.issuer : existing.issuer,
        date: body.date !== undefined ? body.date : existing.date,
        datePrecision: body.datePrecision !== undefined ? body.datePrecision : existing.datePrecision,
        description: body.description !== undefined ? body.description : existing.description,
        image: body.image !== undefined ? body.image : existing.image,
        verificationUrl: body.verificationUrl !== undefined ? body.verificationUrl : existing.verificationUrl,
        displayOrder: body.displayOrder !== undefined ? body.displayOrder : existing.displayOrder,
        version: { increment: 1 },
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "update",
      entityType: "achievement",
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

    await prisma.achievement.delete({ where: { id } });
    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "delete",
      entityType: "achievement",
      entityId: id,
    });

    return apiSuccess({ message: "Achievement deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
