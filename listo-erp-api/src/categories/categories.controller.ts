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
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoriesService } from './categories.service';

@ApiTags('categories')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Company-Id',
  description: 'ID de la empresa activa',
  required: true,
})
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Crear nueva categoría' })
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.categoriesService.create(createCategoryDto, companyId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las categorías de la empresa' })
  @ApiQuery({
    name: 'subdepartmentId',
    required: false,
    type: Number,
    description: 'Filtrar por subdepartamento',
  })
  findAll(
    @CurrentCompanyId() companyId: number,
    @Query('subdepartmentId') subdepartmentId?: string,
  ) {
    let subdepartmentIdNum: number | undefined;
    if (subdepartmentId != null && subdepartmentId !== '') {
      const parsed = parseInt(subdepartmentId, 10);
      subdepartmentIdNum = Number.isNaN(parsed) ? undefined : parsed;
    }
    return this.categoriesService.findAll(companyId, subdepartmentIdNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una categoría por ID' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.categoriesService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar una categoría' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.categoriesService.update(
      id,
      updateCategoryDto,
      companyId,
      user.id,
    );
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Eliminar una categoría' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.categoriesService.remove(id, companyId, user.id);
  }

  @Get(':id/subcategories')
  @ApiOperation({ summary: 'Obtener todas las subcategorías de una categoría' })
  async findSubcategories(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.categoriesService.findSubcategoriesByCategory(id, companyId);
  }
}
