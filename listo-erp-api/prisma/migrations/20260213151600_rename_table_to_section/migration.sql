/*
  Warnings:

  - You are about to drop the column `ipAddress` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `AuditLog` table. All the data in the column will be lost.
  - Added the required column `section` to the `AuditLog` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `AuditLog` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'CREATE';
ALTER TYPE "AuditAction" ADD VALUE 'UPDATE';
ALTER TYPE "AuditAction" ADD VALUE 'DELETE';

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "ipAddress",
DROP COLUMN "metadata",
DROP COLUMN "userAgent",
ADD COLUMN     "section" TEXT NOT NULL,
ALTER COLUMN "description" SET NOT NULL;
