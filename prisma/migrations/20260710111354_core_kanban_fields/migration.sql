/*
  Warnings:

  - Added the required column `actorId` to the `activity_events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiresAt` to the `invitations` table without a default value. This is not possible if the table is not empty.
  - Made the column `code` on table `tasks` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "activity_events" ADD COLUMN     "actorId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "boards" ADD COLUMN     "taskCounter" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "invitations" ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "sprintId" TEXT,
ALTER COLUMN "code" SET NOT NULL;

-- CreateIndex
CREATE INDEX "activity_events_actorId_idx" ON "activity_events"("actorId");

-- CreateIndex
CREATE INDEX "tasks_sprintId_idx" ON "tasks"("sprintId");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
