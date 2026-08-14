import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

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

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @Min(0)
  @Max(4)
  @IsOptional()
  decimalPlaces?: number;

  @IsString()
  @IsIn(['.', ','])
  @IsOptional()
  decimalSeparator?: string;

  @IsString()
  @IsIn(['.', ',', ' '])
  @IsOptional()
  thousandsSeparator?: string;

  @IsString()
  @IsIn(['symbol_before', 'symbol_after', 'code_before', 'code_after'])
  @IsOptional()
  format?: string;

  @IsString()
  @IsIn(['half_up', 'half_even', 'up', 'down'])
  @IsOptional()
  rounding?: string;
}
