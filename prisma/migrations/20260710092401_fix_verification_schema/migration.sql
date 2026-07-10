/*
  Warnings:

  - You are about to drop the column `token` on the `verifications` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `verifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `verifications` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "verifications_token_key";

-- AlterTable
ALTER TABLE "verifications" DROP COLUMN "token",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "value" TEXT NOT NULL;
