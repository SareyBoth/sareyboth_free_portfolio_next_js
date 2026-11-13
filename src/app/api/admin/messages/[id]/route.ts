import { NextRequest } from "next/server";
import { prisma } from "@/server/prisma-client";
import { requireSession } from "@/server/permissions";
import { logAuditEvent } from "@/server/audit";
import { apiSuccess, handleApiError } from "@/server/api-handler";


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession(req.headers);
    const { id } = await params;

    let message = await prisma.contactMessage.findUnique({ where: { id } });
    if (!message) return handleApiError(new Error("Message not found"));

    if (message.status === "unread") {
      message = await prisma.contactMessage.update({
        where: { id },
        data: { status: "read" },
      });
    }

    return apiSuccess({ message });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireSession(req.headers);
    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.contactMessage.update({
      where: { id },
      data: {
        status: body.status !== undefined ? body.status : undefined,
        internalNotes: body.internalNotes !== undefined ? body.internalNotes : undefined,
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "update_status",
      entityType: "contact_message",
      entityId: id,
      details: { status: updated.status },
    });

    return apiSuccess({ message: updated });
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

    await prisma.contactMessage.delete({ where: { id } });
    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "delete",
      entityType: "contact_message",
      entityId: id,
    });

    return apiSuccess({ message: "Message deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
