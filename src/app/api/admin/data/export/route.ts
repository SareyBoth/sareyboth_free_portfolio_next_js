import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/permissions";
import { exportPortfolioData } from "@/server/services/data-transfer";
import { logAuditEvent } from "@/server/audit";
import { handleApiError } from "@/server/api-handler";


export async function GET(req: NextRequest) {
  try {
    const { user } = await requireRole("OWNER", req.headers);

    const config = await exportPortfolioData();

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "export",
      entityType: "portfolio_config",
      details: {
        highlightsCount: config.highlights.length,
        articlesCount: config.articles.length,
      },
    });

    const jsonString = JSON.stringify(config, null, 2);
    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="portfolio.json"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
