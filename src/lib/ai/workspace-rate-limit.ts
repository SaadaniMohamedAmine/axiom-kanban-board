import { prisma } from "@/lib/prisma";
import { getPlanLimits } from "@/lib/billing/plan-limits";
import type { WorkspacePlan } from "@prisma/client";

export interface WorkspaceQuotaResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  resetAt: Date;
  plan: WorkspacePlan;
}

export async function checkWorkspaceQuota(
  workspaceId: string
): Promise<WorkspaceQuotaResult> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { aiRequestsToday: true, aiRequestsResetAt: true, plan: true },
  });

  if (!workspace) throw new Error("Workspace not found");

  const dailyLimit = getPlanLimits(workspace.plan).maxAIRequestsPerDay;
  const now = new Date();

  // aiRequestsResetAt stores the *upcoming* reset instant (tomorrow midnight
  // UTC), not the last reset date — so a reset is due once that instant has
  // passed, not whenever its calendar date differs from today's.
  const shouldReset =
    !workspace.aiRequestsResetAt || now >= workspace.aiRequestsResetAt;

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
      limit: dailyLimit,
      remaining: dailyLimit,
      resetAt,
      plan: workspace.plan,
    };
  }

  const used = workspace.aiRequestsToday;
  const resetAt =
    workspace.aiRequestsResetAt ??
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));

  return {
    allowed: used < dailyLimit,
    used,
    limit: dailyLimit,
    remaining: Math.max(0, dailyLimit - used),
    resetAt,
    plan: workspace.plan,
  };
}

export async function incrementWorkspaceQuota(workspaceId: string): Promise<void> {
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { aiRequestsToday: { increment: 1 } },
  });
}
