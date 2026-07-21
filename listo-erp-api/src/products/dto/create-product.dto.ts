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
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ description: 'SKU único del producto dentro de la empresa' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  sku: string;

  @ApiProperty({ description: 'Nombre del producto' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Precio de venta' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  salePrice: number;

  @ApiPropertyOptional({
    description: 'Tasa de impuesto como fracción: 0.12 equivale a 12%',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(1)
  taxRate?: number;

  @ApiProperty({ description: 'ID del departamento' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  departmentId: number;

  @ApiPropertyOptional({
    description: 'ID del subdepartamento (debe pertenecer al departamento)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  subdepartmentId?: number;

  @ApiPropertyOptional({
    description: 'ID de la categoría (debe pertenecer al subdepartamento)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional({
    description: 'ID de la subcategoría (debe pertenecer a la categoría)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  subcategoryId?: number;

  @ApiPropertyOptional({
    description: 'Código de unidad de medida DIAN. Se usa ZZ si no se informa.',
    example: 'UND',
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  dianCode?: string | null;

  @ApiPropertyOptional({ description: 'Producto activo', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
