import { NextRequest } from "next/server";
import { prisma } from "@/server/prisma-client";
import { auth } from "@/server/auth";
import { requireRole } from "@/server/permissions";
import { logAuditEvent } from "@/server/audit";
import { apiSuccess, handleApiError } from "@/server/api-handler";


export async function GET(req: NextRequest) {
  try {
    await requireRole("OWNER", req.headers);

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
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

    return apiSuccess({ users });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user: currentActor } = await requireRole("OWNER", req.headers);
    const body = await req.json();

    const { email, password, name, role } = body;

    if (!email || !password || !name) {
      return handleApiError(new Error("Email, name, and password are required."));
    }

    if (password.length < 8) {
      return handleApiError(new Error("Password must be at least 8 characters long."));
    }

    const assignedRole = role === "OWNER" ? "OWNER" : "EDITOR";

    const created = await auth.api.createUser({
      headers: req.headers,
      body: {
        email,
        password,
        name,
        role: assignedRole as any,
      },
    });

    await logAuditEvent({
      actorId: currentActor.id,
      actorEmail: currentActor.email,
      action: "create",
      entityType: "user",
      entityId: created.user.id,
      details: { email, role: assignedRole },
    });

    return apiSuccess({ user: created.user }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
