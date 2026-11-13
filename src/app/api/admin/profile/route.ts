import { NextRequest } from "next/server";
import { prisma } from "@/server/prisma-client";
import { requireSession } from "@/server/permissions";
import { logAuditEvent } from "@/server/audit";
import { apiSuccess, handleApiError, ConflictError } from "@/server/api-handler";


export async function GET(req: NextRequest) {
  try {
    await requireSession(req.headers);
    const profile = await prisma.profile.findUnique({
      where: { id: "singleton" },
    });
    return apiSuccess({ profile });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user } = await requireSession(req.headers);
    const body = await req.json();

    const existing = await prisma.profile.findUnique({
      where: { id: "singleton" },
    });

    if (existing && body.version !== undefined && body.version !== existing.version) {
      throw new ConflictError("Profile was modified by another session. Please reload.");
    }

    const updated = await prisma.profile.upsert({
      where: { id: "singleton" },
      update: {
        name: body.name,
        descriptor: body.descriptor,
        introduction: body.introduction,
        biography: body.biography ?? [],
        location: body.location,
        availability: body.availability,
        resumeUrl: body.resumeUrl,
        contactEmail: body.contactEmail,
        portrait: body.portrait ?? null,
        primaryCta: body.primaryCta ?? null,
        secondaryCta: body.secondaryCta ?? null,
        version: { increment: 1 },
      },
      create: {
        id: "singleton",
        name: body.name ?? "SareyBoth",
        descriptor: body.descriptor ?? "Community Program Coordinator",
        introduction: body.introduction ?? "",
        biography: body.biography ?? [],
        location: body.location ?? null,
        availability: body.availability ?? null,
        resumeUrl: body.resumeUrl ?? null,
        contactEmail: body.contactEmail ?? "sareyboth@example.com",
        portrait: body.portrait ?? null,
        primaryCta: body.primaryCta ?? null,
        secondaryCta: body.secondaryCta ?? null,
        version: 1,
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "update",
      entityType: "profile",
      entityId: "singleton",
      details: { name: updated.name, version: updated.version },
    });

    return apiSuccess({ profile: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
