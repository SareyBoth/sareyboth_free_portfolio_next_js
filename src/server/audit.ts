import { prisma } from "./prisma-client";

export interface LogAuditParams {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, any> | null;
}

export async function logAuditEvent(params: LogAuditParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        actorId: params.actorId ?? undefined,
        actorEmail: params.actorEmail ?? undefined,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? undefined,
        details: params.details ?? undefined,
      },
    });
  } catch (err) {
    // Non-blocking error logging
    console.error("[audit] Failed to record audit log:", err);
    return null;
  }
}
