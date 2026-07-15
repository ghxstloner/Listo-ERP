WITH params AS (
  SELECT 1::int AS company_id
),
seed(name, code) AS (
  VALUES
    ('Bebidas', 'BEBIDAS'),
    ('Alimentos', 'ALIMENTOS'),
    ('Limpieza', 'LIMPIEZA'),
    ('Snacks', 'SNACKS')
)
INSERT INTO "Department" (
  "name", "code", "isActive", "companyId", "createdAt", "updatedAt"
)
SELECT seed.name, seed.code, true, params.company_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM seed
CROSS JOIN params
ON CONFLICT ("companyId", "code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP;


WITH params AS (
  SELECT 1::int AS company_id
),
seed(name, tax_document_type, tax_id, address, phone, email, contact_name) AS (
  VALUES
    ('Consumidor Final', 'CF', 'CF-000001', NULL, NULL, NULL, NULL),
    ('Juan Perez', 'CEDULA', '8-123-456', 'Ciudad de Panama', '6000-0001', 'juan.perez@example.com', 'Juan Perez'),
    ('Maria Gonzalez', 'CEDULA', '8-987-654', 'San Miguelito', '6000-0002', 'maria.gonzalez@example.com', 'Maria Gonzalez'),
    ('Mini Super Central', 'RUC', '155678-1-123456', 'Via Espana', '6000-0003', 'ventas@minisupercentral.com', 'Ana Rodriguez')
)
INSERT INTO "Customer" (
  "name", "taxDocumentType", "taxId", "address", "phone", "email",
  "contactName", "isActive", "companyId", "createdAt", "updatedAt"
)
SELECT
  seed.name, seed.tax_document_type, seed.tax_id, seed.address, seed.phone,
  seed.email, seed.contact_name, true, params.company_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM seed
CROSS JOIN params
ON CONFLICT ("companyId", "taxDocumentType", "taxId") DO UPDATE SET
  "name" = EXCLUDED."name",
  "address" = EXCLUDED."address",
  "phone" = EXCLUDED."phone",
  "email" = EXCLUDED."email",
  "contactName" = EXCLUDED."contactName",
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP;

WITH params AS (
  SELECT 1::int AS company_id
),
seed(sku, name, description, sale_price, cost_price, tax_rate, unit, department_code) AS (
  VALUES
    ('BEB-001', 'Coca-Cola 350 ml', 'Lata de 350 ml', 1.25, 0.75, 0.07, 'unidad', 'BEBIDAS'),
    ('BEB-002', 'Agua Mineral 600 ml', 'Botella de agua', 0.85, 0.40, 0.07, 'unidad', 'BEBIDAS'),
    ('ALI-001', 'Pan Integral', 'Pan de molde integral', 3.50, 2.10, 0.07, 'unidad', 'ALIMENTOS'),
    ('SNA-001', 'Papas Clasicas 45 g', 'Snack de papa', 1.50, 0.80, 0.07, 'unidad', 'SNACKS'),
    ('LIM-001', 'Detergente 1 L', 'Detergente liquido', 4.75, 3.00, 0.07, 'unidad', 'LIMPIEZA')
)
INSERT INTO "Product" (
  "sku", "name", "description", "salePrice", "costPrice", "taxRate", "unit",
  "isActive", "companyId", "departmentId", "createdAt", "updatedAt"
)
SELECT
  seed.sku, seed.name, seed.description, seed.sale_price, seed.cost_price,
  seed.tax_rate, seed.unit, true, params.company_id, department."id",
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM seed
CROSS JOIN params
INNER JOIN "Department" department
  ON department."companyId" = params.company_id
 AND department."code" = seed.department_code
ON CONFLICT ("companyId", "sku") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "salePrice" = EXCLUDED."salePrice",
  "costPrice" = EXCLUDED."costPrice",
  "taxRate" = EXCLUDED."taxRate",
  "unit" = EXCLUDED."unit",
  "departmentId" = EXCLUDED."departmentId",
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP;


WITH params AS (
  SELECT
    1::int AS company_id,
    1::int AS warehouse_id
),
stock(sku, quantity) AS (
  VALUES
    ('BEB-001', 50.0000),
    ('BEB-002', 40.0000),
    ('ALI-001', 25.0000),
    ('SNA-001', 60.0000),
    ('LIM-001', 20.0000)
)
INSERT INTO "InventoryBalance" (
  "companyId", "warehouseId", "productId", "quantity", "createdAt", "updatedAt"
)
SELECT
  params.company_id, warehouse."id", product."id", stock.quantity,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM stock
CROSS JOIN params
INNER JOIN "Warehouse" warehouse
  ON warehouse."id" = params.warehouse_id
 AND warehouse."companyId" = params.company_id
INNER JOIN "Product" product
  ON product."companyId" = params.company_id
 AND product."sku" = stock.sku
ON CONFLICT ("warehouseId", "productId") DO UPDATE SET
  "quantity" = EXCLUDED."quantity",
  "updatedAt" = CURRENT_TIMESTAMP;

