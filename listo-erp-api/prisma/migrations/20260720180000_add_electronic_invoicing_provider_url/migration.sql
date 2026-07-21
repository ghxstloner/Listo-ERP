-- Provider endpoints are configured independently for each company and country.
ALTER TABLE "ElectronicInvoicingConfiguration" ADD COLUMN "providerBaseUrl" TEXT;
