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

    const highlight = await prisma.highlight.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    });

    if (!highlight) {
      return handleApiError(new Error("Highlight not found"));
    }

    return apiSuccess({
      highlight: {
        ...highlight,
        categoryName: highlight.category?.name ?? "General",
        tags: highlight.tags.map((t) => t.tag.name),
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

    const existing = await prisma.highlight.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!existing) {
      return handleApiError(new Error("Highlight not found"));
    }

    if (body.version !== undefined && body.version !== existing.version) {
      throw new ConflictError("This highlight was modified by another session. Please reload.");
    }

    let categoryId = body.categoryId !== undefined ? body.categoryId : existing.categoryId;
    if (body.category && !body.categoryId) {
      const cat = await prisma.highlightCategory.findFirst({
        where: { OR: [{ name: body.category }, { slug: body.category }] },
      });
      if (cat) categoryId = cat.id;
    }

    const updated = await prisma.highlight.update({
      where: { id: existing.id },
      data: {
        slug: body.slug ? body.slug.toLowerCase().trim() : existing.slug,
        title: body.title !== undefined ? body.title : existing.title,
        summary: body.summary !== undefined ? body.summary : existing.summary,
        categoryId,
        roleOrContribution: body.roleOrContribution !== undefined ? body.roleOrContribution : existing.roleOrContribution,
        context: body.context !== undefined ? body.context : existing.context,
        outcomes: body.outcomes !== undefined ? body.outcomes : existing.outcomes,
        date: body.date !== undefined ? body.date : existing.date,
        featured: body.featured !== undefined ? Boolean(body.featured) : existing.featured,
        displayOrder: body.displayOrder !== undefined ? body.displayOrder : existing.displayOrder,
        coverImage: body.coverImage !== undefined ? body.coverImage : existing.coverImage,
        gallery: body.gallery !== undefined ? body.gallery : existing.gallery,
        externalLinks: body.externalLinks !== undefined ? body.externalLinks : existing.externalLinks,
        relatedSlugs: body.relatedSlugs !== undefined ? body.relatedSlugs : existing.relatedSlugs,
        body: body.body !== undefined ? body.body : existing.body,
        version: { increment: 1 },
      },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    });

    // Update tags if provided
    if (Array.isArray(body.tags)) {
      await prisma.highlightTag.deleteMany({ where: { highlightId: existing.id } });
      for (const tagName of body.tags) {
        const trimmed = tagName.trim();
        if (!trimmed) continue;
        const tagSlug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const tag = await prisma.tag.upsert({
          where: { name: trimmed },
          update: {},
          create: { name: trimmed, slug: tagSlug },
        });
        await prisma.highlightTag.create({
          data: { highlightId: existing.id, tagId: tag.id },
        }).catch(() => {});
      }
    }

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "update",
      entityType: "highlight",
      entityId: existing.id,
      details: { title: updated.title, version: updated.version },
    });

    return apiSuccess({ highlight: updated });
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

    const existing = await prisma.highlight.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!existing) {
      return handleApiError(new Error("Highlight not found"));
    }

    if (existing.archivedAt === null) {
      // Soft-delete: archive
      await prisma.highlight.update({
        where: { id: existing.id },
        data: { archivedAt: new Date(), published: false },
      });
      await logAuditEvent({
        actorId: user.id,
        actorEmail: user.email,
        action: "archive",
        entityType: "highlight",
        entityId: existing.id,
      });
      return apiSuccess({ message: "Highlight archived successfully", archived: true });
    } else {
      // Permanent delete
      await prisma.highlight.delete({ where: { id: existing.id } });
      await logAuditEvent({
        actorId: user.id,
        actorEmail: user.email,
        action: "delete",
        entityType: "highlight",
        entityId: existing.id,
      });
      return apiSuccess({ message: "Highlight permanently deleted" });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
