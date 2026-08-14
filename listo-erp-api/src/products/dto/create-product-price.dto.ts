import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductPriceDto {
  @ApiPropertyOptional({ description: 'Nombre del precio' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Alias del precio; equivale a name' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  label?: string;

  @ApiProperty({ description: 'Valor del precio', minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Precio activo', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Orden de presentación', default: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  @Max(2147483647)
  sortOrder?: number;
}
