import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CountriesService } from './countries.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('countries')
@ApiBearerAuth()
@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Obtener lista de países' })
  findAll() {
    return this.countriesService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Obtener país por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.countriesService.findOne(id);
  }

  @Public()
  @Get('code/:code')
  @ApiOperation({ summary: 'Obtener país por código ISO (ej: PA, VE, CO)' })
  findByCode(@Param('code') code: string) {
    return this.countriesService.findByCode(code.toUpperCase());
  }
}
