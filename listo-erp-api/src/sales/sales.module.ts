import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ElectronicInvoicingModule } from '../electronic-invoicing/electronic-invoicing.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

@Module({
  imports: [PrismaModule, AuditModule, ElectronicInvoicingModule],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}
