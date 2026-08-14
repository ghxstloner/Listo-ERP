CREATE TABLE "ProductPrice" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductPrice_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Product" ADD COLUMN "defaultPriceId" INTEGER;
ALTER TABLE "OrderItem" ADD COLUMN "productPriceId" INTEGER;
ALTER TABLE "SaleItem" ADD COLUMN "productPriceId" INTEGER;

ALTER TABLE "ProductPrice"
    ADD CONSTRAINT "ProductPrice_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

WITH inserted_prices AS (
    INSERT INTO "ProductPrice" ("productId", "name", "amount", "updatedAt")
    SELECT "id", 'Precio base', "salePrice", CURRENT_TIMESTAMP
    FROM "Product"
    RETURNING "id", "productId"
)
UPDATE "Product" product
SET "defaultPriceId" = inserted_prices."id"
FROM inserted_prices
WHERE product."id" = inserted_prices."productId";

CREATE UNIQUE INDEX "Product_defaultPriceId_key" ON "Product"("defaultPriceId");

ALTER TABLE "Product"
    ADD CONSTRAINT "Product_defaultPriceId_fkey"
    FOREIGN KEY ("defaultPriceId") REFERENCES "ProductPrice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrderItem"
    ADD CONSTRAINT "OrderItem_productPriceId_fkey"
    FOREIGN KEY ("productPriceId") REFERENCES "ProductPrice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SaleItem"
    ADD CONSTRAINT "SaleItem_productPriceId_fkey"
    FOREIGN KEY ("productPriceId") REFERENCES "ProductPrice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "ProductPrice_productId_isActive_sortOrder_idx"
    ON "ProductPrice"("productId", "isActive", "sortOrder");
CREATE INDEX "OrderItem_productPriceId_idx" ON "OrderItem"("productPriceId");
CREATE INDEX "SaleItem_productPriceId_idx" ON "SaleItem"("productPriceId");
