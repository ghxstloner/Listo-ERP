-- CreateEnum
CREATE TYPE "SeriesModule" AS ENUM ('ORDERS');

-- CreateTable
CREATE TABLE "Series" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "consecutive" INTEGER NOT NULL DEFAULT 1,
    "module" "SeriesModule" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Series_companyId_idx" ON "Series"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Series_companyId_module_key" ON "Series"("companyId", "module");

-- AddForeignKey
ALTER TABLE "Series" ADD CONSTRAINT "Series_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
