-- Add supplier purchase invoices as the canonical inventory receipt document.
CREATE TYPE "PurchaseInvoiceStatus" AS ENUM ('POSTED', 'CANCELLED');
ALTER TYPE "InventoryMovementType" ADD VALUE 'PURCHASE_INVOICE';
ALTER TYPE "SeriesModule" ADD VALUE 'PURCHASE_INVOICES';

CREATE TABLE "PurchaseInvoice" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "warehouseId" INTEGER NOT NULL,
    "purchaseOrderId" INTEGER,
    "seriesId" INTEGER NOT NULL,
    "consecutive" INTEGER NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "supplierInvoiceNumber" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "status" "PurchaseInvoiceStatus" NOT NULL DEFAULT 'POSTED',
    "subtotal" DECIMAL(18,4) NOT NULL,
    "taxAmount" DECIMAL(18,4) NOT NULL,
    "total" DECIMAL(18,4) NOT NULL,
    "createdByUserId" INTEGER NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseInvoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PurchaseInvoiceItem" (
    "id" SERIAL NOT NULL,
    "purchaseInvoiceId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unitCost" DECIMAL(18,4) NOT NULL,
    "taxRate" DECIMAL(5,4) NOT NULL,
    "taxAmount" DECIMAL(18,4) NOT NULL,
    "lineTotal" DECIMAL(18,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseInvoiceItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "InventoryMovement"
    ADD COLUMN "purchaseInvoiceId" INTEGER,
    ADD COLUMN "purchaseInvoiceItemId" INTEGER;

CREATE UNIQUE INDEX "PurchaseInvoice_companyId_documentNumber_key"
    ON "PurchaseInvoice"("companyId", "documentNumber");
CREATE UNIQUE INDEX "PurchaseInvoice_companyId_supplierId_supplierInvoiceNumber_key"
    ON "PurchaseInvoice"("companyId", "supplierId", "supplierInvoiceNumber");
CREATE UNIQUE INDEX "PurchaseInvoice_seriesId_consecutive_key"
    ON "PurchaseInvoice"("seriesId", "consecutive");
CREATE INDEX "PurchaseInvoice_companyId_issueDate_idx"
    ON "PurchaseInvoice"("companyId", "issueDate");
CREATE INDEX "PurchaseInvoice_companyId_status_idx"
    ON "PurchaseInvoice"("companyId", "status");
CREATE INDEX "PurchaseInvoice_supplierId_idx"
    ON "PurchaseInvoice"("supplierId");
CREATE INDEX "PurchaseInvoice_purchaseOrderId_idx"
    ON "PurchaseInvoice"("purchaseOrderId");
CREATE UNIQUE INDEX "PurchaseInvoiceItem_purchaseInvoiceId_productId_key"
    ON "PurchaseInvoiceItem"("purchaseInvoiceId", "productId");
CREATE INDEX "PurchaseInvoiceItem_productId_idx"
    ON "PurchaseInvoiceItem"("productId");
CREATE UNIQUE INDEX "InventoryMovement_purchaseInvoiceItemId_key"
    ON "InventoryMovement"("purchaseInvoiceItemId");

ALTER TABLE "PurchaseInvoice"
    ADD CONSTRAINT "PurchaseInvoice_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "PurchaseInvoice_supplierId_fkey"
    FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "PurchaseInvoice_warehouseId_fkey"
    FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "PurchaseInvoice_purchaseOrderId_fkey"
    FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "PurchaseInvoice_seriesId_fkey"
    FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "PurchaseInvoice_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PurchaseInvoiceItem"
    ADD CONSTRAINT "PurchaseInvoiceItem_purchaseInvoiceId_fkey"
    FOREIGN KEY ("purchaseInvoiceId") REFERENCES "PurchaseInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "PurchaseInvoiceItem_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InventoryMovement"
    ADD CONSTRAINT "InventoryMovement_purchaseInvoiceId_fkey"
    FOREIGN KEY ("purchaseInvoiceId") REFERENCES "PurchaseInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "InventoryMovement_purchaseInvoiceItemId_fkey"
    FOREIGN KEY ("purchaseInvoiceItemId") REFERENCES "PurchaseInvoiceItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
