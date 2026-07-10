-- Seed global catalogs required by the application.
INSERT INTO "Country" ("code", "name", "taxDocumentTypes", "isActive", "updatedAt")
VALUES
  ('PA', 'Panamá', '[{"code":"RUC","name":"RUC","hasCheckDigit":true}]'::jsonb, true, CURRENT_TIMESTAMP),
  ('VE', 'Venezuela', '[{"code":"RIF","name":"RIF","hasCheckDigit":false}]'::jsonb, true, CURRENT_TIMESTAMP),
  ('CO', 'Colombia', '[{"code":"NIT","name":"NIT","hasCheckDigit":true}]'::jsonb, true, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "taxDocumentTypes" = EXCLUDED."taxDocumentTypes",
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Currency" ("code", "name", "symbol", "updatedAt")
VALUES
  ('USD', 'US Dollar', '$', CURRENT_TIMESTAMP),
  ('PAB', 'Balboa', 'B/.', CURRENT_TIMESTAMP),
  ('VES', 'Bolívar', 'Bs.', CURRENT_TIMESTAMP),
  ('COP', 'Peso colombiano', '$', CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "symbol" = EXCLUDED."symbol",
  "updatedAt" = CURRENT_TIMESTAMP;

-- Demo company for fresh local/demo environments.
INSERT INTO "Company" (
  "name",
  "primaryColor",
  "secondaryColor",
  "isActive",
  "companyLogo",
  "countryId",
  "defaultCurrencyId",
  "updatedAt"
)
SELECT
  'Demo',
  '#ff6600',
  '#180900',
  true,
  '',
  (SELECT "id" FROM "Country" WHERE "code" = 'PA'),
  (SELECT "id" FROM "Currency" WHERE "code" = 'USD'),
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "Company" WHERE "name" = 'Demo'
);

INSERT INTO "CompanyHierarchyConfig" (
  "companyId",
  "level1Name",
  "level2Name",
  "level3Name",
  "level4Name"
)
SELECT
  "id",
  'Departamento',
  'Subdepartamento',
  'Categoría',
  'Subcategoría'
FROM "Company"
WHERE "name" = 'Demo'
ON CONFLICT ("companyId") DO NOTHING;

-- Default payment methods are company-scoped, so backfill every current company.
INSERT INTO "PaymentMethod" (
  "companyId",
  "name",
  "code",
  "requiresReference",
  "isActive",
  "updatedAt"
)
SELECT
  c."id",
  pm."name",
  pm."code",
  pm."requiresReference",
  true,
  CURRENT_TIMESTAMP
FROM "Company" c
CROSS JOIN (
  VALUES
    ('Efectivo', 'CASH', false),
    ('Tarjeta', 'CARD', true),
    ('Transferencia', 'TRANSFER', true)
) AS pm("name", "code", "requiresReference")
ON CONFLICT ("companyId", "code") DO NOTHING;
