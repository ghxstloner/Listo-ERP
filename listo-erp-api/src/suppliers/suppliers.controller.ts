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
import { CurrentCompanyId } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { CreateSupplierProductDto } from './dto/create-supplier-product.dto';
import { UpdateSupplierProductDto } from './dto/update-supplier-product.dto';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { SuppliersService } from './suppliers.service';

@ApiTags('suppliers')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Company-Id',
  description: 'ID de la empresa activa',
  required: true,
})
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Crear nuevo proveedor' })
  async create(
    @Body() createSupplierDto: CreateSupplierDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.suppliersService.create(createSupplierDto, companyId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los proveedores de la empresa' })
  findAll(@CurrentCompanyId() companyId: number) {
    return this.suppliersService.findAll(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un proveedor por ID' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.suppliersService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar un proveedor' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSupplierDto: UpdateSupplierDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.suppliersService.update(
      id,
      updateSupplierDto,
      companyId,
      user.id,
    );
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Eliminar un proveedor' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.suppliersService.remove(id, companyId, user.id);
  }

  @Post(':id/products')
  @Roles(Role.ADMIN)
  async addProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateSupplierProductDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.suppliersService.addProduct(id, dto, companyId, user.id);
  }

  @Get(':id/products')
  findProducts(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.suppliersService.findProducts(id, companyId);
  }

  @Patch(':id/products/:supplierProductId')
  @Roles(Role.ADMIN)
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Param('supplierProductId', ParseIntPipe) supplierProductId: number,
    @Body() dto: UpdateSupplierProductDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.suppliersService.updateProduct(
      id,
      supplierProductId,
      dto,
      companyId,
      user.id,
    );
  }

  @Delete(':id/products/:supplierProductId')
  @Roles(Role.ADMIN)
  async removeProduct(
    @Param('id', ParseIntPipe) id: number,
    @Param('supplierProductId', ParseIntPipe) supplierProductId: number,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.suppliersService.removeProduct(
      id,
      supplierProductId,
      companyId,
      user.id,
    );
  }
}
