import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCurrencyDto {
  @ApiPropertyOptional({ description: 'Código de la moneda' })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(10)
  code?: string;

  @ApiPropertyOptional({ description: 'Nombre de la moneda' })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Símbolo' })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(10)
  symbol?: string;
}
