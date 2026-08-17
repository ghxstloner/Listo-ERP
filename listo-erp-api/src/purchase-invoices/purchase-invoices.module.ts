import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SeriesModule } from '../series/series.module';
import { PurchaseInvoicesController } from './purchase-invoices.controller';
import { PurchaseInvoiceReceiptService } from './purchase-invoice-receipt.service';
import { PurchaseInvoicesService } from './purchase-invoices.service';

@Module({
  imports: [PrismaModule, AuditModule, SeriesModule],
  controllers: [PurchaseInvoicesController],
  providers: [PurchaseInvoicesService, PurchaseInvoiceReceiptService],
})
export class PurchaseInvoicesModule {}
