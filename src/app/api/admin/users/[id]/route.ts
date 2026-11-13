import { NextRequest } from "next/server";
import { prisma } from "@/server/prisma-client";
import { auth } from "@/server/auth";
import { requireRole } from "@/server/permissions";
import { logAuditEvent } from "@/server/audit";
import { apiSuccess, handleApiError } from "@/server/api-handler";


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("OWNER", req.headers);
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        banned: true,
        banReason: true,
        image: true,
        createdAt: true,
      },
    });

    if (!user) return handleApiError(new Error("User not found"));
    return apiSuccess({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user: currentActor } = await requireRole("OWNER", req.headers);
    const { id } = await params;
    const body = await req.json();

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return handleApiError(new Error("User not found"));

    // Check last remaining OWNER guard
    if (target.role === "OWNER" && (body.role === "EDITOR" || body.banned === true)) {
      const activeOwnerCount = await prisma.user.count({
        where: {
          role: "OWNER",
          id: { not: target.id },
          banned: { not: true },
        },
      });

      if (activeOwnerCount === 0) {
        return handleApiError(
          new Error("Cannot demote or ban the last remaining active OWNER account.")
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        role: body.role !== undefined ? body.role : undefined,
        banned: body.banned !== undefined ? Boolean(body.banned) : undefined,
        banReason: body.banReason !== undefined ? body.banReason : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        banned: true,
        banReason: true,
        createdAt: true,
      },
    });

    await logAuditEvent({
      actorId: currentActor.id,
      actorEmail: currentActor.email,
      action: "update",
      entityType: "user",
      entityId: id,
      details: { role: updated.role, banned: updated.banned },
    });

    return apiSuccess({ user: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user: currentActor } = await requireRole("OWNER", req.headers);
    const { id } = await params;

    if (currentActor.id === id) {
      return handleApiError(new Error("You cannot delete your own account while logged in."));
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return handleApiError(new Error("User not found"));

    if (target.role === "OWNER") {
      const activeOwnerCount = await prisma.user.count({
        where: { role: "OWNER", id: { not: id } },
      });
      if (activeOwnerCount === 0) {
        return handleApiError(new Error("Cannot delete the last remaining OWNER account."));
      }
    }

    // Delete user sessions and accounts, then user
    await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId: id } }),
      prisma.account.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    await logAuditEvent({
      actorId: currentActor.id,
      actorEmail: currentActor.email,
      action: "delete",
      entityType: "user",
      entityId: id,
      details: { email: target.email },
    });

    return apiSuccess({ message: "Staff user deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
