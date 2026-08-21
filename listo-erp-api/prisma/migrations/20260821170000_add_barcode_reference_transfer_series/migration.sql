-- AlterEnum
ALTER TYPE "SeriesModule" ADD VALUE 'INVENTORY_TRANSFERS';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "barcode" TEXT,
ADD COLUMN "reference" TEXT;

-- AlterTable
ALTER TABLE "InventoryTransfer" ADD COLUMN "seriesId" INTEGER,
ADD COLUMN "consecutive" INTEGER,
ADD COLUMN "documentNumber" TEXT,
ADD COLUMN "createdByUserId" INTEGER NOT NULL,
ADD COLUMN "controlStock" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Product_companyId_barcode_idx" ON "Product"("companyId", "barcode");

-- CreateIndex
CREATE INDEX "Product_companyId_reference_idx" ON "Product"("companyId", "reference");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryTransfer_seriesId_consecutive_key" ON "InventoryTransfer"("seriesId", "consecutive");

-- AddForeignKey
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
