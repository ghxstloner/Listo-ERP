-- A Listo configuration must retain the provider's validated sequential identity.
CREATE TYPE "ElectronicInvoicingNumberingMode" AS ENUM ('WITH_PREFIX', 'WITHOUT_PREFIX');

ALTER TABLE "ElectronicInvoicingConfiguration"
  ADD COLUMN "providerNumberingId" TEXT,
  ADD COLUMN "numberingMode" "ElectronicInvoicingNumberingMode" NOT NULL DEFAULT 'WITH_PREFIX';
