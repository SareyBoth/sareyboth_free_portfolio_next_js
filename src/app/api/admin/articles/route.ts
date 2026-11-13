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

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { summary: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.article.count({ where }),
      prisma.article.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [sort]: order },
        include: {
          tags: { include: { tag: true } },
        },
      }),
    ]);

    return apiSuccess({
      items: items.map((a) => ({
        ...a,
        tagNames: a.tags.map((t) => t.tag.name),
      })),
      pagination: { page, pageSize, total },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireSession(req.headers);
    const body = await req.json();

    const slug = (body.slug || body.title || "new-article")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const maxOrder = await prisma.article.aggregate({
      _max: { displayOrder: true },
    });
    const nextOrder = (maxOrder._max.displayOrder ?? -1) + 1;

    const todayDate = new Date().toISOString().split("T")[0];

    const article = await prisma.article.create({
      data: {
        slug,
        title: body.title || "Untitled Article",
        summary: body.summary || "",
        date: body.date || todayDate,
        readingTime: body.readingTime || "3 min read",
        coverImage: body.coverImage ?? null,
        body: body.body ?? [],
        published: false,
        displayOrder: body.displayOrder ?? nextOrder,
        version: 1,
      },
      include: {
        tags: { include: { tag: true } },
      },
    });

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
        await prisma.articleTag.create({
          data: { articleId: article.id, tagId: tag.id },
        }).catch(() => {});
      }
    }

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "create",
      entityType: "article",
      entityId: article.id,
      details: { title: article.title, slug: article.slug },
    });

    return apiSuccess({ article }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
