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
import { TillsService } from '../tills/tills.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BranchesService } from './branches.service';

@ApiTags('branches')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Company-Id',
  description: 'ID de la empresa activa',
  required: true,
})
@Controller('branches')
export class BranchesController {
  constructor(
    private readonly branchesService: BranchesService,
    private readonly tillsService: TillsService,
  ) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Crear nueva sucursal en la empresa' })
  async create(
    @Body() createBranchDto: CreateBranchDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.branchesService.create(createBranchDto, companyId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las sucursales de la empresa' })
  @ApiQuery({
    name: 'includeTills',
    required: false,
    type: Boolean,
    description: 'Incluir las cajas de cada sucursal',
  })
  findAll(
    @CurrentCompanyId() companyId: number,
    @Query('includeTills') includeTills?: string,
  ) {
    const include = includeTills === 'true' || includeTills === '1';
    return this.branchesService.findAll(companyId, include);
  }

  @Get(':id/tills')
  @ApiOperation({ summary: 'Obtener las cajas de una sucursal' })
  async findTills(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.tillsService.findAllByBranch(companyId, id);
  }

  @Get(':id/warehouses')
  @ApiOperation({ summary: 'Obtener los almacenes asignados a una sucursal' })
  async findWarehouses(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.branchesService.findWarehousesByBranch(id, companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una sucursal por ID' })
  @ApiQuery({
    name: 'includeTills',
    required: false,
    type: Boolean,
    description: 'Incluir las cajas de la sucursal',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
    @Query('includeTills') includeTills?: string,
  ) {
    const include = includeTills === 'true' || includeTills === '1';
    return this.branchesService.findOne(id, companyId, include);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar una sucursal' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBranchDto: UpdateBranchDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.branchesService.update(id, updateBranchDto, companyId, user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Eliminar una sucursal' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.branchesService.remove(id, companyId, user.id);
  }
}
