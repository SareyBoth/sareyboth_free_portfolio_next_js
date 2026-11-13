import { NextRequest } from "next/server";
import { prisma } from "@/server/prisma-client";
import { requireSession } from "@/server/permissions";
import { logAuditEvent } from "@/server/audit";
import { apiSuccess, handleApiError } from "@/server/api-handler";


export async function GET(req: NextRequest) {
  try {
    await requireSession(req.headers);
    const tags = await prisma.tag.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { highlightTags: true, articleTags: true } },
      },
    });
    return apiSuccess({ tags });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireSession(req.headers);
    const body = await req.json();

    const name = (body.name || "").trim();
    if (!name) return handleApiError(new Error("Tag name is required"));
    const slug = (body.slug || name).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");

    const tag = await prisma.tag.create({
      data: { name, slug, version: 1 },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "create",
      entityType: "tag",
      entityId: tag.id,
      details: { name: tag.name },
    });

    return apiSuccess({ tag }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
