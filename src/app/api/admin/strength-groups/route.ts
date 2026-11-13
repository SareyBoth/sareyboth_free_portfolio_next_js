import { NextRequest } from "next/server";
import { prisma } from "@/server/prisma-client";
import { requireSession } from "@/server/permissions";
import { logAuditEvent } from "@/server/audit";
import { apiSuccess, handleApiError } from "@/server/api-handler";


export async function GET(req: NextRequest) {
  try {
    await requireSession(req.headers);
    const groups = await prisma.strengthGroup.findMany({
      orderBy: { displayOrder: "asc" },
      include: {
        items: { orderBy: { displayOrder: "asc" } },
      },
    });
    return apiSuccess({ groups });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireSession(req.headers);
    const body = await req.json();

    const id = (body.id || body.category || "strength-group")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const maxOrder = await prisma.strengthGroup.aggregate({
      _max: { displayOrder: true },
    });
    const nextOrder = (maxOrder._max.displayOrder ?? -1) + 1;

    const group = await prisma.strengthGroup.create({
      data: {
        id,
        category: body.category || "Skill Category",
        description: body.description ?? null,
        displayOrder: body.displayOrder ?? nextOrder,
        enabled: body.enabled !== undefined ? Boolean(body.enabled) : true,
        version: 1,
      },
      include: { items: true },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "create",
      entityType: "strength_group",
      entityId: group.id,
      details: { category: group.category },
    });

    return apiSuccess({ group }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
