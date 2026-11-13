import { NextRequest } from "next/server";
import { requireRole } from "@/server/permissions";
import { validateImportData, executeImportData } from "@/server/services/data-transfer";
import { apiSuccess, handleApiError } from "@/server/api-handler";


export async function POST(req: NextRequest) {
  try {
    const { user } = await requireRole("OWNER", req.headers);
    const { searchParams } = new URL(req.url);
    const isDryRun = searchParams.get("dryRun") === "true";

    const body = await req.json();
    const rawData = body.config || body;

    const validation = validateImportData(rawData);
    if (!validation.valid || !validation.data) {
      return handleApiError(new Error(`Import validation failed: ${validation.error}`));
    }

    if (isDryRun) {
      return apiSuccess({
        dryRun: true,
        valid: true,
        summary: validation.summary,
        message: "Configuration is valid and ready to import.",
      });
    }

    const { counts } = await executeImportData(validation.data, user.id, user.email);

    return apiSuccess({
      success: true,
      counts,
      message: "Portfolio data successfully imported into database.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
