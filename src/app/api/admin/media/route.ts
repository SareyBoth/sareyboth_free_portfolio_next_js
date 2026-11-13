import { NextRequest } from "next/server";
import { prisma } from "@/server/prisma-client";
import { requireSession } from "@/server/permissions";
import { apiSuccess, handleApiError } from "@/server/api-handler";


export async function GET(req: NextRequest) {
  try {
    await requireSession(req.headers);
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const type = searchParams.get("type"); // "image" | "document"

    const where: any = {};
    if (search) {
      where.OR = [
        { originalFilename: { contains: search, mode: "insensitive" } },
        { altText: { contains: search, mode: "insensitive" } },
      ];
    }

    if (type === "image") {
      where.mimeType = { startsWith: "image/" };
    } else if (type === "document") {
      where.mimeType = { not: { startsWith: "image/" } };
    }

    const assets = await prisma.mediaAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({
      items: assets.map((a) => ({
        id: a.id,
        url: a.storageKey.startsWith("/") ? a.storageKey : `/images/uploads/${a.storageKey}`,
        filename: a.originalFilename,
        alt: a.altText,
        mimeType: a.mimeType,
        sizeBytes: a.byteSize,
        width: a.width,
        height: a.height,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
