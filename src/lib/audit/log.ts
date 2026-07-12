import { prisma } from "@/lib/prisma";
import { AuditAction, Prisma } from "@prisma/client";

interface AuditLogParams {
  workspaceId: string;
  actorId?: string;
  actorEmail: string;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  targetLabel?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        workspaceId: params.workspaceId,
        actorId: params.actorId,
        actorEmail: params.actorEmail,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        targetLabel: params.targetLabel,
        metadata: params.metadata as Prisma.InputJsonValue | undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch {
    // Ne jamais bloquer l'action utilisateur sur une erreur de logging
  }
}
