/*
  Warnings:

  - You are about to drop the column `brancCode` on the `branch` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[companyId,branchCode]` on the table `branch` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "branch_companyId_brancCode_key";

-- AlterTable
ALTER TABLE "branch" DROP COLUMN "brancCode",
ADD COLUMN     "branchCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "branch_companyId_branchCode_key" ON "branch"("companyId", "branchCode");
