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
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentCompanyId, CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';
import { SeriesService } from './series.service';

@ApiTags('series')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Company-Id', description: 'ID de la empresa activa', required: true })
@Controller('series')
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Crear nueva serie' })
  async create(
    @Body() createSeriesDto: CreateSeriesDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.seriesService.create(createSeriesDto, companyId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las series de la empresa' })
  findAll(@CurrentCompanyId() companyId: number) {
    return this.seriesService.findAll(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una serie por ID' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.seriesService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar una serie' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSeriesDto: UpdateSeriesDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.seriesService.update(id, updateSeriesDto, companyId, user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Eliminar una serie' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.seriesService.remove(id, companyId, user.id);
  }
}
