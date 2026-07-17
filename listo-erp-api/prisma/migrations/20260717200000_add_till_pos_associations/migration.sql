-- CreateEnum
CREATE TYPE "TillPosAssociationType" AS ENUM ('IP', 'USER_SESSION');

-- AlterTable
ALTER TABLE "till" ADD COLUMN "posAccessCodeHash" TEXT;
ALTER TABLE "till" ADD COLUMN "posAccessCodeType" "TillPosAssociationType";
ALTER TABLE "till" ADD COLUMN "posAssociationType" "TillPosAssociationType";
ALTER TABLE "till" ADD COLUMN "posAssociatedIp" TEXT;
ALTER TABLE "till" ADD COLUMN "posAssociatedSessionId" TEXT;
ALTER TABLE "till" ADD COLUMN "posAssociationExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "till_companyId_posAssociationType_idx" ON "till"("companyId", "posAssociationType");
