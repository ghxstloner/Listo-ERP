import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma/prisma.module';
import { InventoryTransfersController } from './inventory-transfers.controller';
import { InventoryTransfersService } from './inventory-transfers.service';
@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [InventoryTransfersController],
  providers: [InventoryTransfersService],
})
export class InventoryTransfersModule {}
