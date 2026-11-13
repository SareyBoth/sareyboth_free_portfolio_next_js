import { NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/server/prisma-client";
import { requireSession } from "@/server/permissions";
import { logAuditEvent } from "@/server/audit";
import { apiSuccess, handleApiError } from "@/server/api-handler";


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession(req.headers);
    const { id } = await params;

    const asset = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) return handleApiError(new Error("Media asset not found"));

    return apiSuccess({
      asset: {
        ...asset,
        url: asset.storageKey.startsWith("/") ? asset.storageKey : `/images/uploads/${asset.storageKey}`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireSession(req.headers);
    const { id } = await params;

    const asset = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) return handleApiError(new Error("Media asset not found"));

    // Attempt to delete file from disk if local upload
    if (!asset.storageKey.startsWith("/") && !asset.storageKey.startsWith("http")) {
      const filePath = path.join(process.cwd(), "public", "images", "uploads", asset.storageKey);
      await fs.unlink(filePath).catch(() => {});
    }

    await prisma.mediaAsset.delete({ where: { id } });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "delete",
      entityType: "media_asset",
      entityId: id,
      details: { filename: asset.originalFilename },
    });

    return apiSuccess({ message: "Media asset deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
