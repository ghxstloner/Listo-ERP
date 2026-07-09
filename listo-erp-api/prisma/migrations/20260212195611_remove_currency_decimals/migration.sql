/*
  Warnings:

  - You are about to drop the column `district` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `province` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `fieldsConfig` on the `Country` table. All the data in the column will be lost.
  - You are about to drop the column `decimals` on the `Currency` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Company" DROP COLUMN "district",
DROP COLUMN "province";

-- AlterTable
ALTER TABLE "Country" DROP COLUMN "fieldsConfig";

-- AlterTable
ALTER TABLE "Currency" DROP COLUMN "decimals";
