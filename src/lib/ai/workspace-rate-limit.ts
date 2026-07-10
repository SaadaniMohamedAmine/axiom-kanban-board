import { prisma } from "@/lib/prisma";

const AI_DAILY_LIMIT = parseInt(process.env.AI_DAILY_LIMIT ?? "50", 10);

export interface WorkspaceQuotaResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  resetAt: Date;
}

export async function checkWorkspaceQuota(
  workspaceId: string
): Promise<WorkspaceQuotaResult> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { aiRequestsToday: true, aiRequestsResetAt: true },
  });

  if (!workspace) throw new Error("Workspace not found");

  const now = new Date();

  const shouldReset =
    !workspace.aiRequestsResetAt ||
    workspace.aiRequestsResetAt.getUTCDate() !== now.getUTCDate() ||
    workspace.aiRequestsResetAt.getUTCMonth() !== now.getUTCMonth() ||
    workspace.aiRequestsResetAt.getUTCFullYear() !== now.getUTCFullYear();

  if (shouldReset) {
    const resetAt = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
    );
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { aiRequestsToday: 0, aiRequestsResetAt: resetAt },
    });

    return {
      allowed: true,
      used: 0,
      limit: AI_DAILY_LIMIT,
      remaining: AI_DAILY_LIMIT,
      resetAt: new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
      ),
    };
  }

  const used = workspace.aiRequestsToday;
  const resetAt =
    workspace.aiRequestsResetAt ??
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));

  return {
    allowed: used < AI_DAILY_LIMIT,
    used,
    limit: AI_DAILY_LIMIT,
    remaining: Math.max(0, AI_DAILY_LIMIT - used),
    resetAt,
  };
}

export async function incrementWorkspaceQuota(workspaceId: string): Promise<void> {
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { aiRequestsToday: { increment: 1 } },
  });
}
