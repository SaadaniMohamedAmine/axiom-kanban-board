-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'WORKSPACE_UNARCHIVED';
ALTER TYPE "AuditAction" ADD VALUE 'WORKSPACE_TRASHED';
ALTER TYPE "AuditAction" ADD VALUE 'WORKSPACE_RESTORED';

-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN     "deletedAt" TIMESTAMP(3);
