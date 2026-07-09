/*
  Warnings:

  - A unique constraint covering the columns `[branchCode]` on the table `branch` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tillCode]` on the table `till` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "branch_branchCode_key" ON "branch"("branchCode");

-- CreateIndex
CREATE UNIQUE INDEX "till_tillCode_key" ON "till"("tillCode");
