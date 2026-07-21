-- DIAN uses standardized payment-mean codes when Colombia electronic invoicing is enabled.
ALTER TABLE "PaymentMethod" ADD COLUMN "dianCode" TEXT;
