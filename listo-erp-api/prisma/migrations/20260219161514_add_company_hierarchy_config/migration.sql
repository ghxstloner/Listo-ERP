-- CreateTable
CREATE TABLE "CompanyHierarchyConfig" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "level1Name" TEXT NOT NULL DEFAULT 'Departamento',
    "level2Name" TEXT NOT NULL DEFAULT 'Subdepartamento',
    "level3Name" TEXT NOT NULL DEFAULT 'Categoría',
    "level4Name" TEXT NOT NULL DEFAULT 'Subcategoría',

    CONSTRAINT "CompanyHierarchyConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyHierarchyConfig_companyId_key" ON "CompanyHierarchyConfig"("companyId");

-- AddForeignKey
ALTER TABLE "CompanyHierarchyConfig" ADD CONSTRAINT "CompanyHierarchyConfig_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
