import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNumber, Min } from 'class-validator';

export class CreateExchangeRateDto {
  @ApiProperty({ description: 'ID de la moneda origen' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  fromCurrencyId: number;

  @ApiProperty({ description: 'ID de la moneda destino (ej. moneda base)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  toCurrencyId: number;

  @ApiProperty({ description: 'Fecha del tipo de cambio (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiProperty({
    description:
      'Tasa: 1 unidad de moneda origen = rate unidades de moneda destino',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rate: number;
}
