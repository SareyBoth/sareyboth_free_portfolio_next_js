import { NextRequest } from "next/server";
import { prisma } from "@/server/prisma-client";
import { requireSession } from "@/server/permissions";
import { logAuditEvent } from "@/server/audit";
import { apiSuccess, handleApiError } from "@/server/api-handler";


export async function GET(req: NextRequest) {
  try {
    await requireSession(req.headers);
    const items = await prisma.galleryItem.findMany({
      orderBy: { displayOrder: "asc" },
    });
    return apiSuccess({ items });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireSession(req.headers);
    const body = await req.json();

    const id = (body.id || body.title || "gallery-item")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const maxOrder = await prisma.galleryItem.aggregate({
      _max: { displayOrder: true },
    });
    const nextOrder = (maxOrder._max.displayOrder ?? -1) + 1;

    const item = await prisma.galleryItem.create({
      data: {
        id,
        title: body.title || "Untitled Gallery Item",
        caption: body.caption || "",
        date: body.date ?? null,
        image: body.image ?? { src: "/images/placeholder.jpg", alt: "Gallery image" },
        displayOrder: body.displayOrder ?? nextOrder,
        version: 1,
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "create",
      entityType: "gallery_item",
      entityId: item.id,
      details: { title: item.title },
    });

    return apiSuccess({ item }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
