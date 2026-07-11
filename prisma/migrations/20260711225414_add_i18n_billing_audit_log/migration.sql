-- CreateEnum
CREATE TYPE "WorkspacePlan" AS ENUM ('FREE', 'PRO', 'TEAM');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('WORKSPACE_CREATED', 'WORKSPACE_RENAMED', 'WORKSPACE_DELETED', 'MEMBER_INVITED', 'MEMBER_JOINED', 'MEMBER_ROLE_CHANGED', 'MEMBER_REMOVED', 'BOARD_CREATED', 'BOARD_DELETED', 'TASK_DELETED', 'AUTH_LOGIN', 'AUTH_LOGIN_FAILED', 'AUTH_LOGOUT', 'API_KEY_CREATED', 'API_KEY_REVOKED', 'API_KEY_USED', 'AI_SUGGESTION_APPLIED', 'BILLING_UPGRADED', 'BILLING_DOWNGRADED', 'BILLING_CANCELLED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'fr';

-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN     "plan" "WorkspacePlan" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "planExpiresAt" TIMESTAMP(3),
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT;

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "targetLabel" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_workspaceId_idx" ON "audit_logs"("workspaceId");

-- CreateIndex
CREATE INDEX "audit_logs_workspaceId_createdAt_idx" ON "audit_logs"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
