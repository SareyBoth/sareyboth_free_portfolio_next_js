import { NextRequest } from "next/server";
import { prisma } from "@/server/prisma-client";
import { requireSession } from "@/server/permissions";
import { logAuditEvent } from "@/server/audit";
import { apiSuccess, handleApiError, ConflictError } from "@/server/api-handler";


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession(req.headers);
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

    return apiSuccess({
      article: {
        ...article,
        tags: article.tags.map((t) => t.tag.name),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireSession(req.headers);
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.article.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!existing) {
      return handleApiError(new Error("Article not found"));
    }

    if (body.version !== undefined && body.version !== existing.version) {
      throw new ConflictError("This article was modified by another session. Please reload.");
    }

    const updated = await prisma.article.update({
      where: { id: existing.id },
      data: {
        slug: body.slug ? body.slug.toLowerCase().trim() : existing.slug,
        title: body.title !== undefined ? body.title : existing.title,
        summary: body.summary !== undefined ? body.summary : existing.summary,
        date: body.date !== undefined ? body.date : existing.date,
        readingTime: body.readingTime !== undefined ? body.readingTime : existing.readingTime,
        coverImage: body.coverImage !== undefined ? body.coverImage : existing.coverImage,
        body: body.body !== undefined ? body.body : existing.body,
        displayOrder: body.displayOrder !== undefined ? body.displayOrder : existing.displayOrder,
        version: { increment: 1 },
      },
      include: {
        tags: { include: { tag: true } },
      },
    });

    if (Array.isArray(body.tags)) {
      await prisma.articleTag.deleteMany({ where: { articleId: existing.id } });
      for (const tagName of body.tags) {
        const trimmed = tagName.trim();
        if (!trimmed) continue;
        const tagSlug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const tag = await prisma.tag.upsert({
          where: { name: trimmed },
          update: {},
          create: { name: trimmed, slug: tagSlug },
        });
        await prisma.articleTag.create({
          data: { articleId: existing.id, tagId: tag.id },
        }).catch(() => {});
      }
    }

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "update",
      entityType: "article",
      entityId: existing.id,
      details: { title: updated.title, version: updated.version },
    });

    return apiSuccess({ article: updated });
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

    const existing = await prisma.article.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!existing) {
      return handleApiError(new Error("Article not found"));
    }

    if (existing.archivedAt === null) {
      await prisma.article.update({
        where: { id: existing.id },
        data: { archivedAt: new Date(), published: false },
      });
      await logAuditEvent({
        actorId: user.id,
        actorEmail: user.email,
        action: "archive",
        entityType: "article",
        entityId: existing.id,
      });
      return apiSuccess({ message: "Article archived successfully", archived: true });
    } else {
      await prisma.article.delete({ where: { id: existing.id } });
      await logAuditEvent({
        actorId: user.id,
        actorEmail: user.email,
        action: "delete",
        entityType: "article",
        entityId: existing.id,
      });
      return apiSuccess({ message: "Article permanently deleted" });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
