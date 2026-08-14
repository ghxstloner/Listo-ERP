import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SeriesModule } from '../series/series.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [PrismaModule, AuditModule, SeriesModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
