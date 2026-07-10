import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  CurrentCompanyId,
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { WarehouseService } from './warehouse.service';

@ApiTags('warehouses')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Company-Id',
  description: 'Active company ID',
  required: true,
})
@Controller('warehouses')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new warehouse' })
  async create(
    @Body() createWarehouseDto: CreateWarehouseDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.warehouseService.create(createWarehouseDto, companyId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all company warehouses' })
  @ApiQuery({
    name: 'includeBranches',
    required: false,
    type: Boolean,
    description: 'Include assigned branches',
  })
  findAll(
    @CurrentCompanyId() companyId: number,
    @Query('includeBranches') includeBranches?: string,
  ) {
    const include = includeBranches === 'true' || includeBranches === '1';
    return this.warehouseService.findAll(companyId, include);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a warehouse by ID' })
  @ApiQuery({
    name: 'includeBranches',
    required: false,
    type: Boolean,
    description: 'Include assigned branches',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
    @Query('includeBranches') includeBranches?: string,
  ) {
    const include = includeBranches === 'true' || includeBranches === '1';
    return this.warehouseService.findOne(id, companyId, include);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a warehouse' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWarehouseDto: UpdateWarehouseDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.warehouseService.update(
      id,
      updateWarehouseDto,
      companyId,
      user.id,
    );
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a warehouse' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.warehouseService.remove(id, companyId, user.id);
  }

  @Get(':id/branches')
  @ApiOperation({ summary: 'Get all branches assigned to a warehouse' })
  async findBranches(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.warehouseService.findBranchesByWarehouse(id, companyId);
  }
}
