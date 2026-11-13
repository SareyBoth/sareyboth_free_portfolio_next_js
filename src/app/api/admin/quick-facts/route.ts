import { NextRequest } from "next/server";
import { prisma } from "@/server/prisma-client";
import { requireSession } from "@/server/permissions";
import { logAuditEvent } from "@/server/audit";
import { apiSuccess, handleApiError, ConflictError } from "@/server/api-handler";


export async function GET(req: NextRequest) {
  try {
    await requireSession(req.headers);
    const items = await prisma.quickFact.findMany({
      orderBy: { displayOrder: "asc" },
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

    const maxOrder = await prisma.quickFact.aggregate({
      _max: { displayOrder: true },
    });
    const nextOrder = (maxOrder._max.displayOrder ?? -1) + 1;

    const item = await prisma.quickFact.create({
      data: {
        label: body.label || "Fact",
        value: body.value || "",
        displayOrder: body.displayOrder ?? nextOrder,
        enabled: body.enabled !== undefined ? Boolean(body.enabled) : true,
        version: 1,
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "create",
      entityType: "quick_fact",
      entityId: item.id,
      details: { label: item.label, value: item.value },
    });

    return apiSuccess({ item }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
