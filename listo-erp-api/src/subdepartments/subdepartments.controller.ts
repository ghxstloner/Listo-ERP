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
import { CurrentCompanyId } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateSubdepartmentDto } from './dto/create-subdepartment.dto';
import { UpdateSubdepartmentDto } from './dto/update-subdepartment.dto';
import { SubdepartmentsService } from './subdepartments.service';

@ApiTags('subdepartments')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Company-Id',
  description: 'ID de la empresa activa',
  required: true,
})
@Controller('subdepartments')
export class SubdepartmentsController {
  constructor(private readonly subdepartmentsService: SubdepartmentsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Crear nuevo subdepartamento' })
  async create(
    @Body() createSubdepartmentDto: CreateSubdepartmentDto,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.subdepartmentsService.create(createSubdepartmentDto, companyId);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los subdepartamentos de la empresa' })
  @ApiQuery({
    name: 'departmentId',
    required: false,
    type: Number,
    description: 'Filtrar por departamento',
  })
  findAll(
    @CurrentCompanyId() companyId: number,
    @Query('departmentId') departmentId?: string,
  ) {
    let departmentIdNum: number | undefined;
    if (departmentId != null && departmentId !== '') {
      const parsed = parseInt(departmentId, 10);
      departmentIdNum = Number.isNaN(parsed) ? undefined : parsed;
    }
    return this.subdepartmentsService.findAll(companyId, departmentIdNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un subdepartamento por ID' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.subdepartmentsService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar un subdepartamento' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSubdepartmentDto: UpdateSubdepartmentDto,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.subdepartmentsService.update(
      id,
      updateSubdepartmentDto,
      companyId,
    );
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Eliminar un subdepartamento' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.subdepartmentsService.remove(id, companyId);
  }

  @Get(':id/categories')
  @ApiOperation({
    summary: 'Obtener todas las categorías de un subdepartamento',
  })
  async findCategories(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.subdepartmentsService.findCategoriesBySubdepartment(
      id,
      companyId,
    );
  }
}
