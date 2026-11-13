import { NextRequest } from "next/server";
import { prisma } from "@/server/prisma-client";
import { requireSession } from "@/server/permissions";
import { logAuditEvent } from "@/server/audit";
import { apiSuccess, handleApiError, ConflictError } from "@/server/api-handler";


export async function GET(req: NextRequest) {
  try {
    await requireSession(req.headers);
    const contactSettings = await prisma.contactSettings.findUnique({
      where: { id: "singleton" },
    });
    return apiSuccess({ contactSettings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user } = await requireSession(req.headers);
    const body = await req.json();

    const existing = await prisma.contactSettings.findUnique({
      where: { id: "singleton" },
    });

    if (existing && body.version !== undefined && body.version !== existing.version) {
      throw new ConflictError("Contact settings were modified by another session. Please reload.");
    }

    const updated = await prisma.contactSettings.upsert({
      where: { id: "singleton" },
      update: {
        recipientEmail: body.recipientEmail,
        mode: body.mode ?? "form",
        subjectPrefix: body.subjectPrefix ?? null,
        acknowledgementText: body.acknowledgementText,
        openEmailAppButtonLabel: body.openEmailAppButtonLabel,
        emailAppHelperText: body.emailAppHelperText,
        directEmailFallbackLabel: body.directEmailFallbackLabel,
        version: { increment: 1 },
      },
      create: {
        id: "singleton",
        recipientEmail: body.recipientEmail ?? "sareyboth@example.com",
        mode: body.mode ?? "form",
        subjectPrefix: body.subjectPrefix ?? null,
        acknowledgementText: body.acknowledgementText ?? "Message received! Thank you for reaching out.",
        openEmailAppButtonLabel: body.openEmailAppButtonLabel ?? "Open email app",
        emailAppHelperText: body.emailAppHelperText ?? "Clicking 'Open email app' opens your default mail client with a pre-filled draft.",
        directEmailFallbackLabel: body.directEmailFallbackLabel ?? "Prefer to write directly? Email",
        version: 1,
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "update",
      entityType: "contact_settings",
      entityId: "singleton",
      details: { recipientEmail: updated.recipientEmail, mode: updated.mode },
    });

    return apiSuccess({ contactSettings: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
