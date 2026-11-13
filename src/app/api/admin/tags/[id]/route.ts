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
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: { _count: { select: { highlightTags: true, articleTags: true } } },
    });
    if (!tag) return handleApiError(new Error("Tag not found"));
    return apiSuccess({ tag });
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

    const existing = await prisma.tag.findUnique({ where: { id } });
    if (!existing) return handleApiError(new Error("Tag not found"));

    if (body.version !== undefined && body.version !== existing.version) {
      throw new ConflictError("Tag was modified by another session. Please reload.");
    }

    const updated = await prisma.tag.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name.trim() : existing.name,
        slug: body.slug !== undefined ? body.slug.trim() : existing.slug,
        version: { increment: 1 },
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "update",
      entityType: "tag",
      entityId: id,
      details: { name: updated.name, version: updated.version },
    });

    return apiSuccess({ tag: updated });
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

    await prisma.tag.delete({ where: { id } });
    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "delete",
      entityType: "tag",
      entityId: id,
    });

    return apiSuccess({ message: "Tag deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
