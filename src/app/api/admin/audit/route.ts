import { NextRequest } from "next/server";
import { prisma } from "@/server/prisma-client";
import { requireRole } from "@/server/permissions";
import { apiSuccess, handleApiError } from "@/server/api-handler";


export async function GET(req: NextRequest) {
  try {
    await requireRole("OWNER", req.headers);
    const { searchParams } = new URL(req.url);

    const action = searchParams.get("action") || "";
    const entityType = searchParams.get("entityType") || "";
    const actorEmail = searchParams.get("actorEmail") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "25", 10)));

    const where: any = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (actorEmail) where.actorEmail = { contains: actorEmail, mode: "insensitive" };

    const [total, items] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return apiSuccess({
      items,
      pagination: { page, pageSize, total },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
