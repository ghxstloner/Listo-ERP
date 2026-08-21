import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
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
import { CreateInventoryTransferDto } from './dto/create-inventory-transfer.dto';
import { InventoryTransfersService } from './inventory-transfers.service';
@ApiTags('inventory-transfers')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Company-Id', required: true })
@Controller('inventory-transfers')
export class InventoryTransfersController {
  constructor(private readonly service: InventoryTransfersService) {}
  @Post() @Roles(Role.ADMIN) create(
    @Body() dto: CreateInventoryTransferDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.create(dto, companyId, user.id);
  }
  @Get() findAll(@CurrentCompanyId() companyId: number) {
    return this.service.findAll(companyId);
  }
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.service.findOne(id, companyId);
  }
}
