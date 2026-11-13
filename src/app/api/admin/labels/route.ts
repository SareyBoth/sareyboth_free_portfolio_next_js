import { NextRequest } from "next/server";
import { prisma } from "@/server/prisma-client";
import { requireSession } from "@/server/permissions";
import { logAuditEvent } from "@/server/audit";
import { apiSuccess, handleApiError, ConflictError } from "@/server/api-handler";


export async function GET(req: NextRequest) {
  try {
    await requireSession(req.headers);
    const labels = await prisma.labelsSettings.findUnique({
      where: { id: "singleton" },
    });
    return apiSuccess({ labels });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user } = await requireSession(req.headers);
    const body = await req.json();

    const existing = await prisma.labelsSettings.findUnique({
      where: { id: "singleton" },
    });

    if (existing && body.version !== undefined && body.version !== existing.version) {
      throw new ConflictError("Labels were modified by another session. Please reload.");
    }

    const updated = await prisma.labelsSettings.upsert({
      where: { id: "singleton" },
      update: {
        exploreHighlightsCta: body.exploreHighlightsCta,
        contactCta: body.contactCta,
        downloadResumeCta: body.downloadResumeCta,
        allCategoriesFilter: body.allCategoriesFilter,
        emptyHighlightsText: body.emptyHighlightsText,
        emptyArticlesText: body.emptyArticlesText,
        sampleTestimonialsNotice: body.sampleTestimonialsNotice,
        version: { increment: 1 },
      },
      create: {
        id: "singleton",
        exploreHighlightsCta: body.exploreHighlightsCta ?? "Explore My Highlights",
        contactCta: body.contactCta ?? "Contact Me",
        downloadResumeCta: body.downloadResumeCta ?? "Download Resume (PDF)",
        allCategoriesFilter: body.allCategoriesFilter ?? "All",
        emptyHighlightsText: body.emptyHighlightsText ?? "No highlights match this category yet.",
        emptyArticlesText: body.emptyArticlesText ?? "No journal entries are published right now.",
        sampleTestimonialsNotice: body.sampleTestimonialsNotice ?? "Sample testimonials...",
        version: 1,
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "update",
      entityType: "labels_settings",
      entityId: "singleton",
      details: { version: updated.version },
    });

    return apiSuccess({ labels: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
