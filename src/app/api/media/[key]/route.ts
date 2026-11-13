import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/server/prisma-client";
import { getSession } from "@/server/permissions";


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;

    const asset = await prisma.mediaAsset.findFirst({
      where: { storageKey: key },
    });

    if (!asset) {
      return new NextResponse("Not Found", { status: 404 });
    }

    if (!asset.isPublic) {
      const authContext = await getSession(req.headers);
      if (!authContext) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    const filePath = path.join(process.cwd(), "public", "images", "uploads", asset.storageKey);
    const fileBuffer = await fs.readFile(filePath).catch(() => null);

    if (!fileBuffer) {
      return new NextResponse("File missing on server", { status: 404 });
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": asset.mimeType,
        "Content-Length": String(fileBuffer.length),
        "Cache-Control": asset.isPublic
          ? "public, max-age=31536000, immutable"
          : "private, no-cache",
      },
    });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
