import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import {
  CurrentCompanyId,
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Company-Id', required: true })
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(
    @Body() dto: CreateOrderDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.ordersService.create(dto, companyId, user.id);
  }

  @Get()
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'PAID', 'CANCELLED', 'all'],
  })
  @ApiQuery({ name: 'customerId', required: false, type: Number })
  @ApiQuery({ name: 'branchIds', required: false, type: String })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  findAll(
    @CurrentCompanyId() companyId: number,
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
    @Query('branchIds') branchIds?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.ordersService.findAll(companyId, {
      status,
      customerId: customerId ? Number(customerId) : undefined,
      branchIds: branchIds
        ?.split(',')
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0),
      dateFrom,
      dateTo,
    });
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.ordersService.findOne(id, companyId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.ordersService.update(id, dto, companyId, user.id);
  }

  @Patch(':id/cancel')
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.ordersService.cancel(id, companyId, user.id);
  }
}
