INSERT INTO "Permission" ("code", "name", "updatedAt") VALUES
  ('sales.electronic-invoices', 'Facturas electrónicas', CURRENT_TIMESTAMP);

INSERT INTO "CompanyRolePermission" ("roleId", "permissionId")
SELECT r."id", p."id" FROM "CompanyRole" r CROSS JOIN "Permission" p 
WHERE r."name" = 'Administrador' AND p."code" = 'sales.electronic-invoices';
