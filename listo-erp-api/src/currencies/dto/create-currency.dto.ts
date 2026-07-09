import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCurrencyDto {
  @ApiProperty({ description: 'Código de la moneda (ej. USD, GTQ, EUR)' })
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  code: string;

  @ApiProperty({ description: 'Nombre de la moneda' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Símbolo (ej. $, Q, €)' })
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  symbol: string;
}
