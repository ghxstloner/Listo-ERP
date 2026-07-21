-- Add the country-scoped electronic invoicing foundation and invoice audit trail.
CREATE TYPE "ElectronicInvoicingEnvironment" AS ENUM ('DEMO', 'PRODUCTION');
CREATE TYPE "ElectronicInvoiceStatus" AS ENUM ('PENDING', 'PROCESSING', 'ACCEPTED', 'REJECTED', 'FAILED');
CREATE TYPE "ElectronicInvoiceAttemptType" AS ENUM ('SUBMISSION', 'STATUS_CHECK');
CREATE TYPE "ElectronicInvoiceDocumentType" AS ENUM ('INVOICE');
CREATE TYPE "ElectronicInvoiceArtifactType" AS ENUM ('PDF', 'XML');

CREATE TABLE "ElectronicInvoicingConfiguration" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "environment" "ElectronicInvoicingEnvironment" NOT NULL,
    "credentialsCiphertext" TEXT NOT NULL,
    "credentialsNonce" TEXT NOT NULL,
    "credentialsAuthTag" TEXT NOT NULL,
    "encryptionKeyVersion" INTEGER NOT NULL DEFAULT 1,
    "numberingRange" TEXT NOT NULL,
    "nextConsecutive" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ElectronicInvoicingConfiguration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ElectronicInvoice" (
    "id" SERIAL NOT NULL,
    "saleId" INTEGER NOT NULL,
    "configurationId" INTEGER NOT NULL,
    "documentType" "ElectronicInvoiceDocumentType" NOT NULL DEFAULT 'INVOICE',
    "status" "ElectronicInvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "consecutive" TEXT NOT NULL,
    "requestPayload" JSONB NOT NULL,
    "providerResponse" JSONB,
    "cufe" TEXT,
    "qr" TEXT,
    "submittedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ElectronicInvoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ElectronicInvoiceAttempt" (
    "id" SERIAL NOT NULL,
    "electronicInvoiceId" INTEGER NOT NULL,
    "type" "ElectronicInvoiceAttemptType" NOT NULL,
    "requestPayload" JSONB,
    "providerResponse" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ElectronicInvoiceAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ElectronicInvoiceArtifact" (
    "id" SERIAL NOT NULL,
    "electronicInvoiceId" INTEGER NOT NULL,
    "type" "ElectronicInvoiceArtifactType" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ElectronicInvoiceArtifact_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ElectronicInvoicingConfiguration_companyId_countryCode_key"
  ON "ElectronicInvoicingConfiguration"("companyId", "countryCode");
CREATE UNIQUE INDEX "ElectronicInvoice_saleId_key" ON "ElectronicInvoice"("saleId");
CREATE UNIQUE INDEX "ElectronicInvoice_configurationId_consecutive_key"
  ON "ElectronicInvoice"("configurationId", "consecutive");
CREATE INDEX "ElectronicInvoice_status_nextRetryAt_idx"
  ON "ElectronicInvoice"("status", "nextRetryAt");
CREATE INDEX "ElectronicInvoiceAttempt_electronicInvoiceId_createdAt_idx"
  ON "ElectronicInvoiceAttempt"("electronicInvoiceId", "createdAt");
CREATE UNIQUE INDEX "ElectronicInvoiceArtifact_storageKey_key"
  ON "ElectronicInvoiceArtifact"("storageKey");
CREATE UNIQUE INDEX "ElectronicInvoiceArtifact_electronicInvoiceId_type_key"
  ON "ElectronicInvoiceArtifact"("electronicInvoiceId", "type");

ALTER TABLE "ElectronicInvoicingConfiguration"
  ADD CONSTRAINT "ElectronicInvoicingConfiguration_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElectronicInvoice"
  ADD CONSTRAINT "ElectronicInvoice_saleId_fkey"
  FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ElectronicInvoice"
  ADD CONSTRAINT "ElectronicInvoice_configurationId_fkey"
  FOREIGN KEY ("configurationId") REFERENCES "ElectronicInvoicingConfiguration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ElectronicInvoiceAttempt"
  ADD CONSTRAINT "ElectronicInvoiceAttempt_electronicInvoiceId_fkey"
  FOREIGN KEY ("electronicInvoiceId") REFERENCES "ElectronicInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElectronicInvoiceArtifact"
  ADD CONSTRAINT "ElectronicInvoiceArtifact_electronicInvoiceId_fkey"
  FOREIGN KEY ("electronicInvoiceId") REFERENCES "ElectronicInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Electronic-invoicing permissions are added to existing administrators.
INSERT INTO "Permission" ("code", "name", "updatedAt") VALUES
  ('administration.electronic-invoicing', 'Configuración de facturación electrónica', CURRENT_TIMESTAMP),
  ('sales.electronic-invoicing', 'Gestión de facturación electrónica', CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "CompanyRolePermission" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "CompanyRole" r
JOIN "Permission" p ON p."code" IN ('administration.electronic-invoicing', 'sales.electronic-invoicing')
WHERE r."name" = 'Administrador'
ON CONFLICT DO NOTHING;
