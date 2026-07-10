import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  CurrentCompanyId,
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateWarehouseBranchDto } from './dto/create-warehouse-branch.dto';
import { UpdateWarehouseBranchDto } from './dto/update-warehouse-branch.dto';
import { WarehouseBranchService } from './warehouse-branch.service';

@ApiTags('warehouse-branches')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Company-Id',
  description: 'Active company ID',
  required: true,
})
@Controller('warehouse-branches')
export class WarehouseBranchController {
  constructor(
    private readonly warehouseBranchService: WarehouseBranchService,
  ) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Assign a warehouse to a branch' })
  async create(
    @Body() createWarehouseBranchDto: CreateWarehouseBranchDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.warehouseBranchService.create(
      createWarehouseBranchDto,
      companyId,
      user.id,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all company assignments' })
  findAll(@CurrentCompanyId() companyId: number) {
    return this.warehouseBranchService.findAll(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an assignment by ID' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.warehouseBranchService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update an assignment' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWarehouseBranchDto: UpdateWarehouseBranchDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.warehouseBranchService.update(
      id,
      updateWarehouseBranchDto,
      companyId,
      user.id,
    );
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete an assignment' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.warehouseBranchService.remove(id, companyId, user.id);
  }

  @Get('by-branch/:branchId')
  @ApiOperation({ summary: 'Get warehouses assigned to a branch' })
  async findByBranch(
    @Param('branchId', ParseIntPipe) branchId: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.warehouseBranchService.findByBranch(branchId, companyId);
  }

  @Get('by-warehouse/:warehouseId')
  @ApiOperation({ summary: 'Get branches assigned to a warehouse' })
  async findByWarehouse(
    @Param('warehouseId', ParseIntPipe) warehouseId: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.warehouseBranchService.findByWarehouse(warehouseId, companyId);
  }
}
