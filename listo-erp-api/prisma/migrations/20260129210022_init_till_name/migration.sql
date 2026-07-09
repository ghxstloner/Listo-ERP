/*
  Warnings:

  - A unique constraint covering the columns `[branchId,tillCode]` on the table `till` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tillName` to the `till` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "till" ADD COLUMN     "tillName" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "till_branchId_tillCode_key" ON "till"("branchId", "tillCode");
