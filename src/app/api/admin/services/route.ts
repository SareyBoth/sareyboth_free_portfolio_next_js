import { NextRequest } from "next/server";
import { prisma } from "@/server/prisma-client";
import { requireSession } from "@/server/permissions";
import { logAuditEvent } from "@/server/audit";
import { apiSuccess, handleApiError } from "@/server/api-handler";


export async function GET(req: NextRequest) {
  try {
    await requireSession(req.headers);
    const items = await prisma.service.findMany({
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

    const id = (body.id || body.title || "service")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const maxOrder = await prisma.service.aggregate({
      _max: { displayOrder: true },
    });
    const nextOrder = (maxOrder._max.displayOrder ?? -1) + 1;

    const item = await prisma.service.create({
      data: {
        id,
        title: body.title || "Untitled Service",
        description: body.description || "",
        deliverables: body.deliverables ?? [],
        ctaLabel: body.ctaLabel ?? "Inquire About This Service",
        ctaTarget: body.ctaTarget ?? "#contact",
        iconKey: body.iconKey ?? null,
        displayOrder: body.displayOrder ?? nextOrder,
        version: 1,
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "create",
      entityType: "service",
      entityId: item.id,
      details: { title: item.title },
    });

    return apiSuccess({ item }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
