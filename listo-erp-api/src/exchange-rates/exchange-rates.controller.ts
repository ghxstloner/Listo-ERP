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
import { CreateExchangeRateDto } from './dto/create-exchange-rate.dto';
import { UpdateExchangeRateDto } from './dto/update-exchange-rate.dto';
import { ExchangeRatesService } from './exchange-rates.service';

@ApiTags('exchange-rates')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Company-Id',
  description: 'ID de la empresa activa',
  required: true,
})
@Controller('exchange-rates')
export class ExchangeRatesController {
  constructor(private readonly exchangeRatesService: ExchangeRatesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Crear nuevo tipo de cambio' })
  async create(
    @Body() createExchangeRateDto: CreateExchangeRateDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.exchangeRatesService.create(
      createExchangeRateDto,
      companyId,
      user.id,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Obtener tipos de cambio de la empresa' })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    description: 'Filtrar por fecha (YYYY-MM-DD)',
  })
  findAll(@CurrentCompanyId() companyId: number, @Query('date') date?: string) {
    return this.exchangeRatesService.findAll(companyId, date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un tipo de cambio por ID' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
  ) {
    return this.exchangeRatesService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar un tipo de cambio' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateExchangeRateDto: UpdateExchangeRateDto,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.exchangeRatesService.update(
      id,
      updateExchangeRateDto,
      companyId,
      user.id,
    );
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Eliminar un tipo de cambio' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentCompanyId() companyId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.exchangeRatesService.remove(id, companyId, user.id);
  }
}
