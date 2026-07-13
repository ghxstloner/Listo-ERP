import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentCompanyId } from '../auth/decorators/current-user.decorator';
import { InventoryService } from './inventory.service';

@ApiTags('inventory')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Company-Id', required: true })
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('balances')
  @ApiQuery({ name: 'warehouseId', required: false, type: Number })
  balances(
    @CurrentCompanyId() companyId: number,
    @Query('warehouseId', new ParseIntPipe({ optional: true }))
    warehouseId?: number,
  ) {
    return this.inventoryService.findBalances(companyId, warehouseId);
  }

  @Get('movements')
  @ApiQuery({ name: 'warehouseId', required: false, type: Number })
  @ApiQuery({ name: 'productId', required: false, type: Number })
  movements(
    @CurrentCompanyId() companyId: number,
    @Query('warehouseId', new ParseIntPipe({ optional: true }))
    warehouseId?: number,
    @Query('productId', new ParseIntPipe({ optional: true }))
    productId?: number,
  ) {
    return this.inventoryService.findMovements(
      companyId,
      warehouseId,
      productId,
    );
  }

  @Get('branches/:branchId/balances')
  branchBalances(
    @Param('branchId', ParseIntPipe) branchId: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.inventoryService.findBranchBalances(companyId, branchId);
  }
}
