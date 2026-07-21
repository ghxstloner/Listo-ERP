-- Seed a self-contained POS test catalog for production company 1.
-- All identifiers use the POS-TEST prefix so this migration is safe to rerun.
DO $$
DECLARE
  target_company_id INTEGER := 1;
  active_user_id INTEGER;
  department_id INTEGER;
  subdepartment_id INTEGER;
  category_food_id INTEGER;
  category_drinks_id INTEGER;
  category_personal_care_id INTEGER;
  subcategory_snacks_id INTEGER;
  subcategory_sweets_id INTEGER;
  subcategory_water_id INTEGER;
  subcategory_soft_drinks_id INTEGER;
  subcategory_hygiene_id INTEGER;
  subcategory_cleaning_id INTEGER;
  branch_id INTEGER;
  warehouse_id INTEGER;
  customer_id INTEGER;
  seller_id INTEGER;
  till_id INTEGER;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "Company" WHERE "id" = target_company_id AND "isActive" = true
  ) THEN
    RAISE EXCEPTION 'Cannot seed POS test data: active company % does not exist', target_company_id;
  END IF;

  SELECT cu."userId"
  INTO active_user_id
  FROM "CompanyUser" cu
  JOIN "User" u ON u."id" = cu."userId"
  WHERE cu."companyId" = target_company_id AND u."isActive" = true
  ORDER BY cu."id"
  LIMIT 1;

  IF NOT EXISTS (
    SELECT 1
    FROM "PaymentMethod"
    WHERE "companyId" = target_company_id AND "isActive" = true
  ) THEN
    RAISE EXCEPTION 'Cannot seed POS test data: company % has no active payment method', target_company_id;
  END IF;

  -- Colombia requires a DIAN payment-mean code to register a sale.
  UPDATE "PaymentMethod" pm
  SET
    "dianCode" = CASE pm."code"
      WHEN 'CASH' THEN '10'
      WHEN 'TRANSFER' THEN '42'
      WHEN 'CARD' THEN '49'
    END,
    "updatedAt" = CURRENT_TIMESTAMP
  FROM "Company" c
  WHERE c."id" = target_company_id
    AND c."countryId" = (SELECT "id" FROM "Country" WHERE "code" = 'CO')
    AND pm."companyId" = target_company_id
    AND pm."dianCode" IS NULL
    AND pm."code" IN ('CASH', 'TRANSFER', 'CARD');

  IF EXISTS (
    SELECT 1
    FROM "Company" c
    WHERE c."id" = target_company_id
      AND c."countryId" = (SELECT "id" FROM "Country" WHERE "code" = 'CO')
      AND NOT EXISTS (
        SELECT 1
        FROM "PaymentMethod" pm
        WHERE pm."companyId" = target_company_id
          AND pm."isActive" = true
          AND pm."dianCode" IS NOT NULL
      )
  ) THEN
    RAISE EXCEPTION 'Cannot seed POS test data: Colombia company % has no active payment method with a DIAN code', target_company_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM "branch"
    WHERE "branchCode" = 'POS-TEST-01' AND "companyId" <> target_company_id
  ) OR EXISTS (
    SELECT 1 FROM "Warehouse"
    WHERE "code" = 'POS-TEST-WH' AND "companyId" <> target_company_id
  ) OR EXISTS (
    SELECT 1 FROM "till"
    WHERE "tillCode" = 'POS-TEST-01' AND "companyId" <> target_company_id
  ) THEN
    RAISE EXCEPTION 'Cannot seed POS test data: a POS-TEST identifier belongs to another company';
  END IF;

  INSERT INTO "Department" ("name", "code", "isActive", "companyId", "updatedAt")
  VALUES ('Productos de prueba POS', 'POS-TEST', true, target_company_id, CURRENT_TIMESTAMP)
  ON CONFLICT ("companyId", "code") DO UPDATE SET "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id" INTO department_id;

  INSERT INTO "Subdepartment" ("name", "code", "isActive", "departmentId", "companyId", "updatedAt")
  VALUES ('Catálogo POS', 'POS-TEST-CATALOG', true, department_id, target_company_id, CURRENT_TIMESTAMP)
  ON CONFLICT ("companyId", "code") DO UPDATE SET "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id" INTO subdepartment_id;

  INSERT INTO "Category" ("name", "code", "isActive", "subdepartmentId", "companyId", "updatedAt")
  VALUES ('Alimentos', 'POS-TEST-FOOD', true, subdepartment_id, target_company_id, CURRENT_TIMESTAMP)
  ON CONFLICT ("companyId", "code") DO UPDATE SET "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id" INTO category_food_id;

  INSERT INTO "Category" ("name", "code", "isActive", "subdepartmentId", "companyId", "updatedAt")
  VALUES ('Bebidas', 'POS-TEST-DRINKS', true, subdepartment_id, target_company_id, CURRENT_TIMESTAMP)
  ON CONFLICT ("companyId", "code") DO UPDATE SET "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id" INTO category_drinks_id;

  INSERT INTO "Category" ("name", "code", "isActive", "subdepartmentId", "companyId", "updatedAt")
  VALUES ('Cuidado personal', 'POS-TEST-CARE', true, subdepartment_id, target_company_id, CURRENT_TIMESTAMP)
  ON CONFLICT ("companyId", "code") DO UPDATE SET "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id" INTO category_personal_care_id;

  INSERT INTO "Subcategory" ("name", "code", "isActive", "categoryId", "companyId", "updatedAt")
  VALUES ('Snacks', 'POS-TEST-SNACKS', true, category_food_id, target_company_id, CURRENT_TIMESTAMP)
  ON CONFLICT ("companyId", "code") DO UPDATE SET "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id" INTO subcategory_snacks_id;

  INSERT INTO "Subcategory" ("name", "code", "isActive", "categoryId", "companyId", "updatedAt")
  VALUES ('Dulces', 'POS-TEST-SWEETS', true, category_food_id, target_company_id, CURRENT_TIMESTAMP)
  ON CONFLICT ("companyId", "code") DO UPDATE SET "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id" INTO subcategory_sweets_id;

  INSERT INTO "Subcategory" ("name", "code", "isActive", "categoryId", "companyId", "updatedAt")
  VALUES ('Agua', 'POS-TEST-WATER', true, category_drinks_id, target_company_id, CURRENT_TIMESTAMP)
  ON CONFLICT ("companyId", "code") DO UPDATE SET "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id" INTO subcategory_water_id;

  INSERT INTO "Subcategory" ("name", "code", "isActive", "categoryId", "companyId", "updatedAt")
  VALUES ('Gaseosas', 'POS-TEST-SOFT-DRINKS', true, category_drinks_id, target_company_id, CURRENT_TIMESTAMP)
  ON CONFLICT ("companyId", "code") DO UPDATE SET "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id" INTO subcategory_soft_drinks_id;

  INSERT INTO "Subcategory" ("name", "code", "isActive", "categoryId", "companyId", "updatedAt")
  VALUES ('Higiene', 'POS-TEST-HYGIENE', true, category_personal_care_id, target_company_id, CURRENT_TIMESTAMP)
  ON CONFLICT ("companyId", "code") DO UPDATE SET "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id" INTO subcategory_hygiene_id;

  INSERT INTO "Subcategory" ("name", "code", "isActive", "categoryId", "companyId", "updatedAt")
  VALUES ('Limpieza', 'POS-TEST-CLEANING', true, category_personal_care_id, target_company_id, CURRENT_TIMESTAMP)
  ON CONFLICT ("companyId", "code") DO UPDATE SET "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id" INTO subcategory_cleaning_id;

  INSERT INTO "branch" ("name", "address", "phone", "branchCode", "isActive", "companyId", "updatedAt")
  VALUES ('Sucursal de prueba POS', 'Sucursal de prueba para POS', NULL, 'POS-TEST-01', true, target_company_id, CURRENT_TIMESTAMP)
  ON CONFLICT ("branchCode") DO UPDATE SET "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id" INTO branch_id;

  INSERT INTO "Warehouse" ("name", "code", "address", "isActive", "companyId", "updatedAt")
  VALUES ('Bodega de prueba POS', 'POS-TEST-WH', 'Bodega de prueba para POS', true, target_company_id, CURRENT_TIMESTAMP)
  ON CONFLICT ("code") DO UPDATE SET "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id" INTO warehouse_id;

  INSERT INTO "WarehouseBranch" ("warehouseId", "branchId")
  VALUES (warehouse_id, branch_id)
  ON CONFLICT ("warehouseId", "branchId") DO NOTHING;

  INSERT INTO "Customer" (
    "name", "taxId", "taxDocumentType", "isFinalConsumer", "isActive", "companyId", "updatedAt"
  ) VALUES (
    'Consumidor final POS', 'POS-TEST-FINAL-CONSUMER', 'POS', true, true, target_company_id, CURRENT_TIMESTAMP
  )
  ON CONFLICT ("companyId", "taxDocumentType", "taxId") DO UPDATE SET "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id" INTO customer_id;

  INSERT INTO "Seller" ("code", "name", "isActive", "companyId", "updatedAt")
  VALUES ('POS-TEST', 'Vendedor de prueba POS', true, target_company_id, CURRENT_TIMESTAMP)
  ON CONFLICT ("companyId", "code") DO UPDATE SET "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id" INTO seller_id;

  INSERT INTO "SellerUser" ("sellerId", "userId", "companyId")
  SELECT seller_id, cu."userId", target_company_id
  FROM "CompanyUser" cu
  JOIN "User" u ON u."id" = cu."userId"
  WHERE cu."companyId" = target_company_id AND u."isActive" = true
  ON CONFLICT ("sellerId", "userId") DO NOTHING;

  INSERT INTO "till" ("tillCode", "tillName", "isActive", "companyId", "branchId", "updatedAt")
  VALUES ('POS-TEST-01', 'Caja de prueba POS', true, target_company_id, branch_id, CURRENT_TIMESTAMP)
  ON CONFLICT ("tillCode") DO UPDATE SET "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id" INTO till_id;

  INSERT INTO "TillPaymentMethod" ("tillId", "paymentMethodId")
  SELECT till_id, pm."id"
  FROM "PaymentMethod" pm
  WHERE pm."companyId" = target_company_id AND pm."isActive" = true
  ON CONFLICT ("tillId", "paymentMethodId") DO NOTHING;

  INSERT INTO "Product" (
    "sku", "name", "salePrice", "costPrice", "taxRate", "isActive", "companyId",
    "departmentId", "subdepartmentId", "categoryId", "subcategoryId", "unit", "dianCode", "updatedAt"
  )
  SELECT
    p.sku, p.name, p.sale_price, p.cost_price, p.tax_rate, true, target_company_id,
    department_id, subdepartment_id, p.category_id, p.subcategory_id, 'UND', 'ZZ', CURRENT_TIMESTAMP
  FROM (VALUES
    ('POS-TEST-001', 'Papas clásicas', 2.50, 1.10, 0.00, category_food_id, subcategory_snacks_id),
    ('POS-TEST-002', 'Papas barbecue', 2.75, 1.20, 0.00, category_food_id, subcategory_snacks_id),
    ('POS-TEST-003', 'Maní salado', 1.80, 0.75, 0.00, category_food_id, subcategory_snacks_id),
    ('POS-TEST-004', 'Galletas saladas', 2.20, 0.95, 0.00, category_food_id, subcategory_snacks_id),
    ('POS-TEST-005', 'Palomitas de maíz', 2.00, 0.85, 0.00, category_food_id, subcategory_snacks_id),
    ('POS-TEST-006', 'Barra de cereal', 1.95, 0.80, 0.00, category_food_id, subcategory_snacks_id),
    ('POS-TEST-007', 'Chocolate con leche', 1.50, 0.60, 0.00, category_food_id, subcategory_sweets_id),
    ('POS-TEST-008', 'Chocolate oscuro', 1.75, 0.70, 0.00, category_food_id, subcategory_sweets_id),
    ('POS-TEST-009', 'Gomitas frutales', 1.25, 0.45, 0.00, category_food_id, subcategory_sweets_id),
    ('POS-TEST-010', 'Caramelos surtidos', 1.10, 0.40, 0.00, category_food_id, subcategory_sweets_id),
    ('POS-TEST-011', 'Chicle menta', 0.75, 0.25, 0.00, category_food_id, subcategory_sweets_id),
    ('POS-TEST-012', 'Galletas rellenas', 1.65, 0.65, 0.00, category_food_id, subcategory_sweets_id),
    ('POS-TEST-013', 'Agua mineral 500 ml', 1.00, 0.35, 0.00, category_drinks_id, subcategory_water_id),
    ('POS-TEST-014', 'Agua mineral 1 L', 1.50, 0.55, 0.00, category_drinks_id, subcategory_water_id),
    ('POS-TEST-015', 'Agua con gas 500 ml', 1.25, 0.45, 0.00, category_drinks_id, subcategory_water_id),
    ('POS-TEST-016', 'Agua sabor limón', 1.35, 0.50, 0.00, category_drinks_id, subcategory_water_id),
    ('POS-TEST-017', 'Agua sabor frutos rojos', 1.35, 0.50, 0.00, category_drinks_id, subcategory_water_id),
    ('POS-TEST-018', 'Bebida isotónica', 2.30, 0.95, 0.00, category_drinks_id, subcategory_water_id),
    ('POS-TEST-019', 'Gaseosa cola 500 ml', 1.80, 0.70, 0.00, category_drinks_id, subcategory_soft_drinks_id),
    ('POS-TEST-020', 'Gaseosa naranja 500 ml', 1.80, 0.70, 0.00, category_drinks_id, subcategory_soft_drinks_id),
    ('POS-TEST-021', 'Gaseosa limón 500 ml', 1.80, 0.70, 0.00, category_drinks_id, subcategory_soft_drinks_id),
    ('POS-TEST-022', 'Té frío limón', 2.10, 0.85, 0.00, category_drinks_id, subcategory_soft_drinks_id),
    ('POS-TEST-023', 'Jugo de naranja', 2.20, 0.90, 0.00, category_drinks_id, subcategory_soft_drinks_id),
    ('POS-TEST-024', 'Bebida energética', 3.25, 1.45, 0.00, category_drinks_id, subcategory_soft_drinks_id),
    ('POS-TEST-025', 'Jabón de manos', 2.80, 1.15, 0.00, category_personal_care_id, subcategory_hygiene_id),
    ('POS-TEST-026', 'Gel antibacterial', 3.50, 1.55, 0.00, category_personal_care_id, subcategory_hygiene_id),
    ('POS-TEST-027', 'Pasta dental', 3.10, 1.30, 0.00, category_personal_care_id, subcategory_hygiene_id),
    ('POS-TEST-028', 'Toallas húmedas', 2.60, 1.05, 0.00, category_personal_care_id, subcategory_hygiene_id),
    ('POS-TEST-029', 'Detergente líquido', 4.75, 2.20, 0.00, category_personal_care_id, subcategory_cleaning_id),
    ('POS-TEST-030', 'Limpiador multiusos', 3.90, 1.70, 0.00, category_personal_care_id, subcategory_cleaning_id)
  ) AS p(sku, name, sale_price, cost_price, tax_rate, category_id, subcategory_id)
  ON CONFLICT ("companyId", "sku") DO NOTHING;

  INSERT INTO "InventoryBalance" ("companyId", "warehouseId", "productId", "quantity", "updatedAt")
  SELECT target_company_id, warehouse_id, p."id", 30, CURRENT_TIMESTAMP
  FROM "Product" p
  WHERE p."companyId" = target_company_id AND p."sku" LIKE 'POS-TEST-%'
  ON CONFLICT ("warehouseId", "productId") DO NOTHING;

  INSERT INTO "InventoryMovement" (
    "companyId", "warehouseId", "productId", "type", "quantity", "unitCost", "balanceAfter", "createdByUserId"
  )
  SELECT
    target_company_id, warehouse_id, p."id", 'MANUAL_ENTRY', 30, COALESCE(p."costPrice", 0), 30, active_user_id
  FROM "Product" p
  WHERE p."companyId" = target_company_id
    AND p."sku" LIKE 'POS-TEST-%'
    -- Shadow databases contain schema data only; production records movements with an active user.
    AND active_user_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM "InventoryMovement" im
      WHERE im."companyId" = target_company_id
        AND im."warehouseId" = warehouse_id
        AND im."productId" = p."id"
        AND im."type" = 'MANUAL_ENTRY'
    );

  UPDATE "Company"
  SET
    "defaultCustomerId" = COALESCE("defaultCustomerId", customer_id),
    "defaultSellerId" = COALESCE("defaultSellerId", seller_id),
    "updatedAt" = CURRENT_TIMESTAMP
  WHERE "id" = target_company_id;
END $$;
