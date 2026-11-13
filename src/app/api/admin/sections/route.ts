import { NextRequest } from "next/server";
import { prisma } from "@/server/prisma-client";
import { requireSession } from "@/server/permissions";
import { logAuditEvent } from "@/server/audit";
import { apiSuccess, handleApiError } from "@/server/api-handler";


export async function GET(req: NextRequest) {
  try {
    await requireSession(req.headers);
    const sections = await prisma.section.findMany({
      orderBy: { displayOrder: "asc" },
    });
    return apiSuccess({ sections });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user } = await requireSession(req.headers);
    const body = await req.json();

    // Support array of sections for bulk reorder
    if (Array.isArray(body.sections)) {
      const updates = body.sections.map((sec: any, index: number) =>
        prisma.section.update({
          where: { id: sec.id },
          data: {
            displayOrder: sec.displayOrder ?? index,
            enabled: sec.enabled !== undefined ? Boolean(sec.enabled) : undefined,
            title: sec.title !== undefined ? sec.title : undefined,
            subtitle: sec.subtitle !== undefined ? sec.subtitle : undefined,
            navLabel: sec.navLabel !== undefined ? sec.navLabel : undefined,
            version: { increment: 1 },
          },
        })
      );
      await prisma.$transaction(updates);

      await logAuditEvent({
        actorId: user.id,
        actorEmail: user.email,
        action: "reorder",
        entityType: "sections",
        details: { count: body.sections.length },
      });

      const updated = await prisma.section.findMany({
        orderBy: { displayOrder: "asc" },
      });
      return apiSuccess({ sections: updated });
    }

    return handleApiError(new Error("Expected body.sections array"));
  } catch (error) {
    return handleApiError(error);
  }
}
