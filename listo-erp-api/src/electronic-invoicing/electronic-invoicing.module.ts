import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CredentialsService } from './credentials.service';
import { ElectronicInvoicingController } from './electronic-invoicing.controller';
import { ElectronicInvoicingService } from './electronic-invoicing.service';
import { ElectronicInvoiceDispatcher } from './electronic-invoice-dispatcher.service';
import { InvoicePayloadFactory } from './invoice-payload.factory';
import { ReceiptPdfService } from './receipt-pdf.service';
import { TheFactoryClient } from './the-factory.client';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ElectronicInvoicingController],
  providers: [
    CredentialsService,
    InvoicePayloadFactory,
    ReceiptPdfService,
    TheFactoryClient,
    ElectronicInvoiceDispatcher,
    ElectronicInvoicingService,
  ],
  exports: [ElectronicInvoicingService, ElectronicInvoiceDispatcher],
})
export class ElectronicInvoicingModule {}
