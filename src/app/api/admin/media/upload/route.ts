import { NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { prisma } from "@/server/prisma-client";
import { requireSession } from "@/server/permissions";
import { logAuditEvent } from "@/server/audit";
import { apiSuccess, handleApiError } from "@/server/api-handler";


const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireSession(req.headers);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const altText = (formData.get("alt") as string) || "";

    if (!file) {
      return handleApiError(new Error("No file uploaded"));
    }

    if (file.size > MAX_FILE_SIZE) {
      return handleApiError(new Error("File exceeds maximum allowed size of 10MB"));
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return handleApiError(
        new Error(`Unsupported file type: ${file.type}. Allowed: JPEG, PNG, WebP, GIF, SVG, PDF`)
      );
    }

    const cleanFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueId = crypto.randomBytes(6).toString("hex");
    const storageKey = `${Date.now()}-${uniqueId}-${cleanFilename}`;

    const uploadDir = path.join(process.cwd(), "public", "images", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, storageKey);
    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(arrayBuffer));

    const publicUrl = `/images/uploads/${storageKey}`;

    const asset = await prisma.mediaAsset.create({
      data: {
        storageKey,
        originalFilename: file.name,
        mimeType: file.type,
        byteSize: file.size,
        altText: altText.trim() || file.name.replace(/\.[^/.]+$/, ""),
        uploaderId: user.id,
        isPublic: true,
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "upload",
      entityType: "media_asset",
      entityId: asset.id,
      details: { filename: file.name, size: file.size, mimeType: file.type },
    });

    return apiSuccess({
      id: asset.id,
      url: publicUrl,
      filename: asset.originalFilename,
      alt: asset.altText,
      mimeType: asset.mimeType,
      sizeBytes: asset.byteSize,
      createdAt: asset.createdAt,
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
