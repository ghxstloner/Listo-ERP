-- AlterTable
ALTER TABLE "CashSession" ADD COLUMN "deviceKey" TEXT;
UPDATE "CashSession" SET "deviceKey" = CONCAT('legacy-', "id") WHERE "deviceKey" IS NULL;
ALTER TABLE "CashSession" ALTER COLUMN "deviceKey" SET NOT NULL;

-- DropForeignKey
ALTER TABLE "CashSession" DROP CONSTRAINT "CashSession_deviceId_fkey";

-- DropIndex
DROP INDEX "CashSession_deviceId_idx";

-- AlterTable
ALTER TABLE "CashSession" DROP COLUMN "deviceId";

-- DropTable
DROP TABLE "PosDevice";

-- CreateIndex
CREATE INDEX "CashSession_deviceKey_idx" ON "CashSession"("deviceKey");
