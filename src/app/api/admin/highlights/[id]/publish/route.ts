import { NextRequest } from "next/server";
import { prisma } from "@/server/prisma-client";
import { requireRole } from "@/server/permissions";
import { logAuditEvent } from "@/server/audit";
import { apiSuccess, handleApiError } from "@/server/api-handler";


export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireRole("OWNER", req.headers);
    const { id } = await params;

    const highlight = await prisma.highlight.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    });

    if (!highlight) {
      return handleApiError(new Error("Highlight not found"));
    }

    if (!highlight.title.trim() || !highlight.summary.trim()) {
      return handleApiError(new Error("Cannot publish highlight: Title and Summary are required."));
    }

    // Freeze into publishedSnapshot
    const publishedSnapshot = {
      slug: highlight.slug,
      title: highlight.title,
      summary: highlight.summary,
      category: highlight.category?.name ?? "General",
      featured: highlight.featured,
      date: highlight.date ?? undefined,
      roleOrContribution: highlight.roleOrContribution,
      context: highlight.context,
      outcomes: highlight.outcomes,
      tags: highlight.tags.map((t) => t.tag.name),
      coverImage: highlight.coverImage,
      gallery: highlight.gallery,
      externalLinks: highlight.externalLinks,
      relatedSlugs: highlight.relatedSlugs,
      body: highlight.body,
    };

    const updated = await prisma.highlight.update({
      where: { id: highlight.id },
      data: {
        published: true,
        publishedAt: new Date(),
        archivedAt: null,
        publishedSnapshot,
        version: { increment: 1 },
      },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "publish",
      entityType: "highlight",
      entityId: highlight.id,
      details: { title: highlight.title, slug: highlight.slug },
    });

    return apiSuccess({ highlight: updated, message: "Highlight published successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireRole("OWNER", req.headers);
    const { id } = await params;

    const highlight = await prisma.highlight.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!highlight) {
      return handleApiError(new Error("Highlight not found"));
    }

    const updated = await prisma.highlight.update({
      where: { id: highlight.id },
      data: {
        published: false,
        version: { increment: 1 },
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "unpublish",
      entityType: "highlight",
      entityId: highlight.id,
      details: { title: highlight.title },
    });

    return apiSuccess({ highlight: updated, message: "Highlight unpublished" });
  } catch (error) {
    return handleApiError(error);
  }
}
