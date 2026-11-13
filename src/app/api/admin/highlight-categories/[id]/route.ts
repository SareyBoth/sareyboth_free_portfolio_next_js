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
    const category = await prisma.highlightCategory.findUnique({
      where: { id },
      include: { _count: { select: { highlights: true } } },
    });
    if (!category) return handleApiError(new Error("Category not found"));
    return apiSuccess({ category });
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

    const existing = await prisma.highlightCategory.findUnique({ where: { id } });
    if (!existing) return handleApiError(new Error("Category not found"));

    if (body.version !== undefined && body.version !== existing.version) {
      throw new ConflictError("Category was modified by another session. Please reload.");
    }

    const updated = await prisma.highlightCategory.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name.trim() : existing.name,
        slug: body.slug !== undefined ? body.slug.trim() : existing.slug,
        description: body.description !== undefined ? body.description : existing.description,
        displayOrder: body.displayOrder !== undefined ? body.displayOrder : existing.displayOrder,
        version: { increment: 1 },
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "update",
      entityType: "highlight_category",
      entityId: id,
      details: { name: updated.name, version: updated.version },
    });

    return apiSuccess({ category: updated });
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

    await prisma.highlightCategory.delete({ where: { id } });
    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "delete",
      entityType: "highlight_category",
      entityId: id,
    });

    return apiSuccess({ message: "Category deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
