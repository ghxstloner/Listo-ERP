import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { BranchesModule } from './branches/branches.module';
import { CashSessionsModule } from './cash-sessions/cash-sessions.module';
import { CategoriesModule } from './categories/categories.module';
import { CompanyAccessGuard } from './common/guards/company-access.guard';
import { CompaniesUsersModule } from './companies-users/companies.users.module';
import { CompaniesModule } from './companies/companies.module';
import { CountriesModule } from './countries/countries.module';
import { CustomersModule } from './customers/customers.module';
import { CurrenciesModule } from './currencies/currencies.module';
import { DepartmentsModule } from './departments/departments.module';
import { ExchangeRatesModule } from './exchange-rates/exchange-rates.module';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { SellersModule } from './sellers/sellers.module';
import { SubcategoriesModule } from './subcategories/subcategories.module';
import { SubdepartmentsModule } from './subdepartments/subdepartments.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { TillsModule } from './tills/tills.module';
import { UsersModule } from './users/users.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { WarehouseBranchModule } from './warehouse-branch/warehouse-branch.module';
import { I18nExceptionFilter } from './common/filters/i18n-exception.filter';
import { I18nModule, QueryResolver, AcceptLanguageResolver } from 'nestjs-i18n';
import * as path from 'path';
import * as fs from 'fs';

// Determinar la ruta correcta de i18n según el entorno
// En desarrollo: src/i18n/, En producción: dist/i18n/
const i18nPath = fs.existsSync(path.join(process.cwd(), 'src/i18n/'))
  ? path.join(process.cwd(), 'src/i18n/') // Desarrollo
  : path.join(process.cwd(), 'i18n/'); // Producción

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'es',
      loaderOptions: {
        path: i18nPath,
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang', 'l'] },
        AcceptLanguageResolver,
      ],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    CountriesModule,
    CustomersModule,
    CashSessionsModule,
    CompaniesUsersModule,
    TillsModule,
    BranchesModule,
    CurrenciesModule,
    DepartmentsModule,
    SubdepartmentsModule,
    CategoriesModule,
    SubcategoriesModule,
    SuppliersModule,
    SellersModule,
    ProductsModule,
    ExchangeRatesModule,
    PaymentMethodsModule,
    WarehouseModule,
    WarehouseBranchModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CompanyAccessGuard,
    },
    {
      provide: APP_FILTER,
      useClass: I18nExceptionFilter,
    },
  ],
})
export class AppModule {}
