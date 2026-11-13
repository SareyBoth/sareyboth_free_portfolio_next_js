import { NextRequest } from "next/server";
import { prisma } from "@/server/prisma-client";
import { requireSession } from "@/server/permissions";
import { logAuditEvent } from "@/server/audit";
import { apiSuccess, handleApiError } from "@/server/api-handler";


export async function GET(req: NextRequest) {
  try {
    await requireSession(req.headers);
    const items = await prisma.journeyEntry.findMany({
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

    const id = (body.id || body.title || "journey-entry")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const maxOrder = await prisma.journeyEntry.aggregate({
      _max: { displayOrder: true },
    });
    const nextOrder = (maxOrder._max.displayOrder ?? -1) + 1;

    const entry = await prisma.journeyEntry.create({
      data: {
        id,
        type: body.type || "employment",
        title: body.title || "Untitled Role",
        organization: body.organization ?? null,
        location: body.location ?? null,
        startDate: body.startDate || "2024",
        endDate: body.endDate ?? null,
        description: body.description || "",
        highlights: body.highlights ?? [],
        displayOrder: body.displayOrder ?? nextOrder,
        version: 1,
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "create",
      entityType: "journey_entry",
      entityId: entry.id,
      details: { title: entry.title, type: entry.type },
    });

    return apiSuccess({ item: entry }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
