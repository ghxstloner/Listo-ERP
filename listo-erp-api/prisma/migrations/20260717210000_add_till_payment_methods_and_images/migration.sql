-- Add payment-method images and their enabled tills.
ALTER TABLE "PaymentMethod" ADD COLUMN "image" TEXT;

CREATE TABLE "TillPaymentMethod" (
    "tillId" INTEGER NOT NULL,
    "paymentMethodId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TillPaymentMethod_pkey" PRIMARY KEY ("tillId", "paymentMethodId")
);

CREATE INDEX "TillPaymentMethod_paymentMethodId_idx" ON "TillPaymentMethod"("paymentMethodId");

ALTER TABLE "TillPaymentMethod" ADD CONSTRAINT "TillPaymentMethod_tillId_fkey"
  FOREIGN KEY ("tillId") REFERENCES "till"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TillPaymentMethod" ADD CONSTRAINT "TillPaymentMethod_paymentMethodId_fkey"
  FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve current POS behavior until each till is explicitly configured.
INSERT INTO "TillPaymentMethod" ("tillId", "paymentMethodId")
SELECT t."id", pm."id"
FROM "till" t
JOIN "PaymentMethod" pm ON pm."companyId" = t."companyId";
