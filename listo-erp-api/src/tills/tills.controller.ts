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
import { CreateTillDto } from './dto/create-till.dto';
import { UpdateTillDto } from './dto/update-till.dto';
import { TillsService } from './tills.service';

@ApiTags('tills')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Company-Id',
  description: 'ID de la empresa activa',
  required: true,
})
@Controller('tills')
export class TillsController {
  constructor(private readonly tillsService: TillsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Crear nueva caja en una sucursal' })
  async create(
    @Body() createTillDto: CreateTillDto,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.tillsService.create(createTillDto, companyId);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las cajas de la empresa' })
  @ApiQuery({
    name: 'branchId',
    required: false,
    type: Number,
    description: 'Filtrar por sucursal',
  })
  findAll(
    @CurrentCompanyId() companyId: number,
    @Query('branchId') branchId?: string,
  ) {
    let branchIdNum: number | undefined;
    if (branchId != null && branchId !== '') {
      const parsed = parseInt(branchId, 10);
      branchIdNum = Number.isNaN(parsed) ? undefined : parsed;
    }
    return this.tillsService.findAll(companyId, branchIdNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una caja por ID' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.tillsService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar una caja' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTillDto: UpdateTillDto,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.tillsService.update(id, updateTillDto, companyId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Eliminar una caja' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.tillsService.remove(id, companyId);
  }
}
