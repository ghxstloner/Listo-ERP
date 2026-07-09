import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SubdepartmentsController } from './subdepartments.controller';
import { SubdepartmentsService } from './subdepartments.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [SubdepartmentsController],
  providers: [SubdepartmentsService],
  exports: [SubdepartmentsService],
})
export class SubdepartmentsModule {}
