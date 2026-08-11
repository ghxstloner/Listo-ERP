-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_paymentMethodId_fkey";

-- AlterTable
ALTER TABLE "PaymentMethod" DROP COLUMN "requiresReference";

-- AlterTable
ALTER TABLE "SalePayment" DROP COLUMN "reference";

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
