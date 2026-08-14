ALTER TABLE "Company" DROP CONSTRAINT IF EXISTS "Company_operationCurrencyId_fkey";

ALTER TABLE "Company" DROP COLUMN IF EXISTS "operationCurrencyId";
