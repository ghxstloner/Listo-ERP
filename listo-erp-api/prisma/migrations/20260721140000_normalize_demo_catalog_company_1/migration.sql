-- Normalize the initial catalog into a commercial fixture for company 1.
DO $$
DECLARE
  target_company_id INTEGER := 1;
  active_user_id INTEGER;
  groceries_department_id INTEGER;
  groceries_subdepartment_id INTEGER;
  home_care_department_id INTEGER;
  home_care_subdepartment_id INTEGER;
  food_category_id INTEGER;
  drinks_category_id INTEGER;
  care_category_id INTEGER;
  warehouse_id INTEGER;
  balance_row RECORD;
BEGIN
  SELECT cu."userId"
  INTO active_user_id
  FROM "CompanyUser" cu
  JOIN "User" u ON u."id" = cu."userId"
  WHERE cu."companyId" = target_company_id AND u."isActive" = true
  ORDER BY cu."id"
  LIMIT 1;

  SELECT "id"
  INTO groceries_department_id
  FROM "Department"
  WHERE "companyId" = target_company_id AND "code" = 'POS-TEST';

  IF groceries_department_id IS NULL THEN
    RAISE EXCEPTION 'Cannot normalize commercial catalog: source department is missing for company %', target_company_id;
  END IF;

  SELECT "id"
  INTO groceries_subdepartment_id
  FROM "Subdepartment"
  WHERE "companyId" = target_company_id AND "code" = 'POS-TEST-CATALOG';

  IF groceries_subdepartment_id IS NULL THEN
    RAISE EXCEPTION 'Cannot normalize commercial catalog: source subdepartment is missing for company %', target_company_id;
  END IF;

  SELECT "id" INTO food_category_id
  FROM "Category"
  WHERE "companyId" = target_company_id AND "code" = 'POS-TEST-FOOD';

  SELECT "id" INTO drinks_category_id
  FROM "Category"
  WHERE "companyId" = target_company_id AND "code" = 'POS-TEST-DRINKS';

  SELECT "id" INTO care_category_id
  FROM "Category"
  WHERE "companyId" = target_company_id AND "code" = 'POS-TEST-CARE';

  IF food_category_id IS NULL OR drinks_category_id IS NULL OR care_category_id IS NULL THEN
    RAISE EXCEPTION 'Cannot normalize commercial catalog: source categories are missing for company %', target_company_id;
  END IF;

  INSERT INTO "Department" ("name", "code", "isActive", "companyId", "updatedAt")
  VALUES ('Cuidado del hogar San Miguel', 'SMG-HOGAR', true, target_company_id, CURRENT_TIMESTAMP)
  ON CONFLICT ("companyId", "code") DO UPDATE SET "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id" INTO home_care_department_id;

  INSERT INTO "Subdepartment" ("name", "code", "isActive", "departmentId", "companyId", "updatedAt")
  VALUES ('Higiene y limpieza San Miguel', 'SMG-HIGIENE', true, home_care_department_id, target_company_id, CURRENT_TIMESTAMP)
  ON CONFLICT ("companyId", "code") DO UPDATE SET "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id" INTO home_care_subdepartment_id;

  UPDATE "Department"
  SET "name" = 'Abarrotes San Miguel', "code" = 'SMG-ABARROTES', "updatedAt" = CURRENT_TIMESTAMP
  WHERE "id" = groceries_department_id;

  UPDATE "Subdepartment"
  SET "name" = 'Alimentos y bebidas San Miguel', "code" = 'SMG-ALIMENTOS', "updatedAt" = CURRENT_TIMESTAMP
  WHERE "id" = groceries_subdepartment_id;

  UPDATE "Category"
  SET "name" = 'Snacks y dulces', "code" = 'SMG-SNACKS', "updatedAt" = CURRENT_TIMESTAMP
  WHERE "id" = food_category_id;

  UPDATE "Category"
  SET "name" = 'Bebidas', "code" = 'SMG-BEBIDAS', "updatedAt" = CURRENT_TIMESTAMP
  WHERE "id" = drinks_category_id;

  UPDATE "Category"
  SET
    "name" = 'Higiene y limpieza',
    "code" = 'SMG-LIMPIEZA',
    "subdepartmentId" = home_care_subdepartment_id,
    "updatedAt" = CURRENT_TIMESTAMP
  WHERE "id" = care_category_id;

  UPDATE "Subcategory"
  SET "name" = 'Pasabocas', "code" = 'SMG-PASABOCAS', "updatedAt" = CURRENT_TIMESTAMP
  WHERE "companyId" = target_company_id AND "code" = 'POS-TEST-SNACKS';

  UPDATE "Subcategory"
  SET "name" = 'Confitería', "code" = 'SMG-CONFITERIA', "updatedAt" = CURRENT_TIMESTAMP
  WHERE "companyId" = target_company_id AND "code" = 'POS-TEST-SWEETS';

  UPDATE "Subcategory"
  SET "name" = 'Agua e hidratación', "code" = 'SMG-HIDRATACION', "updatedAt" = CURRENT_TIMESTAMP
  WHERE "companyId" = target_company_id AND "code" = 'POS-TEST-WATER';

  UPDATE "Subcategory"
  SET "name" = 'Gaseosas y jugos', "code" = 'SMG-GASEOSAS', "updatedAt" = CURRENT_TIMESTAMP
  WHERE "companyId" = target_company_id AND "code" = 'POS-TEST-SOFT-DRINKS';

  UPDATE "Subcategory"
  SET "name" = 'Higiene personal', "code" = 'SMG-PERSONAL', "updatedAt" = CURRENT_TIMESTAMP
  WHERE "companyId" = target_company_id AND "code" = 'POS-TEST-HYGIENE';

  UPDATE "Subcategory"
  SET "name" = 'Limpieza del hogar', "code" = 'SMG-LIMPIEZA-HOGAR', "updatedAt" = CURRENT_TIMESTAMP
  WHERE "companyId" = target_company_id AND "code" = 'POS-TEST-CLEANING';

  UPDATE "Product"
  SET
    "sku" = REPLACE("sku", 'POS-TEST-', 'SMG-'),
    "departmentId" = home_care_department_id,
    "subdepartmentId" = home_care_subdepartment_id,
    "updatedAt" = CURRENT_TIMESTAMP
  WHERE "companyId" = target_company_id
    AND "categoryId" = care_category_id
    AND "sku" LIKE 'POS-TEST-%';

  UPDATE "Product"
  SET "sku" = REPLACE("sku", 'POS-TEST-', 'SMG-'), "updatedAt" = CURRENT_TIMESTAMP
  WHERE "companyId" = target_company_id AND "sku" LIKE 'POS-TEST-%';

  UPDATE "branch"
  SET
    "name" = 'Sede San Miguel',
    "address" = 'Avenida San Miguel',
    "branchCode" = 'SMG-001',
    "updatedAt" = CURRENT_TIMESTAMP
  WHERE "companyId" = target_company_id AND "branchCode" = 'POS-TEST-01';

  UPDATE "Warehouse"
  SET
    "name" = 'Bodega San Miguel',
    "address" = 'Avenida San Miguel',
    "code" = 'SMG-BOD-01',
    "updatedAt" = CURRENT_TIMESTAMP
  WHERE "companyId" = target_company_id AND "code" = 'POS-TEST-WH';

  UPDATE "till"
  SET
    "tillName" = 'Caja Principal',
    "tillCode" = 'SMG-CAJA-01',
    "updatedAt" = CURRENT_TIMESTAMP
  WHERE "companyId" = target_company_id AND "tillCode" = 'POS-TEST-01';

  UPDATE "Customer"
  SET
    "name" = 'Consumidor final',
    "taxId" = NULL,
    "taxDocumentType" = NULL,
    "updatedAt" = CURRENT_TIMESTAMP
  WHERE "companyId" = target_company_id
    AND "taxDocumentType" = 'POS'
    AND "taxId" = 'POS-TEST-FINAL-CONSUMER';

  UPDATE "Seller"
  SET "name" = 'Laura Martínez', "code" = 'SMG-V01', "updatedAt" = CURRENT_TIMESTAMP
  WHERE "companyId" = target_company_id AND "code" = 'POS-TEST';

  SELECT "id"
  INTO warehouse_id
  FROM "Warehouse"
  WHERE "companyId" = target_company_id AND "code" = 'SMG-BOD-01';

  IF warehouse_id IS NULL THEN
    RAISE EXCEPTION 'Cannot normalize commercial catalog: source warehouse is missing for company %', target_company_id;
  END IF;

  FOR balance_row IN
    SELECT
      p."id" AS product_id,
      p."costPrice" AS cost_price,
      COALESCE(ib."quantity", 0) AS previous_quantity
    FROM "Product" p
    LEFT JOIN "InventoryBalance" ib
      ON ib."companyId" = target_company_id
      AND ib."warehouseId" = warehouse_id
      AND ib."productId" = p."id"
    WHERE p."companyId" = target_company_id
      AND p."sku" ~ '^SMG-(00[1-9]|0[12][0-9]|030)$'
  LOOP
    IF active_user_id IS NOT NULL AND balance_row.previous_quantity <> 30 THEN
      INSERT INTO "InventoryMovement" (
        "companyId", "warehouseId", "productId", "type", "quantity", "unitCost", "balanceAfter", "createdByUserId"
      ) VALUES (
        target_company_id,
        warehouse_id,
        balance_row.product_id,
        'INVENTORY_ADJUSTMENT',
        30 - balance_row.previous_quantity,
        COALESCE(balance_row.cost_price, 0),
        30,
        active_user_id
      );
    END IF;

    INSERT INTO "InventoryBalance" ("companyId", "warehouseId", "productId", "quantity", "updatedAt")
    VALUES (target_company_id, warehouse_id, balance_row.product_id, 30, CURRENT_TIMESTAMP)
    ON CONFLICT ("warehouseId", "productId") DO UPDATE
    SET "quantity" = EXCLUDED."quantity", "updatedAt" = CURRENT_TIMESTAMP;
  END LOOP;
END $$;
