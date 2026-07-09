/*
  Warnings:

  - You are about to drop the column `sortOrder` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `sortOrder` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the column `sortOrder` on the `Subcategory` table. All the data in the column will be lost.
  - You are about to drop the column `sortOrder` on the `Subdepartment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Category" DROP COLUMN "sortOrder";

-- AlterTable
ALTER TABLE "Department" DROP COLUMN "sortOrder";

-- AlterTable
ALTER TABLE "Subcategory" DROP COLUMN "sortOrder";

-- AlterTable
ALTER TABLE "Subdepartment" DROP COLUMN "sortOrder";
