import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
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
import {
  getMulterOptions,
  MulterUploadFile,
  toRelativePath,
} from '../upload/upload.config';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Company-Id',
  description: 'ID de la empresa activa',
  required: true,
})
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Crear nuevo producto' })
  async create(
    @Body() createProductDto: CreateProductDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.productsService.create(createProductDto, companyId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los productos de la empresa' })
  @ApiQuery({
    name: 'departmentId',
    required: false,
    type: Number,
    description: 'Filtrar por departamento',
  })
  @ApiQuery({
    name: 'subdepartmentId',
    required: false,
    type: Number,
    description: 'Filtrar por subdepartamento',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: Number,
    description: 'Filtrar por categoría',
  })
  @ApiQuery({
    name: 'subcategoryId',
    required: false,
    type: Number,
    description: 'Filtrar por subcategoría',
  })
  findAll(
    @CurrentCompanyId() companyId: number,
    @Query('departmentId') departmentId?: string,
    @Query('subdepartmentId') subdepartmentId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('subcategoryId') subcategoryId?: string,
  ) {
    const parseId = (value?: string) => {
      if (value == null || value === '') return undefined;
      const parsed = parseInt(value, 10);
      return Number.isNaN(parsed) ? undefined : parsed;
    };

    return this.productsService.findAll(companyId, {
      departmentId: parseId(departmentId),
      subdepartmentId: parseId(subdepartmentId),
      categoryId: parseId(categoryId),
      subcategoryId: parseId(subcategoryId),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un producto por ID' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.productsService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar un producto' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.productsService.update(
      id,
      updateProductDto,
      companyId,
      user.id,
    );
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Eliminar un producto' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.productsService.remove(id, companyId, user.id);
  }

  @Post(':id/image')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file', getMulterOptions('products')))
  @ApiOperation({ summary: 'Subir imagen del producto' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
    @UploadedFile() file: MulterUploadFile | undefined,
  ) {
    if (!file?.filename) {
      throw new BadRequestException('Debe enviar un archivo de imagen');
    }
    const relativePath = toRelativePath('products', file.filename);
    return this.productsService.updateImage(id, companyId, relativePath);
  }
}
