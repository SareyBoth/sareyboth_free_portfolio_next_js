import { NextRequest } from "next/server";
import { prisma } from "@/server/prisma-client";
import { requireSession } from "@/server/permissions";
import { logAuditEvent } from "@/server/audit";
import { apiSuccess, handleApiError } from "@/server/api-handler";


export async function GET(req: NextRequest) {
  try {
    await requireSession(req.headers);
    const categories = await prisma.highlightCategory.findMany({
      orderBy: { displayOrder: "asc" },
      include: {
        _count: { select: { highlights: true } },
      },
    });
    return apiSuccess({ categories });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireSession(req.headers);
    const body = await req.json();

    const name = (body.name || "General").trim();
    const slug = (body.slug || name).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");

    const maxOrder = await prisma.highlightCategory.aggregate({
      _max: { displayOrder: true },
    });
    const nextOrder = (maxOrder._max.displayOrder ?? -1) + 1;

    const category = await prisma.highlightCategory.create({
      data: {
        name,
        slug,
        description: body.description ?? null,
        displayOrder: body.displayOrder ?? nextOrder,
        version: 1,
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "create",
      entityType: "highlight_category",
      entityId: category.id,
      details: { name: category.name, slug: category.slug },
    });

    return apiSuccess({ category }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
