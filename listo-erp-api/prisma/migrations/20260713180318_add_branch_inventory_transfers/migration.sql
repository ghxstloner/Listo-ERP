-- CreateEnum
CREATE TYPE "InventoryTransferStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED');



ALTER TYPE "InventoryMovementType" ADD VALUE 'TRANSFER_OUT';
ALTER TYPE "InventoryMovementType" ADD VALUE 'TRANSFER_IN';

-- DropForeignKey
ALTER TABLE "InventoryMovement" DROP CONSTRAINT "InventoryMovement_warehouseId_fkey";

-- AlterTable
ALTER TABLE "InventoryMovement" ADD COLUMN     "branchId" INTEGER,
ALTER COLUMN "warehouseId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "BranchInventoryBalance" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "branchId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchInventoryBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryTransfer" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "sourceWarehouseId" INTEGER NOT NULL,
    "destinationBranchId" INTEGER NOT NULL,
    "status" "InventoryTransferStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "dispatchedAt" TIMESTAMP(3),
    "dispatchedByUserId" INTEGER,
    "receivedAt" TIMESTAMP(3),
    "receivedByUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryTransferItem" (
    "id" SERIAL NOT NULL,
    "transferId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryTransferItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BranchInventoryBalance_companyId_productId_idx" ON "BranchInventoryBalance"("companyId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "BranchInventoryBalance_branchId_productId_key" ON "BranchInventoryBalance"("branchId", "productId");

-- CreateIndex
CREATE INDEX "InventoryTransfer_companyId_status_idx" ON "InventoryTransfer"("companyId", "status");

-- CreateIndex
CREATE INDEX "InventoryTransfer_sourceWarehouseId_idx" ON "InventoryTransfer"("sourceWarehouseId");

-- CreateIndex
CREATE INDEX "InventoryTransfer_destinationBranchId_idx" ON "InventoryTransfer"("destinationBranchId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryTransferItem_transferId_productId_key" ON "InventoryTransferItem"("transferId", "productId");

-- CreateIndex
CREATE INDEX "InventoryMovement_companyId_branchId_productId_createdAt_idx" ON "InventoryMovement"("companyId", "branchId", "productId", "createdAt");

-- AddForeignKey
ALTER TABLE "BranchInventoryBalance" ADD CONSTRAINT "BranchInventoryBalance_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchInventoryBalance" ADD CONSTRAINT "BranchInventoryBalance_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchInventoryBalance" ADD CONSTRAINT "BranchInventoryBalance_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_sourceWarehouseId_fkey" FOREIGN KEY ("sourceWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_destinationBranchId_fkey" FOREIGN KEY ("destinationBranchId") REFERENCES "branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransferItem" ADD CONSTRAINT "InventoryTransferItem_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "InventoryTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransferItem" ADD CONSTRAINT "InventoryTransferItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
