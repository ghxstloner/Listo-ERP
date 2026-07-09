import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class UpdateExchangeRateDto {
  @ApiPropertyOptional({ description: 'ID de la moneda origen' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  fromCurrencyId?: number;

  @ApiPropertyOptional({ description: 'ID de la moneda destino' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  toCurrencyId?: number;

  @ApiPropertyOptional({ description: 'Fecha del tipo de cambio (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Tasa de cambio' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rate?: number;
}
