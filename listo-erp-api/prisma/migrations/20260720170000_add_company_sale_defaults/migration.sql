ALTER TABLE "Company" ADD COLUMN "defaultCustomerId" INTEGER;
ALTER TABLE "Company" ADD COLUMN "defaultSellerId" INTEGER;
ALTER TABLE "Sale" ADD COLUMN "paymentReference" TEXT;

ALTER TABLE "Company"
  ADD CONSTRAINT "Company_defaultCustomerId_fkey"
  FOREIGN KEY ("defaultCustomerId") REFERENCES "Customer"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Company"
  ADD CONSTRAINT "Company_defaultSellerId_fkey"
  FOREIGN KEY ("defaultSellerId") REFERENCES "Seller"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
