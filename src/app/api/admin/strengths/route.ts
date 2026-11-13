import { NextRequest } from "next/server";
import { prisma } from "@/server/prisma-client";
import { requireSession } from "@/server/permissions";
import { logAuditEvent } from "@/server/audit";
import { apiSuccess, handleApiError } from "@/server/api-handler";


export async function GET(req: NextRequest) {
  try {
    await requireSession(req.headers);
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");

    const where: any = {};
    if (groupId) where.groupId = groupId;

    const items = await prisma.strengthItem.findMany({
      where,
      orderBy: { displayOrder: "asc" },
      include: { group: true },
    });
    return apiSuccess({ items });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireSession(req.headers);
    const body = await req.json();

    if (!body.groupId) {
      return handleApiError(new Error("groupId is required to create a strength item"));
    }

    const maxOrder = await prisma.strengthItem.aggregate({
      where: { groupId: body.groupId },
      _max: { displayOrder: true },
    });
    const nextOrder = (maxOrder._max.displayOrder ?? -1) + 1;

    const item = await prisma.strengthItem.create({
      data: {
        groupId: body.groupId,
        name: body.name || "Skill",
        description: body.description ?? null,
        displayOrder: body.displayOrder ?? nextOrder,
        enabled: body.enabled !== undefined ? Boolean(body.enabled) : true,
        version: 1,
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "create",
      entityType: "strength_item",
      entityId: item.id,
      details: { name: item.name, groupId: item.groupId },
    });

    return apiSuccess({ item }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
