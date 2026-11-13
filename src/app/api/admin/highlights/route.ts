import { NextRequest } from "next/server";
import { prisma } from "@/server/prisma-client";
import { requireSession } from "@/server/permissions";
import { logAuditEvent } from "@/server/audit";
import { apiSuccess, handleApiError } from "@/server/api-handler";


export async function GET(req: NextRequest) {
  try {
    await requireSession(req.headers);
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";
    const categoryId = searchParams.get("category") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "25", 10)));
    const sort = searchParams.get("sort") || "displayOrder";
    const order = searchParams.get("order") === "desc" ? "desc" : "asc";

    const where: any = {
      archivedAt: status === "archived" ? { not: null } : null,
    };

    if (status === "published") {
      where.published = true;
    } else if (status === "draft") {
      where.published = false;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { summary: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.highlight.count({ where }),
      prisma.highlight.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [sort]: order },
        include: {
          category: true,
          tags: { include: { tag: true } },
        },
      }),
    ]);

    return apiSuccess({
      items: items.map((h) => ({
        ...h,
        categoryName: h.category?.name ?? "General",
        tagNames: h.tags.map((t) => t.tag.name),
      })),
      pagination: {
        page,
        pageSize,
        total,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireSession(req.headers);
    const body = await req.json();

    const slug = (body.slug || body.title || "new-highlight")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Find category ID by name or ID if provided
    let categoryId = body.categoryId || null;
    if (body.category && !categoryId) {
      const cat = await prisma.highlightCategory.findFirst({
        where: {
          OR: [{ name: body.category }, { slug: body.category }],
        },
      });
      if (cat) categoryId = cat.id;
    }

    // Determine next display order
    const maxOrder = await prisma.highlight.aggregate({
      _max: { displayOrder: true },
    });
    const nextOrder = (maxOrder._max.displayOrder ?? -1) + 1;

    const highlight = await prisma.highlight.create({
      data: {
        slug,
        title: body.title || "Untitled Highlight",
        summary: body.summary || "",
        categoryId,
        roleOrContribution: body.roleOrContribution || "",
        context: body.context || "",
        outcomes: body.outcomes ?? [],
        date: body.date || null,
        featured: Boolean(body.featured),
        displayOrder: body.displayOrder ?? nextOrder,
        coverImage: body.coverImage ?? null,
        gallery: body.gallery ?? null,
        externalLinks: body.externalLinks ?? null,
        relatedSlugs: body.relatedSlugs ?? [],
        body: body.body ?? [],
        published: false,
        version: 1,
      },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    });

    // Handle tags if provided
    if (Array.isArray(body.tags) && body.tags.length > 0) {
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
          data: {
            highlightId: highlight.id,
            tagId: tag.id,
          },
        }).catch(() => {});
      }
    }

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "create",
      entityType: "highlight",
      entityId: highlight.id,
      details: { title: highlight.title, slug: highlight.slug },
    });

    return apiSuccess({ highlight }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
