import { WorkspacePlan } from "@prisma/client";

export interface PlanLimits {
  maxWorkspaces: number;
  maxBoards: number;
  maxMembers: number;
  maxAIRequestsPerDay: number;
  hasWebhooks: boolean;
  hasAuditLog: boolean;
  auditLogRetentionDays: number;
}

export const PLAN_LIMITS: Record<WorkspacePlan, PlanLimits> = {
  FREE: {
    maxWorkspaces: 1,
    maxBoards: 2,
    maxMembers: 10,
    maxAIRequestsPerDay: 10,
    hasWebhooks: false,
    hasAuditLog: false,
    auditLogRetentionDays: 0,
  },
  PRO: {
    maxWorkspaces: Infinity,
    maxBoards: Infinity,
    maxMembers: 50,
    maxAIRequestsPerDay: 200,
    hasWebhooks: true,
    hasAuditLog: true,
    auditLogRetentionDays: 90,
  },
  TEAM: {
    maxWorkspaces: Infinity,
    maxBoards: Infinity,
    maxMembers: Infinity,
    maxAIRequestsPerDay: 500,
    hasWebhooks: true,
    hasAuditLog: true,
    auditLogRetentionDays: 365,
  },
};

export function getPlanLimits(plan: WorkspacePlan): PlanLimits {
  return PLAN_LIMITS[plan];
}

// USD/month, matches the Stripe Price objects behind STRIPE_PRO_PRICE_ID / STRIPE_TEAM_PRICE_ID
// (kept in sync manually with src/app/pricing/page.tsx's PLAN_META).
export const PLAN_PRICES: Record<WorkspacePlan, number> = {
  FREE: 0,
  PRO: 12,
  TEAM: 29,
};

type UpgradablePlan = Exclude<WorkspacePlan, "FREE">;

const PLAN_ORDER: WorkspacePlan[] = ["FREE", "PRO", "TEAM"];

export function getNextPlan(plan: WorkspacePlan): UpgradablePlan | null {
  const index = PLAN_ORDER.indexOf(plan);
  return index >= 0 && index < PLAN_ORDER.length - 1 ? (PLAN_ORDER[index + 1] as UpgradablePlan) : null;
}

export function formatLimit(value: number): string {
  return value === Infinity ? "Unlimited" : value.toString();
}
