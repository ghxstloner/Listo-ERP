-- Replace the fixed company membership role with configurable roles and sidebar permissions.
CREATE TABLE "Permission" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CompanyRole" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CompanyRole_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CompanyRolePermission" (
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    CONSTRAINT "CompanyRolePermission_pkey" PRIMARY KEY ("roleId", "permissionId")
);

CREATE TABLE "CompanyUserRole" (
    "companyUserId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    CONSTRAINT "CompanyUserRole_pkey" PRIMARY KEY ("companyUserId", "roleId")
);

CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");
CREATE UNIQUE INDEX "CompanyRole_companyId_name_key" ON "CompanyRole"("companyId", "name");
CREATE INDEX "CompanyRole_companyId_isActive_idx" ON "CompanyRole"("companyId", "isActive");
CREATE INDEX "CompanyRolePermission_permissionId_idx" ON "CompanyRolePermission"("permissionId");
CREATE INDEX "CompanyUserRole_roleId_idx" ON "CompanyUserRole"("roleId");

ALTER TABLE "CompanyRole" ADD CONSTRAINT "CompanyRole_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyRolePermission" ADD CONSTRAINT "CompanyRolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "CompanyRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyRolePermission" ADD CONSTRAINT "CompanyRolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyUserRole" ADD CONSTRAINT "CompanyUserRole_companyUserId_fkey" FOREIGN KEY ("companyUserId") REFERENCES "CompanyUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyUserRole" ADD CONSTRAINT "CompanyUserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "CompanyRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "Permission" ("code", "name", "updatedAt") VALUES
  ('dashboard', 'Dashboard', CURRENT_TIMESTAMP),
  ('administration.general', 'Configuración general', CURRENT_TIMESTAMP),
  ('administration.branches', 'Configuración de sucursales', CURRENT_TIMESTAMP),
  ('administration.series', 'Series y consecutivos', CURRENT_TIMESTAMP),
  ('administration.currencies', 'Gestión de monedas', CURRENT_TIMESTAMP),
  ('administration.tills', 'Configuración de cajas', CURRENT_TIMESTAMP),
  ('inventory.catalogs', 'Catálogos maestros', CURRENT_TIMESTAMP),
  ('inventory.products', 'Productos', CURRENT_TIMESTAMP),
  ('inventory.services', 'Servicios', CURRENT_TIMESTAMP),
  ('inventory.control', 'Control de inventario', CURRENT_TIMESTAMP),
  ('inventory.transfers', 'Transferencias entre almacenes', CURRENT_TIMESTAMP),
  ('purchases.suppliers', 'Proveedores', CURRENT_TIMESTAMP),
  ('purchases.orders', 'Órdenes de compra', CURRENT_TIMESTAMP),
  ('purchases.billing', 'Facturación de proveedor', CURRENT_TIMESTAMP),
  ('sales.catalogs', 'Catálogos comerciales', CURRENT_TIMESTAMP),
  ('sales.customers', 'Clientes', CURRENT_TIMESTAMP),
  ('sales.sellers', 'Vendedores', CURRENT_TIMESTAMP),
  ('sales.cash-closures', 'Cierres de caja', CURRENT_TIMESTAMP),
  ('sales.pos', 'Punto de venta', CURRENT_TIMESTAMP),
  ('sales.orders', 'Pedidos', CURRENT_TIMESTAMP),
  ('sales.quick-billing', 'Facturación rápida', CURRENT_TIMESTAMP),
  ('sales.credit-notes', 'Notas de crédito', CURRENT_TIMESTAMP),
  ('treasury.bank-accounts', 'Cuentas bancarias', CURRENT_TIMESTAMP),
  ('treasury.customer-payments', 'Cobros a clientes', CURRENT_TIMESTAMP),
  ('treasury.financial-movements', 'Movimientos financieros', CURRENT_TIMESTAMP),
  ('reports.purchase-book', 'Libro de compras', CURRENT_TIMESTAMP),
  ('reports.sales-book', 'Libro de ventas', CURRENT_TIMESTAMP),
  ('reports.sales-by-article', 'Ventas por artículo', CURRENT_TIMESTAMP),
  ('reports.sales-by-customer', 'Ventas por cliente', CURRENT_TIMESTAMP),
  ('reports.purchases-by-supplier', 'Compras por proveedor', CURRENT_TIMESTAMP);

-- Existing memberships retain access until an administrator configures custom roles.
INSERT INTO "CompanyRole" ("companyId", "name", "description", "updatedAt")
SELECT "id", 'Administrador', 'Acceso inicial completo; puede reemplazarse por roles personalizados.', CURRENT_TIMESTAMP
FROM "Company";

INSERT INTO "CompanyRolePermission" ("roleId", "permissionId")
SELECT r."id", p."id" FROM "CompanyRole" r CROSS JOIN "Permission" p WHERE r."name" = 'Administrador';

INSERT INTO "CompanyUserRole" ("companyUserId", "roleId")
SELECT cu."id", r."id" FROM "CompanyUser" cu
JOIN "CompanyRole" r ON r."companyId" = cu."companyId" AND r."name" = 'Administrador';

ALTER TABLE "CompanyUser" DROP COLUMN "role";
