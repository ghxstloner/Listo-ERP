import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TillsController } from './tills.controller';
import { TillsService } from './tills.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [TillsController],
  providers: [TillsService],
  exports: [TillsService],
})
export class TillsModule {}
