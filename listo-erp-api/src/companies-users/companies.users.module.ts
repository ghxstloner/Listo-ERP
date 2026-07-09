import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CompaniesUsersController } from './companies.users.controller';
import { CompaniesUsersService } from './companies.users.service';

@Module({
  imports: [PrismaModule],
  controllers: [CompaniesUsersController],
  providers: [CompaniesUsersService],
  exports: [CompaniesUsersService],
})
export class CompaniesUsersModule {}
