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

    const article = await prisma.article.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        tags: { include: { tag: true } },
      },
    });

    if (!article) {
      return handleApiError(new Error("Article not found"));
    }

    if (!article.title.trim() || !article.summary.trim()) {
      return handleApiError(new Error("Cannot publish article: Title and Summary are required."));
    }

    const publishedSnapshot = {
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      date: article.date,
      readingTime: article.readingTime,
      tags: article.tags.map((t) => t.tag.name),
      coverImage: article.coverImage,
      body: article.body,
    };

    const updated = await prisma.article.update({
      where: { id: article.id },
      data: {
        published: true,
        publishedAt: new Date(),
        archivedAt: null,
        publishedSnapshot,
        version: { increment: 1 },
      },
      include: {
        tags: { include: { tag: true } },
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "publish",
      entityType: "article",
      entityId: article.id,
      details: { title: article.title, slug: article.slug },
    });

    return apiSuccess({ article: updated, message: "Article published successfully" });
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

    const article = await prisma.article.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!article) {
      return handleApiError(new Error("Article not found"));
    }

    const updated = await prisma.article.update({
      where: { id: article.id },
      data: {
        published: false,
        version: { increment: 1 },
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "unpublish",
      entityType: "article",
      entityId: article.id,
      details: { title: article.title },
    });

    return apiSuccess({ article: updated, message: "Article unpublished" });
  } catch (error) {
    return handleApiError(error);
  }
}
