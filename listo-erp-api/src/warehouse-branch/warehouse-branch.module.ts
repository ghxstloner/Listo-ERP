import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WarehouseBranchController } from './warehouse-branch.controller';
import { WarehouseBranchService } from './warehouse-branch.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [WarehouseBranchController],
  providers: [WarehouseBranchService],
  exports: [WarehouseBranchService],
})
export class WarehouseBranchModule {}
