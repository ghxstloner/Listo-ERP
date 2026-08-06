-- CreateTable
CREATE TABLE "TillElectronicInvoicingConfiguration" (
    "id" SERIAL NOT NULL,
    "tillId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "numberingMode" "ElectronicInvoicingNumberingMode" NOT NULL DEFAULT 'WITH_PREFIX',
    "numberingRange" TEXT NOT NULL,
    "nextConsecutive" INTEGER NOT NULL,
    "providerNumberingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TillElectronicInvoicingConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TillElectronicInvoicingConfiguration_tillId_countryCode_key" ON "TillElectronicInvoicingConfiguration"("tillId", "countryCode");

-- CreateIndex
CREATE INDEX "TillElectronicInvoicingConfiguration_companyId_countryCode_idx" ON "TillElectronicInvoicingConfiguration"("companyId", "countryCode");

-- AddForeignKey
ALTER TABLE "TillElectronicInvoicingConfiguration" ADD CONSTRAINT "TillElectronicInvoicingConfiguration_tillId_fkey" FOREIGN KEY ("tillId") REFERENCES "till"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TillElectronicInvoicingConfiguration" ADD CONSTRAINT "TillElectronicInvoicingConfiguration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TillElectronicInvoicingConfiguration" ADD CONSTRAINT "TillElectronicInvoicingConfiguration_companyId_countryCode_fkey" FOREIGN KEY ("companyId", "countryCode") REFERENCES "ElectronicInvoicingConfiguration"("companyId", "countryCode") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Add tillConfigurationId as nullable first
ALTER TABLE "ElectronicInvoice" ADD COLUMN "tillConfigurationId" INTEGER;

-- Backfill: For each existing invoice, find the till numbering config via sale -> cashSession -> till
UPDATE "ElectronicInvoice"
SET "tillConfigurationId" = tec.id
FROM "TillElectronicInvoicingConfiguration" tec,
     "Sale" s,
     "CashSession" cs,
     "ElectronicInvoicingConfiguration" eic
WHERE s.id = "ElectronicInvoice"."saleId"
  AND cs.id = s."cashSessionId"
  AND eic.id = "ElectronicInvoice"."configurationId"
  AND tec."tillId" = cs."tillId"
  AND tec."countryCode" = eic."countryCode"
  AND "ElectronicInvoice"."tillConfigurationId" IS NULL;

-- AlterTable: Now make tillConfigurationId NOT NULL
ALTER TABLE "ElectronicInvoice" ALTER COLUMN "tillConfigurationId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "ElectronicInvoice" ADD CONSTRAINT "ElectronicInvoice_tillConfigurationId_fkey" FOREIGN KEY ("tillConfigurationId") REFERENCES "TillElectronicInvoicingConfiguration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: Drop old unique constraint and add new one
ALTER TABLE "ElectronicInvoice" DROP CONSTRAINT IF EXISTS "ElectronicInvoice_configurationId_consecutive_key";

-- CreateIndex
CREATE UNIQUE INDEX "ElectronicInvoice_tillConfigurationId_consecutive_key" ON "ElectronicInvoice"("tillConfigurationId", "consecutive");

-- AlterTable: Drop numbering columns from ElectronicInvoicingConfiguration
ALTER TABLE "ElectronicInvoicingConfiguration" DROP COLUMN "providerNumberingId",
DROP COLUMN "numberingMode",
DROP COLUMN "numberingRange",
DROP COLUMN "nextConsecutive";
