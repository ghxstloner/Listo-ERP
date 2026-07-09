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
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentsService } from './departments.service';

@ApiTags('departments')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Company-Id',
  description: 'ID de la empresa activa',
  required: true,
})
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Crear nuevo departamento' })
  async create(
    @Body() createDepartmentDto: CreateDepartmentDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.departmentsService.create(
      createDepartmentDto,
      companyId,
      user.id,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los departamentos de la empresa' })
  @ApiQuery({
    name: 'includeSubdepartments',
    required: false,
    type: Boolean,
    description: 'Incluir subdepartamentos',
  })
  findAll(
    @CurrentCompanyId() companyId: number,
    @Query('includeSubdepartments') includeSubdepartments?: string,
  ) {
    const include =
      includeSubdepartments === 'true' || includeSubdepartments === '1';
    return this.departmentsService.findAll(companyId, include);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un departamento por ID' })
  @ApiQuery({
    name: 'includeSubdepartments',
    required: false,
    type: Boolean,
    description: 'Incluir subdepartamentos',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
    @Query('includeSubdepartments') includeSubdepartments?: string,
  ) {
    const include =
      includeSubdepartments === 'true' || includeSubdepartments === '1';
    return this.departmentsService.findOne(id, companyId, include);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar un departamento' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.departmentsService.update(
      id,
      updateDepartmentDto,
      companyId,
      user.id,
    );
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Eliminar un departamento' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.departmentsService.remove(id, companyId, user.id);
  }

  @Get(':id/subdepartments')
  @ApiOperation({
    summary: 'Obtener todos los subdepartamentos de un departamento',
  })
  async findSubdepartments(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.departmentsService.findSubdepartmentsByDepartment(
      id,
      companyId,
    );
  }
}
