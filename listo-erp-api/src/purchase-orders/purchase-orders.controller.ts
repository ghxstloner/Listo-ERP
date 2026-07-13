import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  CurrentCompanyId,
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { PurchaseOrdersService } from './purchase-orders.service';

@ApiTags('purchase-orders')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Company-Id', required: true })
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(
    @Body() dto: CreatePurchaseOrderDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.purchaseOrdersService.create(dto, companyId, user.id);
  }

  @Get()
  findAll(@CurrentCompanyId() companyId: number) {
    return this.purchaseOrdersService.findAll(companyId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.purchaseOrdersService.findOne(id, companyId);
  }

  @Patch(':id/receive')
  @Roles(Role.ADMIN)
  receive(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.purchaseOrdersService.receive(id, companyId, user.id);
  }

  @Patch(':id/cancel')
  @Roles(Role.ADMIN)
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.purchaseOrdersService.cancel(id, companyId, user.id);
  }
}
