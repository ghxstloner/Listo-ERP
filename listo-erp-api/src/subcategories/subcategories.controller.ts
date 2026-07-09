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
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { SubcategoriesService } from './subcategories.service';

@ApiTags('subcategories')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Company-Id',
  description: 'ID de la empresa activa',
  required: true,
})
@Controller('subcategories')
export class SubcategoriesController {
  constructor(private readonly subcategoriesService: SubcategoriesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Crear nueva subcategoría' })
  async create(
    @Body() createSubcategoryDto: CreateSubcategoryDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.subcategoriesService.create(
      createSubcategoryDto,
      companyId,
      user.id,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las subcategorías de la empresa' })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: Number,
    description: 'Filtrar por categoría',
  })
  findAll(
    @CurrentCompanyId() companyId: number,
    @Query('categoryId') categoryId?: string,
  ) {
    let categoryIdNum: number | undefined;
    if (categoryId != null && categoryId !== '') {
      const parsed = parseInt(categoryId, 10);
      categoryIdNum = Number.isNaN(parsed) ? undefined : parsed;
    }
    return this.subcategoriesService.findAll(companyId, categoryIdNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una subcategoría por ID' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.subcategoriesService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar una subcategoría' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSubcategoryDto: UpdateSubcategoryDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.subcategoriesService.update(
      id,
      updateSubcategoryDto,
      companyId,
      user.id,
    );
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Eliminar una subcategoría' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.subcategoriesService.remove(id, companyId, user.id);
  }
}
