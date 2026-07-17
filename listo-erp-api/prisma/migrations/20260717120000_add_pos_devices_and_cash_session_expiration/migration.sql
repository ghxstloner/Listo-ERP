-- AlterEnum
ALTER TYPE "CashSessionStatus" ADD VALUE 'EXPIRED';

-- CreateTable
CREATE TABLE "PosDevice" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "deviceKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tillId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PosDevice_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "CashSession" ADD COLUMN "deviceId" INTEGER;
ALTER TABLE "CashSession" ADD COLUMN "expiresAt" TIMESTAMP(3);
UPDATE "CashSession" SET "expiresAt" = "openedAt" + INTERVAL '12 hours' WHERE "expiresAt" IS NULL;
ALTER TABLE "CashSession" ALTER COLUMN "expiresAt" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PosDevice_companyId_deviceKey_key" ON "PosDevice"("companyId", "deviceKey");
CREATE UNIQUE INDEX "PosDevice_tillId_key" ON "PosDevice"("tillId");
CREATE INDEX "PosDevice_companyId_isActive_idx" ON "PosDevice"("companyId", "isActive");
CREATE INDEX "CashSession_deviceId_idx" ON "CashSession"("deviceId");

-- AddForeignKey
ALTER TABLE "PosDevice" ADD CONSTRAINT "PosDevice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PosDevice" ADD CONSTRAINT "PosDevice_tillId_fkey" FOREIGN KEY ("tillId") REFERENCES "till"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CashSession" ADD CONSTRAINT "CashSession_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "PosDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
