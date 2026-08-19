import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentCompanyId } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Company-Id', required: true })
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @RequirePermissions('dashboard')
  @ApiOperation({ summary: 'Obtener el resumen de métricas del dashboard' })
  getSummary(@CurrentCompanyId() companyId: number) {
    return this.dashboardService.getSummary(companyId);
  }

  @Get('top-products')
  @RequirePermissions('dashboard')
  @ApiOperation({ summary: 'Obtener los productos más vendidos del mes' })
  getTopProducts(@CurrentCompanyId() companyId: number) {
    return this.dashboardService.getTopProducts(companyId);
  }

  @Get('monthly-sales-profit')
  @RequirePermissions('dashboard')
  @ApiOperation({ summary: 'Obtener ventas y utilidad de los últimos 12 meses' })
  getMonthlySalesProfit(@CurrentCompanyId() companyId: number) {
    return this.dashboardService.getMonthlySalesProfit(companyId);
  }

  @Get('weekly-sales')
  @RequirePermissions('dashboard')
  @ApiOperation({ summary: 'Obtener ventas de la semana actual' })
  getWeeklySales(@CurrentCompanyId() companyId: number) {
    return this.dashboardService.getWeeklySales(companyId);
  }

  @Get('top-customers')
  @RequirePermissions('dashboard')
  @ApiOperation({ summary: 'Obtener los mejores clientes del mes' })
  getTopCustomers(@CurrentCompanyId() companyId: number) {
    return this.dashboardService.getTopCustomers(companyId);
  }

  @Get('top-sellers')
  @RequirePermissions('dashboard')
  @ApiOperation({ summary: 'Obtener los mejores vendedores del mes' })
  getTopSellers(@CurrentCompanyId() companyId: number) {
    return this.dashboardService.getTopSellers(companyId);
  }

  @Get('top-departments')
  @RequirePermissions('dashboard')
  @ApiOperation({ summary: 'Obtener los mejores departamentos del mes' })
  getTopDepartments(@CurrentCompanyId() companyId: number) {
    return this.dashboardService.getTopDepartments(companyId);
  }

  @Get('payment-method-sales')
  @RequirePermissions('dashboard')
  @ApiOperation({ summary: 'Obtener ventas agrupadas por método de pago' })
  getPaymentMethodSales(@CurrentCompanyId() companyId: number) {
    return this.dashboardService.getPaymentMethodSales(companyId);
  }
}
