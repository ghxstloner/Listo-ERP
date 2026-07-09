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
  description: 'ID de la empresa activa',
  required: true,
})
@Controller('warehouse-branches')
export class WarehouseBranchController {
  constructor(
    private readonly warehouseBranchService: WarehouseBranchService,
  ) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Asignar un almacén a una sucursal' })
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
  @ApiOperation({ summary: 'Obtener todas las asignaciones de la empresa' })
  findAll(@CurrentCompanyId() companyId: number) {
    return this.warehouseBranchService.findAll(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una asignación por ID' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.warehouseBranchService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar una asignación' })
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
  @ApiOperation({ summary: 'Eliminar una asignación' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.warehouseBranchService.remove(id, companyId, user.id);
  }

  @Get('by-branch/:branchId')
  @ApiOperation({ summary: 'Obtener almacenes asignados a una sucursal' })
  async findByBranch(
    @Param('branchId', ParseIntPipe) branchId: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.warehouseBranchService.findByBranch(branchId, companyId);
  }

  @Get('by-warehouse/:warehouseId')
  @ApiOperation({ summary: 'Obtener sucursales asignadas a un almacén' })
  async findByWarehouse(
    @Param('warehouseId', ParseIntPipe) warehouseId: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.warehouseBranchService.findByWarehouse(warehouseId, companyId);
  }
}
