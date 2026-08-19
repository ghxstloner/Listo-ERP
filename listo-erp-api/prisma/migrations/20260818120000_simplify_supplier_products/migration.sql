-- DropForeignKey
ALTER TABLE "SupplierProduct" DROP CONSTRAINT "SupplierProduct_currencyId_fkey";

-- DropIndex
DROP INDEX "SupplierProduct_one_preferred_per_product";

-- AlterTable
ALTER TABLE "SupplierProduct"
DROP COLUMN "supplierSku",
DROP COLUMN "referenceCost",
DROP COLUMN "currencyId",
DROP COLUMN "minimumQuantity",
DROP COLUMN "leadTimeDays",
DROP COLUMN "isPreferred";

-- AlterTable
ALTER TABLE "PurchaseOrderItem" DROP COLUMN "supplierSku";
