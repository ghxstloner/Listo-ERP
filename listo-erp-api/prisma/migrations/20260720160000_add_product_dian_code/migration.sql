-- DIAN uses standardized product unit codes when Colombia electronic invoicing is enabled.
ALTER TABLE "Product" ADD COLUMN "dianCode" TEXT;
