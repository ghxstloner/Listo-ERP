/*
  Warnings:

  - A unique constraint covering the columns `[companyId,code]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,code]` on the table `Subcategory` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,code]` on the table `Subdepartment` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Category_subdepartmentId_code_key";

-- DropIndex
DROP INDEX "Subcategory_categoryId_code_key";

-- DropIndex
DROP INDEX "Subdepartment_departmentId_code_key";

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "companyId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Subcategory" ADD COLUMN     "companyId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Subdepartment" ADD COLUMN     "companyId" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "Category_companyId_code_key" ON "Category"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Subcategory_companyId_code_key" ON "Subcategory"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Subdepartment_companyId_code_key" ON "Subdepartment"("companyId", "code");

-- AddForeignKey
ALTER TABLE "Subdepartment" ADD CONSTRAINT "Subdepartment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
