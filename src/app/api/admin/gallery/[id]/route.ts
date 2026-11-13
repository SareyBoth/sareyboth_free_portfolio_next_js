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
    const item = await prisma.galleryItem.findUnique({ where: { id } });
    if (!item) return handleApiError(new Error("Gallery item not found"));
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

    const existing = await prisma.galleryItem.findUnique({ where: { id } });
    if (!existing) return handleApiError(new Error("Gallery item not found"));

    if (body.version !== undefined && body.version !== existing.version) {
      throw new ConflictError("Gallery item was modified by another session. Please reload.");
    }

    const updated = await prisma.galleryItem.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title : existing.title,
        caption: body.caption !== undefined ? body.caption : existing.caption,
        date: body.date !== undefined ? body.date : existing.date,
        image: body.image !== undefined ? body.image : existing.image,
        displayOrder: body.displayOrder !== undefined ? body.displayOrder : existing.displayOrder,
        version: { increment: 1 },
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "update",
      entityType: "gallery_item",
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

    await prisma.galleryItem.delete({ where: { id } });
    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "delete",
      entityType: "gallery_item",
      entityId: id,
    });

    return apiSuccess({ message: "Gallery item deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
