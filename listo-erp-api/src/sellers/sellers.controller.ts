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
import { AssignSellerUsersDto } from './dto/assign-seller-users.dto';
import { CreateSellerDto } from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { SellersService } from './sellers.service';

@ApiTags('sellers')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Company-Id',
  description: 'ID de la empresa activa',
  required: true,
})
@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Crear nuevo vendedor' })
  async create(
    @Body() createSellerDto: CreateSellerDto,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.sellersService.create(createSellerDto, companyId);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los vendedores de la empresa' })
  findAll(@CurrentCompanyId() companyId: number) {
    return this.sellersService.findAll(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un vendedor por ID' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.sellersService.findOne(id, companyId);
  }

  @Patch(':id/users')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Asignar usuarios a un vendedor' })
  async assignUsers(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignSellerUsersDto: AssignSellerUsersDto,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.sellersService.assignUsers(id, assignSellerUsersDto, companyId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar un vendedor' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSellerDto: UpdateSellerDto,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.sellersService.update(id, updateSellerDto, companyId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Eliminar un vendedor' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.sellersService.remove(id, companyId);
  }
}
