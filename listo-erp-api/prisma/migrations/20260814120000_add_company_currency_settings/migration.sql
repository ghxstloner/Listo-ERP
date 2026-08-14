ALTER TABLE "Company" ADD COLUMN "operationCurrencyId" INTEGER;

CREATE TABLE "CompanyCurrency" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "currencyId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "symbol" TEXT NOT NULL,
    "decimalPlaces" INTEGER NOT NULL DEFAULT 2,
    "decimalSeparator" TEXT NOT NULL DEFAULT '.',
    "thousandsSeparator" TEXT NOT NULL DEFAULT ',',
    "format" TEXT NOT NULL DEFAULT 'symbol_before',
    "rounding" TEXT NOT NULL DEFAULT 'half_up',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyCurrency_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CompanyCurrency_companyId_currencyId_key"
    ON "CompanyCurrency"("companyId", "currencyId");

CREATE INDEX "CompanyCurrency_companyId_isActive_idx"
    ON "CompanyCurrency"("companyId", "isActive");

UPDATE "Company" SET "operationCurrencyId" = "defaultCurrencyId"
WHERE "defaultCurrencyId" IS NOT NULL AND "operationCurrencyId" IS NULL;

INSERT INTO "CompanyCurrency" (
    "companyId", "currencyId", "isActive", "symbol", "updatedAt"
)
SELECT
    c."id", cur."id",
    cur."code" IN ('COP', 'USD', 'VES')
      OR c."defaultCurrencyId" = cur."id"
      OR c."operationCurrencyId" = cur."id",
    cur."symbol", CURRENT_TIMESTAMP
FROM "Company" c
CROSS JOIN "Currency" cur
ON CONFLICT ("companyId", "currencyId") DO NOTHING;

ALTER TABLE "CompanyCurrency"
    ADD CONSTRAINT "CompanyCurrency_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CompanyCurrency"
    ADD CONSTRAINT "CompanyCurrency_currencyId_fkey"
    FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Company"
    ADD CONSTRAINT "Company_operationCurrencyId_fkey"
    FOREIGN KEY ("operationCurrencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
