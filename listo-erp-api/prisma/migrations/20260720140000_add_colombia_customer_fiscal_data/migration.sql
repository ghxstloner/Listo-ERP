-- Colombia electronic invoices require a stable fiscal profile for the buyer.
ALTER TABLE "Customer"
  ADD COLUMN "isFinalConsumer" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "fiscalPersonType" TEXT,
  ADD COLUMN "taxCheckDigit" TEXT,
  ADD COLUMN "rutResponsibilities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "taxRegime" TEXT,
  ADD COLUMN "fiscalAddress" TEXT,
  ADD COLUMN "fiscalCountryCode" CHAR(2),
  ADD COLUMN "fiscalDepartmentCode" TEXT,
  ADD COLUMN "fiscalDepartment" TEXT,
  ADD COLUMN "fiscalCity" TEXT;
