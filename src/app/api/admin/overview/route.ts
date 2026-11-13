import { NextRequest } from "next/server";
import { prisma } from "@/server/prisma-client";
import { requireSession } from "@/server/permissions";
import { apiSuccess, handleApiError } from "@/server/api-handler";


export async function GET(req: NextRequest) {
  try {
    await requireSession(req.headers);

    const [
      highlightsTotal,
      highlightsPublished,
      articlesTotal,
      articlesPublished,
      unreadMessages,
      totalMedia,
      totalUsers,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.highlight.count({ where: { archivedAt: null } }),
      prisma.highlight.count({ where: { published: true, archivedAt: null } }),
      prisma.article.count({ where: { archivedAt: null } }),
      prisma.article.count({ where: { published: true, archivedAt: null } }),
      prisma.contactMessage.count({ where: { status: "unread" } }),
      prisma.mediaAsset.count(),
      prisma.user.count(),
      prisma.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return apiSuccess({
      stats: {
        highlights: {
          total: highlightsTotal,
          published: highlightsPublished,
          drafts: highlightsTotal - highlightsPublished,
        },
        articles: {
          total: articlesTotal,
          published: articlesPublished,
          drafts: articlesTotal - articlesPublished,
        },
        unreadMessages,
        totalMedia,
        totalUsers,
      },
      recentActivity: recentAuditLogs,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
