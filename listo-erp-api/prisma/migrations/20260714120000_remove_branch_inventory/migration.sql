-- Inventory is owned by warehouses. Branches only access warehouses through WarehouseBranch.
-- Legacy transfer and branch-balance data is intentionally discarded.
DELETE FROM "InventoryTransferItem";
DELETE FROM "InventoryTransfer";
DELETE FROM "InventoryMovement" WHERE "branchId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "BranchInventoryBalance" DROP CONSTRAINT "BranchInventoryBalance_companyId_fkey";
ALTER TABLE "BranchInventoryBalance" DROP CONSTRAINT "BranchInventoryBalance_branchId_fkey";
ALTER TABLE "BranchInventoryBalance" DROP CONSTRAINT "BranchInventoryBalance_productId_fkey";
ALTER TABLE "InventoryMovement" DROP CONSTRAINT "InventoryMovement_branchId_fkey";
ALTER TABLE "InventoryTransfer" DROP CONSTRAINT "InventoryTransfer_destinationBranchId_fkey";

-- DropIndex
DROP INDEX "BranchInventoryBalance_companyId_productId_idx";
DROP INDEX "BranchInventoryBalance_branchId_productId_key";
DROP INDEX "InventoryMovement_companyId_branchId_productId_createdAt_idx";
DROP INDEX "InventoryTransfer_destinationBranchId_idx";

-- AlterTable
ALTER TABLE "InventoryMovement" DROP COLUMN "branchId",
ALTER COLUMN "warehouseId" SET NOT NULL;
ALTER TABLE "InventoryTransfer" RENAME COLUMN "destinationBranchId" TO "destinationWarehouseId";

-- DropTable
DROP TABLE "BranchInventoryBalance";

-- CreateIndex
CREATE INDEX "InventoryTransfer_destinationWarehouseId_idx" ON "InventoryTransfer"("destinationWarehouseId");

-- AddForeignKey
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_destinationWarehouseId_fkey" FOREIGN KEY ("destinationWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
