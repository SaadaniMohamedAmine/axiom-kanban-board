import { WorkspacePlan } from "@prisma/client";

export interface PlanLimits {
  maxBoards: number;
  maxMembers: number;
  maxAIRequestsPerDay: number;
  hasWebhooks: boolean;
  hasAuditLog: boolean;
  auditLogRetentionDays: number;
}

export const PLAN_LIMITS: Record<WorkspacePlan, PlanLimits> = {
  FREE: {
    maxBoards: 3,
    maxMembers: 10,
    maxAIRequestsPerDay: 20,
    hasWebhooks: false,
    hasAuditLog: false,
    auditLogRetentionDays: 0,
  },
  PRO: {
    maxBoards: Infinity,
    maxMembers: 50,
    maxAIRequestsPerDay: 200,
    hasWebhooks: true,
    hasAuditLog: true,
    auditLogRetentionDays: 90,
  },
  TEAM: {
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

export function formatLimit(value: number): string {
  return value === Infinity ? "Unlimited" : value.toString();
}
