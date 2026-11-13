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
    const section = await prisma.section.findUnique({ where: { id } });
    if (!section) return handleApiError(new Error("Section not found"));
    return apiSuccess({ section });
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

    const existing = await prisma.section.findUnique({ where: { id } });
    if (!existing) return handleApiError(new Error("Section not found"));

    if (body.version !== undefined && body.version !== existing.version) {
      throw new ConflictError("Section was modified by another session. Please reload.");
    }

    const updated = await prisma.section.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title : existing.title,
        subtitle: body.subtitle !== undefined ? body.subtitle : existing.subtitle,
        navLabel: body.navLabel !== undefined ? body.navLabel : existing.navLabel,
        enabled: body.enabled !== undefined ? Boolean(body.enabled) : existing.enabled,
        displayOrder: body.displayOrder !== undefined ? body.displayOrder : existing.displayOrder,
        options: body.options !== undefined ? body.options : existing.options,
        version: { increment: 1 },
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "update",
      entityType: "section",
      entityId: id,
      details: { enabled: updated.enabled, title: updated.title },
    });

    return apiSuccess({ section: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
